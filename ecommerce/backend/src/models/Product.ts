import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Product as ProductInterface } from '../types';

// Define the attributes for Product creation
interface ProductCreationAttributes extends Optional<ProductInterface, 'id' | 'createdAt' | 'updatedAt' | 'shortDescription' | 'salePrice' | 'images' | 'isActive' | 'isFeatured' | 'isDigital' | 'weight' | 'dimensions' | 'tags' | 'metaTitle' | 'metaDescription' | 'averageRating' | 'reviewCount'> {}

// Define the Product model class
class Product extends Model<ProductInterface, ProductCreationAttributes> implements ProductInterface {
  public id!: number;
  public name!: string;
  public slug!: string;
  public description!: string;
  public shortDescription?: string;
  public price!: number;
  public salePrice?: number;
  public sku!: string;
  public stock!: number;
  public images!: string[];
  public categoryId!: number;
  public isActive!: boolean;
  public isFeatured!: boolean;
  public isDigital!: boolean;
  public weight?: number;
  public dimensions?: string;
  public tags?: string[];
  public metaTitle?: string;
  public metaDescription?: string;
  public averageRating!: number;
  public reviewCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public category?: any;
  public reviews?: any[];

  // Instance methods
  public generateSlug(): string {
    return this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public getDisplayPrice(): number {
    return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
  }

  public getDiscountPercentage(): number {
    if (!this.salePrice || this.salePrice >= this.price) return 0;
    const percentage = ((this.price - this.salePrice) / this.price) * 100;
    return Math.round(percentage * 10) / 10; // Round to 1 decimal place for better accuracy
  }

  public isInStock(): boolean {
    return this.stock > 0;
  }

  public isOnSale(): boolean {
    return !!(this.salePrice && this.salePrice < this.price);
  }

  public getPrimaryImage(): string | null {
    return this.images && this.images.length > 0 ? this.images[0] : null;
  }

  public async updateRating(): Promise<void> {
    const reviews = await sequelize.models.Review.findAll({
      where: { productId: this.id, isApproved: true },
      attributes: ['rating'],
    });

    if (reviews.length === 0) {
      this.averageRating = 0;
      this.reviewCount = 0;
    } else {
      const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
      this.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
      this.reviewCount = reviews.length;
    }

    await this.save();
  }

  // Static methods
  public static async findBySlug(slug: string): Promise<Product | null> {
    return this.findOne({
      where: { slug },
      include: [
        {
          association: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          association: 'reviews',
          where: { isApproved: true },
          required: false,
          include: [
            {
              association: 'user',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });
  }

  public static async findBySku(sku: string): Promise<Product | null> {
    return this.findOne({ where: { sku } });
  }

  public static async findFeatured(limit: number = 8): Promise<Product[]> {
    return this.findAll({
      where: {
        isActive: true,
        isFeatured: true,
      },
      include: [
        {
          association: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  public static async findByCategory(categoryId: number, limit?: number): Promise<Product[]> {
    const options: any = {
      where: {
        categoryId,
        isActive: true,
      },
      include: [
        {
          association: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['createdAt', 'DESC']],
    };

    if (limit) {
      options.limit = limit;
    }

    return this.findAll(options);
  }

  public static async findOnSale(limit?: number): Promise<Product[]> {
    const options: any = {
      where: {
        isActive: true,
        salePrice: {
          [Op.gt]: 0,
          [Op.lt]: sequelize.col('price'),
        },
      },
      include: [
        {
          association: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['createdAt', 'DESC']],
    };

    if (limit) {
      options.limit = limit;
    }

    return this.findAll(options);
  }

  public static async searchProducts(query: string, limit?: number): Promise<Product[]> {
    const options: any = {
      where: {
        isActive: true,
        [Op.or]: [
          {
            name: {
              [Op.like]: `%${query}%`,
            },
          },
          {
            description: {
              [Op.like]: `%${query}%`,
            },
          },
          {
            tags: {
              [Op.like]: `%${query}%`,
            },
          },
        ],
      },
      include: [
        {
          association: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['createdAt', 'DESC']],
    };

    if (limit) {
      options.limit = limit;
    }

    return this.findAll(options);
  }

  public static async updateStock(productId: number, quantity: number): Promise<boolean> {
    const product = await this.findByPk(productId);
    if (!product) {
      return false;
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      return false;
    }

    product.stock = newStock;
    await product.save();
    return true;
  }

  public static async restoreStock(productId: number, quantity: number): Promise<void> {
    const product = await this.findByPk(productId);
    if (product) {
      product.stock += quantity;
      await product.save();
    }
  }
}

// Initialize the Product model
Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Product name is required',
        },
        len: {
          args: [2, 255],
          msg: 'Product name must be between 2 and 255 characters',
        },
      },
    },
    slug: {
      type: DataTypes.STRING(275),
      allowNull: false,
      unique: {
        name: 'unique_product_slug',
        msg: 'Product slug must be unique',
      },
      validate: {
        notEmpty: {
          msg: 'Product slug is required',
        },
        is: {
          args: /^[a-z0-9-]+$/,
          msg: 'Slug can only contain lowercase letters, numbers, and hyphens',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Product description is required',
        },
        len: {
          args: [10, 5000],
          msg: 'Description must be between 10 and 5000 characters',
        },
      },
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Short description cannot exceed 500 characters',
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
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0.01],
          msg: 'Sale price must be greater than 0',
        },
        isDecimal: {
          msg: 'Sale price must be a valid decimal number',
        },
      },
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_product_sku',
        msg: 'SKU must be unique',
      },
      validate: {
        notEmpty: {
          msg: 'SKU is required',
        },
        len: {
          args: [2, 100],
          msg: 'SKU must be between 2 and 100 characters',
        },
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Stock cannot be negative',
        },
        isInt: {
          msg: 'Stock must be an integer',
        },
      },
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('images');
        if (typeof rawValue === 'string') {
          try {
            return JSON.parse(rawValue);
          } catch {
            return [];
          }
        }
        return rawValue || [];
      },
      set(value: string[]) {
        this.setDataValue('images', value);
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      validate: {
        notEmpty: {
          msg: 'Category is required',
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isDigital: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Weight cannot be negative',
        },
      },
    },
    dimensions: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Dimensions cannot exceed 100 characters',
        },
      },
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isArrayValidator(value: any) {
          if (value !== null && value !== undefined && !Array.isArray(value)) {
            throw new Error('Tags must be an array');
          }
        },
      },
    },
    metaTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Meta title cannot exceed 255 characters',
        },
      },
    },
    metaDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Meta description cannot exceed 500 characters',
        },
      },
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Average rating cannot be negative',
        },
        max: {
          args: [5],
          msg: 'Average rating cannot exceed 5',
        },
      },
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Review count cannot be negative',
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
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
      {
        unique: true,
        fields: ['sku'],
      },
      {
        fields: ['category_id'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['is_featured'],
      },
      {
        fields: ['price'],
      },
      {
        fields: ['sale_price'],
      },
      {
        fields: ['stock'],
      },
      {
        fields: ['average_rating'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['name'],
        type: 'FULLTEXT',
      },
      {
        fields: ['description'],
        type: 'FULLTEXT',
      },
    ],
    hooks: {
      beforeValidate: async (product: Product) => {
        if (product.name && !product.slug) {
          product.slug = product.generateSlug();
        }
        if (!product.metaTitle) {
          product.metaTitle = product.name;
        }
        if (!product.metaDescription && product.shortDescription) {
          product.metaDescription = product.shortDescription;
        }
      },
      beforeUpdate: async (product: Product) => {
        if (product.changed('name')) {
          product.slug = product.generateSlug();
        }
      },
      afterUpdate: async (product: Product) => {
        if (product.changed('salePrice') && product.salePrice && product.salePrice >= product.price) {
          product.salePrice = undefined;
          await product.save();
        }
      },
    },
    defaultScope: {
      where: {
        isActive: true,
      },
      include: [
        {
          association: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    },
    scopes: {
      all: {
        where: {},
      },
      active: {
        where: {
          isActive: true,
        },
      },
      inactive: {
        where: {
          isActive: false,
        },
      },
      featured: {
        where: {
          isActive: true,
          isFeatured: true,
        },
      },
      inStock: {
        where: {
          isActive: true,
          stock: {
            [Op.gt]: 0,
          },
        },
      },
      onSale: {
        where: {
          isActive: true,
          salePrice: {
            [Op.gt]: 0,
          },
        },
      },
      withCategory: {
        include: [
          {
            association: 'category',
            attributes: ['id', 'name', 'slug'],
          },
        ],
      },
      withReviews: {
        include: [
          {
            association: 'reviews',
            where: { isApproved: true },
            required: false,
            include: [
              {
                association: 'user',
                attributes: ['id', 'firstName', 'lastName'],
              },
            ],
          },
        ],
      },
    },
  }
);

export default Product;
export { Product };