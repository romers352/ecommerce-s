import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';
import { CartItem as CartItemInterface } from '../types';

// Define the attributes for CartItem creation
interface CartItemCreationAttributes extends Optional<CartItemInterface, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'sessionId'> {}

// Define the CartItem model class
class CartItem extends Model<CartItemInterface, CartItemCreationAttributes> implements CartItemInterface {
  public id!: number;
  public userId?: number;
  public sessionId?: string;
  public productId!: number;
  public quantity!: number;
  public price!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public product?: any;
  public user?: any;

  // Instance methods
  public getTotal(): number {
    return this.price * this.quantity;
  }

  public async updateQuantity(newQuantity: number): Promise<void> {
    if (newQuantity <= 0) {
      await this.destroy();
      return;
    }

    this.quantity = newQuantity;
    await this.save();
  }

  public async updatePrice(): Promise<void> {
    const product = await sequelize.models.Product.findByPk(this.productId);
    if (product) {
      // Use sale price if available, otherwise regular price
      const currentPrice = (product as any).salePrice || (product as any).price;
      if (this.price !== currentPrice) {
        this.price = currentPrice;
        await this.save();
      }
    }
  }

  public async validateStock(): Promise<boolean> {
    const product = await sequelize.models.Product.findByPk(this.productId);
    if (!product) return false;
    
    return (product as any).stock >= this.quantity;
  }

