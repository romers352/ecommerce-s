import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SiteSettingsAttributes {
  id: number;
  siteName: string;
  siteDescription: string;
  favicon?: string;
  logo?: string;
  footerLogo?: string;
  heroVideoMobile?: string;
  heroVideoDesktop?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  } | string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  maintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SiteSettingsCreationAttributes extends Optional<SiteSettingsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SiteSettings extends Model<SiteSettingsAttributes, SiteSettingsCreationAttributes> implements SiteSettingsAttributes {
  public id!: number;
  public siteName!: string;
  public siteDescription!: string;
  public favicon?: string;
  public logo?: string;
  public footerLogo?: string;
  public heroVideoMobile?: string;
  public heroVideoDesktop?: string;
  public contactEmail!: string;
  public contactPhone?: string;
  public address?: string;
  public socialLinks!: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  } | string;
  public seoTitle?: string;
  public seoDescription?: string;
  public seoKeywords?: string;
  public maintenanceMode!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SiteSettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'E-Commerce Store',
    },
    siteDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'Your one-stop shop for quality products',
    },
    favicon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    footerLogo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    heroVideoMobile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    heroVideoDesktop: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    socialLinks: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{}',
    },
    seoTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    seoKeywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maintenanceMode: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: 'SiteSettings',
    tableName: 'site_settings',
    timestamps: true,
    underscored: true,
  }
);

export { SiteSettings, SiteSettingsAttributes, SiteSettingsCreationAttributes };