import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Define the Wishlist interface
export interface WishlistInterface {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the attributes for Wishlist creation
interface WishlistCreationAttributes extends Optional<WishlistInterface, 'id' | 'createdAt' | 'updatedAt'> {}

// Define the Wishlist model class
class Wishlist extends Model<WishlistInterface, WishlistCreationAttributes> implements WishlistInterface {
  public id!: number;
  public userId!: number;
  public productId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to check if a product is in user's wishlist
  public static async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const item = await this.findOne({
      where: { userId, productId },
    });
    return !!item;
  }

  // Static method to add product to wishlist
  public static async addToWishlist(userId: number, productId: number): Promise<Wishlist> {
    const [wishlistItem, created] = await this.findOrCreate({
      where: { userId, productId },
      defaults: { userId, productId },
    });
    return wishlistItem;
  }

  // Static method to remove product from wishlist
  public static async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    const deleted = await this.destroy({
      where: { userId, productId },
    });
    return deleted > 0;
  }

  // Static method to get user's wishlist with product details
  public static async getUserWishlist(userId: number): Promise<any[]> {
    const Product = sequelize.models.Product;
    const Category = sequelize.models.Category;
    
    return await this.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'slug'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // Static method to get wishlist count for user
  public static async getWishlistCount(userId: number): Promise<number> {
    return await this.count({
      where: { userId },
    });
  }
}

// Initialize the model
Wishlist.init(
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
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    modelName: 'Wishlist',
    tableName: 'wishlists',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id'],
        name: 'unique_user_product_wishlist',
      },
      {
        fields: ['user_id'],
        name: 'wishlist_user_id_index',
      },
      {
        fields: ['product_id'],
        name: 'wishlist_product_id_index',
      },
    ],
  }
);

export default Wishlist;