  // Static methods
  public static async findByUser(userId: number): Promise<CartItem[]> {
    return this.findAll({
      where: { userId },
      include: [
        {
          association: 'product',
          attributes: ['id', 'name', 'slug', 'images', 'price', 'salePrice', 'stock', 'isActive'],
          where: { isActive: true },
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  public static async findBySession(sessionId: string): Promise<CartItem[]> {
    return this.findAll({
      where: { sessionId },
      include: [
        {
          association: 'product',
          attributes: ['id', 'name', 'slug', 'images', 'price', 'salePrice', 'stock', 'isActive'],
          where: { isActive: true },
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  public static async findByUserOrSession(userId?: number, sessionId?: string): Promise<CartItem[]> {
    if (userId) {
      return this.findByUser(userId);
    } else if (sessionId) {
      return this.findBySession(sessionId);
    }
    return [];
  }

  public static async addItem(
    productId: number,
    quantity: number,
    userId?: number,
    sessionId?: string
  ): Promise<CartItem> {
    // Get product to validate and get current price
    const product = await sequelize.models.Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!(product as any).isActive) {
      throw new Error('Product is not available');
    }

    if ((product as any).stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const currentPrice = (product as any).salePrice || (product as any).price;

    // Check if item already exists in cart
    const whereClause: any = { productId };
    if (userId) {
      whereClause.userId = userId;
    } else if (sessionId) {
      whereClause.sessionId = sessionId;
    } else {
      throw new Error('Either userId or sessionId must be provided');
    }

    const existingItem = await this.findOne({ where: whereClause });

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity;
      if ((product as any).stock < newQuantity) {
        throw new Error('Insufficient stock for requested quantity');
      }
      
      existingItem.quantity = newQuantity;
      existingItem.price = currentPrice; // Update price in case it changed
      await existingItem.save();
      return existingItem;
    } else {
      // Create new item
      return this.create({
        productId,
        quantity,
        price: currentPrice,
        userId,
        sessionId,
      });
    }
  }

  public static async removeItem(itemId: number, userId?: number, sessionId?: string): Promise<boolean> {
    const whereClause: any = { id: itemId };
    if (userId) {
      whereClause.userId = userId;
    } else if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    const item = await this.findOne({ where: whereClause });
    if (item) {
      await item.destroy();
      return true;
    }
    return false;
  }

  public static async updateItemQuantity(
    itemId: number,
    quantity: number,
    userId?: number,
    sessionId?: string
  ): Promise<CartItem | null> {
    const whereClause: any = { id: itemId };
    if (userId) {
      whereClause.userId = userId;
    } else if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    const item = await this.findOne({ where: whereClause });
    if (!item) return null;

    if (quantity <= 0) {
      await item.destroy();
      return null;
    }

    // Validate stock
    const product = await sequelize.models.Product.findByPk(item.productId);
    if (!product || (product as any).stock < quantity) {
      throw new Error('Insufficient stock');
    }

    item.quantity = quantity;
    await item.save();
    return item;
  }

  public static async clearCart(userId?: number, sessionId?: string): Promise<number> {
    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    } else if (sessionId) {
      whereClause.sessionId = sessionId;
    } else {
      return 0;
    }

    return this.destroy({ where: whereClause });
  }

  public static async getCartSummary(userId?: number, sessionId?: string): Promise<{
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    total: number;
  }> {
    const items = await this.findByUserOrSession(userId, sessionId);
    
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.getTotal(), 0);
    
    return {
      items,
      itemCount,
      subtotal,
      total: subtotal, // Can add tax, shipping, etc. later
    };
  }

  public static async mergeSessionCart(sessionId: string, userId: number): Promise<void> {
    const sessionItems = await this.findBySession(sessionId);
    
    for (const sessionItem of sessionItems) {
      try {
        await this.addItem(
          sessionItem.productId,
          sessionItem.quantity,
          userId
        );
      } catch (error) {
        // If there's an error (like insufficient stock), skip this item
        // console.error(`Error merging cart item ${sessionItem.id}:`, error);
      }
    }
    
    // Clear session cart after merging
    await this.clearCart(undefined, sessionId);
  }

  public static async updateAllPrices(): Promise<void> {
    const items = await this.findAll({
      include: [
        {
          association: 'product',
          attributes: ['id', 'price', 'salePrice'],
        },
      ],
    });

    for (const item of items) {
      await item.updatePrice();
    }
  }

  public static async cleanupExpiredSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.destroy({
      where: {
        sessionId: {
          [Op.ne]: '',
        },
        updatedAt: {
          [Op.lt]: cutoffDate,
        },
      },
    });
  }
}

// Initialize the CartItem model
CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [1, 255],
          msg: 'Session ID must be between 1 and 255 characters',
        },
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      validate: {
        notEmpty: {
          msg: 'Product ID is required',
        },
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Quantity must be at least 1',
        },
        max: {
          args: [999],
          msg: 'Quantity cannot exceed 999',
        },
        isInt: {
          msg: 'Quantity must be an integer',
        },
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0.01],
          msg: 'Price must be greater than 0',
        },
        isDecimal: {
          msg: 'Price must be a valid decimal number',
        },
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['session_id'],
      },
      {
        fields: ['product_id'],
      },
      {
        unique: true,
        fields: ['user_id', 'product_id'],
        name: 'unique_user_product_cart',
      },
      {
        unique: true,
        fields: ['session_id', 'product_id'],
        name: 'unique_session_product_cart',
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['updated_at'],
      },
    ],
    validate: {
      userOrSessionRequired() {
        if (!this.userId && !this.sessionId) {
          throw new Error('Either userId or sessionId must be provided');
        }
        if (this.userId && this.sessionId) {
          throw new Error('Cannot have both userId and sessionId');
        }
      },
    },
    hooks: {
      beforeCreate: async (cartItem: CartItem) => {
        // Validate product exists and is active
        const product = await sequelize.models.Product.findByPk(cartItem.productId);
        if (!product) {
          throw new Error('Product not found');
        }
        if (!(product as any).isActive) {
          throw new Error('Product is not available');
        }
      },
      beforeUpdate: async (cartItem: CartItem) => {
        // Validate product is still active
        const product = await sequelize.models.Product.findByPk(cartItem.productId);
        if (!product || !(product as any).isActive) {
          throw new Error('Product is no longer available');
        }
      },
    },
    defaultScope: {
      include: [
        {
          association: 'product',
          attributes: ['id', 'name', 'slug', 'images', 'price', 'salePrice', 'stock', 'isActive'],
          where: { isActive: true },
        },
      ],
      order: [['createdAt', 'ASC']],
    },
    scopes: {
      all: {
        where: {},
      },
      withProduct: {
        include: [
          {
            association: 'product',
            attributes: ['id', 'name', 'slug', 'images', 'price', 'salePrice', 'stock', 'isActive'],
          },
        ],
      },
      withUser: {
        include: [
          {
            association: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
      userCarts: {
        where: {
          userId: {
            [Op.gt]: 0,
          },
        },
      },
      sessionCarts: {
        where: {
          sessionId: {
            [Op.ne]: '',
          },
        },
      },
      recent: {
        order: [['updatedAt', 'DESC']],
      },
    },
  }
);

export default CartItem;
export { CartItem };