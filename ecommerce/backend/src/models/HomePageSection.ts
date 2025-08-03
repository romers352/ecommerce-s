import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface HomePageSectionAttributes {
  id: number;
  type: 'hero' | 'banner_carousel' | 'featured_products' | 'categories' | 'testimonials' | 'newsletter' | 'custom';
  title?: string;
  subtitle?: string;
  content?: any; // JSON content specific to section type
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface HomePageSectionCreationAttributes extends Optional<HomePageSectionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class HomePageSection extends Model<HomePageSectionAttributes, HomePageSectionCreationAttributes> implements HomePageSectionAttributes {
  public id!: number;
  public type!: 'hero' | 'banner_carousel' | 'featured_products' | 'categories' | 'testimonials' | 'newsletter' | 'custom';
  public title?: string;
  public subtitle?: string;
  public content?: any;
  public isActive!: boolean;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

HomePageSection.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('hero', 'banner_carousel', 'featured_products', 'categories', 'testimonials', 'newsletter', 'custom'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subtitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    content: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
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
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'HomePageSection',
    tableName: 'home_page_sections',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['sort_order'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export { HomePageSection, HomePageSectionAttributes, HomePageSectionCreationAttributes };