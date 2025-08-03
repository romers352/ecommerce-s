import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NewsletterAttributes {
  id: number;
  email: string;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NewsletterCreationAttributes extends Optional<NewsletterAttributes, 'id' | 'createdAt' | 'updatedAt' | 'unsubscribedAt'> {}

class Newsletter extends Model<NewsletterAttributes, NewsletterCreationAttributes> implements NewsletterAttributes {
  public id!: number;
  public email!: string;
  public isActive!: boolean;
  public subscribedAt!: Date;
  public unsubscribedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async unsubscribe(): Promise<void> {
    this.isActive = false;
    this.unsubscribedAt = new Date();
    await this.save();
  }

  public async resubscribe(): Promise<void> {
    this.isActive = true;
    this.unsubscribedAt = undefined;
    this.subscribedAt = new Date();
    await this.save();
  }

  // Static methods
  public static async findByEmail(email: string): Promise<Newsletter | null> {
    return await Newsletter.findOne({
      where: { email: email.toLowerCase() }
    });
  }

  public static async isSubscribed(email: string): Promise<boolean> {
    const subscription = await Newsletter.findByEmail(email);
    return subscription ? subscription.isActive : false;
  }

  public static async getActiveSubscribers(): Promise<Newsletter[]> {
    return await Newsletter.findAll({
      where: { isActive: true },
      order: [['subscribedAt', 'DESC']]
    });
  }

  public static async getSubscriberCount(): Promise<number> {
    return await Newsletter.count({
      where: { isActive: true }
    });
  }
}

// Initialize the model
Newsletter.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address',
        },
        len: {
          args: [5, 255],
          msg: 'Email must be between 5 and 255 characters',
        },
      },
      set(value: string) {
        this.setDataValue('email', value.toLowerCase().trim());
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        isBoolean: {
          args: true,
          msg: 'Active status must be a boolean value',
        },
      },
    },
    subscribedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: {
          args: true,
          msg: 'Subscribed date must be a valid date',
        },
      },
    },
    unsubscribedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          args: true,
          msg: 'Unsubscribed date must be a valid date',
        },
        isAfterSubscribed(value: Date) {
          if (value && this.subscribedAt && value <= this.subscribedAt) {
            throw new Error('Unsubscribed date must be after subscribed date');
          }
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
    modelName: 'Newsletter',
    tableName: 'newsletters',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['subscribedAt'],
      },
    ],
    hooks: {
      beforeValidate: (newsletter: Newsletter) => {
        if (newsletter.email) {
          newsletter.email = newsletter.email.toLowerCase().trim();
        }
      },
    },
  }
);

export default Newsletter;
export { NewsletterAttributes, NewsletterCreationAttributes };