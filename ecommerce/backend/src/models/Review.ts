import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Review as ReviewInterface } from '../types';

// Define the attributes for Review creation
interface ReviewCreationAttributes extends Optional<ReviewInterface, 'id' | 'createdAt' | 'updatedAt' | 'title' | 'comment' | 'isVerified' | 'isApproved' | 'helpfulCount'> {}

// Define the Review model class
class Review extends Model<ReviewInterface, ReviewCreationAttributes> implements ReviewInterface {
  public id!: number;
  public userId!: number;
  public productId!: number;
  public rating!: number;
  public title?: string;
  public comment?: string;
  public isVerified!: boolean;
  public isApproved!: boolean;
  public helpfulCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user?: any;
  public product?: any;

  // Instance methods
  public async markAsHelpful(): Promise<void> {
    this.helpfulCount += 1;
    await this.save();
  }

  public async approve(): Promise<void> {
    this.isApproved = true;
    await this.save();
    
    // Update product rating after approval
    const product = await sequelize.models.Product.findByPk(this.productId);
    if (product) {
      await (product as any).updateRating();
    }
  }

  public async reject(): Promise<void> {
    this.isApproved = false;
    await this.save();
    
    // Update product rating after rejection
    const product = await sequelize.models.Product.findByPk(this.productId);
    if (product) {
      await (product as any).updateRating();
    }
  }

  public getStarDisplay(): string {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
  }

  // Static methods
  public static async findByProduct(productId: number, approved: boolean = true): Promise<Review[]> {
    const whereClause: any = { productId };
    if (approved) {
      whereClause.isApproved = true;
    }

    return this.findAll({
      where: whereClause,
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  public static async findByUser(userId: number): Promise<Review[]> {
    return this.findAll({
      where: { userId },
      include: [
        {
          association: 'product',
          attributes: ['id', 'name', 'slug', 'images'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  public static async findPending(): Promise<Review[]> {
    return this.findAll({
      where: { isApproved: false },
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          association: 'product',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  public static async getAverageRating(productId: number): Promise<number> {
    const result = await this.findOne({
      where: {
        productId,
        isApproved: true,
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      ],
      raw: true,
    });

    return result ? parseFloat((result as any).averageRating) || 0 : 0;
  }

  public static async getRatingDistribution(productId: number): Promise<{ [key: number]: number }> {
    const results = await this.findAll({
      where: {
        productId,
        isApproved: true,
      },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('rating')), 'count'],
      ],
      group: ['rating'],
      raw: true,
    });

    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    results.forEach((result: any) => {
      distribution[result.rating] = parseInt(result.count);
    });

    return distribution;
  }

  public static async hasUserReviewed(userId: number, productId: number): Promise<boolean> {
    const review = await this.findOne({
      where: { userId, productId },
    });
    return !!review;
  }

  public static async getRecentReviews(limit: number = 10): Promise<Review[]> {
    return this.findAll({
      where: { isApproved: true },
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          association: 'product',
          attributes: ['id', 'name', 'slug', 'images'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  public static async getTopRatedProducts(limit: number = 10): Promise<any[]> {
    const results = await this.findAll({
      where: { isApproved: true },
      attributes: [
        'productId',
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('rating')), 'reviewCount'],
      ],
      group: ['productId'],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('rating')), '>=', 5),
      order: [[sequelize.fn('AVG', sequelize.col('rating')), 'DESC']],
      limit,
      raw: true,
    });

    return results;
  }
}

// Initialize the Review model
Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      validate: {
        notEmpty: {
          msg: 'User ID is required',
        },
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Rating must be at least 1',
        },
        max: {
          args: [5],
          msg: 'Rating cannot exceed 5',
        },
        isInt: {
          msg: 'Rating must be an integer',
        },
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Review title cannot exceed 255 characters',
        },
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'Review comment cannot exceed 2000 characters',
        },
      },
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_verified',
      comment: 'Whether the reviewer actually purchased the product',
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_approved',
      comment: 'Whether the review has been approved by admin',
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'helpful_count',
      validate: {
        min: {
          args: [0],
          msg: 'Helpful count cannot be negative',
        },
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id'],
        name: 'unique_user_product_review',
      },
      {
        fields: ['product_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['rating'],
      },
      {
        fields: ['is_approved'],
      },
      {
        fields: ['is_verified'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['helpful_count'],
      },
    ],
    hooks: {
      afterCreate: async (review: Review) => {
        if (review.isApproved) {
          const product = await sequelize.models.Product.findByPk(review.productId);
          if (product) {
            await (product as any).updateRating();
          }
        }
      },
      afterUpdate: async (review: Review) => {
        if (review.changed('isApproved') || review.changed('rating')) {
          const product = await sequelize.models.Product.findByPk(review.productId);
          if (product) {
            await (product as any).updateRating();
          }
        }
      },
      afterDestroy: async (review: Review) => {
        const product = await sequelize.models.Product.findByPk(review.productId);
        if (product) {
          await (product as any).updateRating();
        }
      },
    },
    defaultScope: {
      where: {
        isApproved: true,
      },
      order: [['createdAt', 'DESC']],
    },
    scopes: {
      all: {
        where: {},
      },
      approved: {
        where: {
          isApproved: true,
        },
      },
      pending: {
        where: {
          isApproved: false,
        },
      },
      verified: {
        where: {
          isVerified: true,
        },
      },
      withUser: {
        include: [
          {
            association: 'user',
            attributes: ['id', 'firstName', 'lastName'],
          },
        ],
      },
      withProduct: {
        include: [
          {
            association: 'product',
            attributes: ['id', 'name', 'slug', 'images'],
          },
        ],
      },
      recent: {
        order: [['createdAt', 'DESC']],
      },
      helpful: {
        order: [['helpfulCount', 'DESC']],
      },
      highRated: {
        where: {
          rating: {
            [Op.gte]: 4,
          },
        },
      },
      lowRated: {
        where: {
          rating: {
            [Op.lte]: 2,
          },
        },
      },
    },
  }
);

export default Review;
export { Review };