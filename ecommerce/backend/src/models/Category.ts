import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Category as CategoryInterface } from '../types';

// Define the attributes for Category creation
interface CategoryCreationAttributes extends Optional<CategoryInterface, 'id' | 'createdAt' | 'updatedAt' | 'description' | 'image' | 'isActive' | 'sortOrder' | 'parentId' | 'isMainCategory' | 'parent' | 'children'> {}

// Define the Category model class
class Category extends Model<CategoryInterface, CategoryCreationAttributes> implements CategoryInterface {
  public id!: number;
  public name!: string;
  public slug!: string;
  public description?: string;
  public image?: string;
  public isActive!: boolean;
  public sortOrder!: number;
  public parentId?: number;
  public isMainCategory!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public parent?: Category;
  public children?: Category[];
  public products?: any[];

  // Instance methods
  public generateSlug(): string {
    return this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Static methods
  public static async findBySlug(slug: string): Promise<Category | null> {
    return this.findOne({ where: { slug } });
  }

  public static async findActive(): Promise<Category[]> {
    return this.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  public static async findWithProducts(): Promise<Category[]> {
    return this.findAll({
      where: { isActive: true },
      include: [
        {
          association: 'products',
          where: { isActive: true },
          required: false,
        },
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  public static async getActiveWithProducts(): Promise<Category[]> {
    return this.findAll({
      where: { isActive: true },
      include: [
        {
          association: 'products',
          where: { isActive: true },
          required: false,
          attributes: ['id'],
        },
      ],
      attributes: {
        include: [
          [
            sequelize.fn('COUNT', sequelize.col('products.id')),
            'productCount'
          ]
        ]
      },
      group: ['Category.id'],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  public static async getNextSortOrder(): Promise<number> {
    const lastCategory = await Category.findOne({ order: [['sortOrder', 'DESC']] });
    return lastCategory ? lastCategory.sortOrder + 1 : 1;
  }

  public static async getMainCategories(): Promise<Category[]> {
    return await Category.findAll({
      where: {
        isMainCategory: true,
        parentId: null as any,
        isActive: true,
      },
      include: [{
        model: Category,
        as: 'children',
        where: { isActive: true },
        required: false,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      }],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      limit: 3,
    });
  }

  public static async getSubcategories(parentId: number): Promise<Category[]> {
    return await Category.findAll({
      where: {
        parentId,
        isActive: true,
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      limit: 30,
    });
  }

  public static async getCategoryHierarchy(): Promise<Category[]> {
    return await Category.findAll({
      where: {
        isMainCategory: true,
        parentId: null as any,
        isActive: true,
      },
      include: [{
        model: Category,
        as: 'children',
        where: { isActive: true },
        required: false,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      }],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }
}

// Initialize the Category model
Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_category_name',
        msg: 'Category name must be unique',
      },
      validate: {
        notEmpty: {
          msg: 'Category name is required',
        },
        len: {
          args: [2, 100],
          msg: 'Category name must be between 2 and 100 characters',
        },
      },
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: {
        name: 'unique_category_slug',
        msg: 'Category slug must be unique',
      },
      validate: {
        notEmpty: {
          msg: 'Category slug is required',
        },
        is: {
          args: /^[a-z0-9-]+$/,
          msg: 'Slug can only contain lowercase letters, numbers, and hyphens',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Description cannot exceed 1000 characters',
        },
      },
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Image must be a valid URL',
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Sort order must be a positive number',
        },
      },
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    isMainCategory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['sort_order'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['parent_id'],
      },
      {
        fields: ['is_main_category'],
      },
    ],
    hooks: {
      beforeValidate: async (category: Category) => {
        if (category.name && !category.slug) {
          category.slug = category.generateSlug();
        }
        
        // If setting as main category, ensure parentId is cleared first
        if (category.isMainCategory && category.parentId) {
          category.parentId = undefined;
        }
        
        // Validate main category limit (max 3)
        if (category.isMainCategory) {
          const mainCategoryCount = await Category.count({
            where: {
              isMainCategory: true,
              parentId: null as any,
              id: { [Op.ne]: category.id || 0 }
            }
          }) as number;
          if (mainCategoryCount >= 3) {
            throw new Error('Maximum 3 main categories allowed');
          }
        }
        
        // Validate subcategory limit (max 30 per main category)
        if (category.parentId && !category.isMainCategory) {
          const subcategoryCount = await Category.count({
            where: {
              parentId: category.parentId,
              id: { [Op.ne]: category.id || 0 }
            }
          }) as number;
          if (subcategoryCount >= 30) {
            throw new Error('Maximum 30 subcategories allowed per main category');
          }
          // Subcategories cannot be main categories
          category.isMainCategory = false;
        }
      },
      beforeCreate: async (category: Category) => {
        if (!category.sortOrder) {
          category.sortOrder = await Category.getNextSortOrder();
        }
      },
      beforeUpdate: async (category: Category) => {
        if (category.changed('name')) {
          category.slug = category.generateSlug();
        }
      },
    },
    defaultScope: {
      where: {
        isActive: true,
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
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
      withProducts: {
        include: [
          {
            association: 'products',
            where: { isActive: true },
            required: false,
          },
        ],
      },
      sorted: {
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      },
    },
  }
);

// Define self-referencing associations
Category.hasMany(Category, {
  foreignKey: 'parentId',
  as: 'children',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

Category.belongsTo(Category, {
  foreignKey: 'parentId',
  as: 'parent',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

export default Category;
export { Category };