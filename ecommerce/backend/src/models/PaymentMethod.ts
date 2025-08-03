import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PaymentMethodAttributes {
  id: number;
  name: string;
  type: 'stripe' | 'paypal' | 'razorpay' | 'bank_transfer' | 'cash_on_delivery' | 'other';
  isActive: boolean;
  configuration: {
    apiKey?: string;
    secretKey?: string;
    webhookSecret?: string;
    merchantId?: string;
    accountDetails?: string;
    instructions?: string;
    [key: string]: any;
  };
  displayName: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentMethodCreationAttributes extends Optional<PaymentMethodAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PaymentMethod extends Model<PaymentMethodAttributes, PaymentMethodCreationAttributes> implements PaymentMethodAttributes {
  public id!: number;
  public name!: string;
  public type!: 'stripe' | 'paypal' | 'razorpay' | 'bank_transfer' | 'cash_on_delivery' | 'other';
  public isActive!: boolean;
  public configuration!: {
    apiKey?: string;
    secretKey?: string;
    webhookSecret?: string;
    merchantId?: string;
    accountDetails?: string;
    instructions?: string;
    [key: string]: any;
  };
  public displayName!: string;
  public description?: string;
  public icon?: string;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PaymentMethod.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('stripe', 'paypal', 'razorpay', 'bank_transfer', 'cash_on_delivery', 'other'),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    configuration: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
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

export { PaymentMethod, PaymentMethodAttributes, PaymentMethodCreationAttributes };