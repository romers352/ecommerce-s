import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Order as OrderInterface, OrderItem as OrderItemInterface, Address } from '../types';
import { v4 as _uuidv4 } from 'uuid';

// Define the attributes for Order creation
interface OrderCreationAttributes extends Optional<OrderInterface, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber' | 'status' | 'paymentStatus' | 'paymentIntentId' | 'currency' | 'notes' | 'trackingNumber' | 'shippedAt' | 'deliveredAt'> {}

// Define the attributes for OrderItem creation
interface OrderItemCreationAttributes extends Optional<OrderItemInterface, 'id' | 'createdAt' | 'updatedAt'> {}

// Define the Order model class
class Order extends Model<OrderInterface, OrderCreationAttributes> implements OrderInterface {
  public id!: number;
  public userId!: number;
  public orderNumber!: string;
  public status!: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  public paymentStatus!: 'pending' | 'paid' | 'failed' | 'refunded';
  public paymentMethod!: string;
  public paymentIntentId?: string;
  public subtotal!: number;
  public tax!: number;
  public shipping!: number;
  public discount!: number;
  public total!: number;
  public currency!: string;
  public shippingAddress!: Address;
  public billingAddress!: Address;
  public notes?: string;
  public trackingNumber?: string;
  public shippedAt?: Date;
  public deliveredAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user?: any;
  public items?: OrderItem[];

  // Instance methods
  public async updateStatus(newStatus: Order['status']): Promise<void> {
    const oldStatus = this.status;
    this.status = newStatus;

    // Set timestamps based on status
    if (newStatus === 'shipped' && !this.shippedAt) {
      this.shippedAt = new Date();
    }
    if (newStatus === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }

    await this.save();

    // Handle stock restoration for cancelled orders
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      await this.restoreStock();
    }
  }

  public async updatePaymentStatus(newStatus: Order['paymentStatus']): Promise<void> {
    this.paymentStatus = newStatus;
    await this.save();
  }

  public async addTrackingNumber(trackingNumber: string): Promise<void> {
    this.trackingNumber = trackingNumber;
    if (this.status === 'processing') {
      await this.updateStatus('shipped');
    } else {
      await this.save();
    }
  }

  public async restoreStock(): Promise<void> {
    const items = await OrderItem.findAll({ where: { orderId: this.id } });
    
    for (const item of items) {
      const product = await sequelize.models.Product.findByPk(item.productId);
      if (product) {
        (product as any).stock += item.quantity;
        await product.save();
      }
    }
  }

  public async reduceStock(): Promise<void> {
    const items = await OrderItem.findAll({ where: { orderId: this.id } });
    
    for (const item of items) {
      const product = await sequelize.models.Product.findByPk(item.productId);
      if (product) {
        if ((product as any).stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${(product as any).name}`);
        }
        (product as any).stock -= item.quantity;
        await product.save();
      }
    }
  }

  public getStatusColor(): string {
    const colors: { [key: string]: string } = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444',
      refunded: '#6b7280',
    };
    return colors[this.status] || '#6b7280';
  }

  public canBeCancelled(): boolean {
    return ['pending', 'processing'].includes(this.status);
  }

  public canBeRefunded(): boolean {
    return this.status === 'delivered' && this.paymentStatus === 'paid';
  }

  // Static methods
  public static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-6)}-${random}`;
  }

  public static async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.findOne({
      where: { orderNumber },
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          association: 'items',
          include: [
            {
              association: 'product',
              attributes: ['id', 'name', 'slug', 'images'],
            },
          ],
        },
      ],
    });
  }

  public static async findByUser(userId: number, limit?: number): Promise<Order[]> {
    const options: any = {
      where: { userId },
      include: [
        {
          association: 'items',
          include: [
            {
              association: 'product',
              attributes: ['id', 'name', 'slug', 'images'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    };

    if (limit) {
      options.limit = limit;
    }

    return this.findAll(options);
  }

  public static async getRecentOrders(limit: number = 10): Promise<Order[]> {
    return this.findAll({
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          association: 'items',
          include: [
            {
              association: 'product',
              attributes: ['id', 'name', 'slug'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  public static async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    return this.findAll({
      where: { status },
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          association: 'items',
          include: [
            {
              association: 'product',
              attributes: ['id', 'name', 'slug'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  public static async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    const [total, pending, processing, shipped, delivered, cancelled] = await Promise.all([
      this.count(),
      this.count({ where: { status: 'pending' } }),
      this.count({ where: { status: 'processing' } }),
      this.count({ where: { status: 'shipped' } }),
      this.count({ where: { status: 'delivered' } }),
      this.count({ where: { status: 'cancelled' } }),
    ]);

    const revenueResult = await this.findOne({
      where: {
        paymentStatus: 'paid',
        status: {
          [Op.ne]: 'cancelled',
        },
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
      ],
      raw: true,
    });

    const totalRevenue = parseFloat((revenueResult as any)?.totalRevenue || '0');

    return {
      total,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      totalRevenue,
    };
  }

  public static async getSalesData(days: number = 30): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
        paymentStatus: 'paid',
        status: {
          [Op.ne]: 'cancelled',
        },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('SUM', sequelize.col('total')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    return results.map((result: any) => ({
      date: result.date,
      revenue: parseFloat(result.revenue),
      orders: parseInt(result.orders),
    }));
  }
}

// Define the OrderItem model class
class OrderItem extends Model<OrderItemInterface, OrderItemCreationAttributes> implements OrderItemInterface {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public quantity!: number;
  public price!: number;
  public total!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public product?: any;
  public order?: any;

  // Instance methods
  public calculateTotal(): number {
    return this.price * this.quantity;
  }
}

// Initialize the Order model
Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    paymentIntentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    shipping: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    billingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['order_number'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['payment_status'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['total'],
      },
    ],
    hooks: {
      beforeCreate: async (order: Order) => {
        if (!order.orderNumber) {
          order.orderNumber = Order.generateOrderNumber();
        }
      },
      afterCreate: async (order: Order) => {
        if (order.status === 'processing' || order.paymentStatus === 'paid') {
          await order.reduceStock();
        }
      },
    },
  }
);

// Initialize the OrderItem model
OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
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
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['order_id'],
      },
      {
        fields: ['product_id'],
      },
    ],
    hooks: {
      beforeSave: async (orderItem: OrderItem) => {
        orderItem.total = orderItem.calculateTotal();
      },
    },
  }
);

export default Order;
export { Order, OrderItem };