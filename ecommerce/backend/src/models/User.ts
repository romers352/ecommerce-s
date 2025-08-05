import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import * as bcrypt from 'bcryptjs';
import { User as UserInterface } from '../types';

// Define the attributes for User creation
interface UserCreationAttributes extends Optional<UserInterface, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'emailVerified' | 'role' | 'lastLogin'> {}

// Define the User model class
class User extends Model<UserInterface, UserCreationAttributes> implements UserInterface {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public avatar?: string;
  public role!: 'customer' | 'admin';
  public isActive!: boolean;
  public emailVerified!: boolean;
  public otpCode?: string;
  public otpExpires?: Date;
  public passwordResetOtp?: string;
  public passwordResetOtpExpires?: Date;
  public lastLogin?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public toJSON(): Partial<UserInterface> {
    const values = Object.assign({}, this.get());
    const { password: _password, otpCode: _otpCode, passwordResetOtp: _passwordResetOtp, passwordResetOtpExpires: _passwordResetOtpExpires, ...cleanValues } = values;
    return cleanValues;
  }

  // Static methods
  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public static async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email: email.toLowerCase() } });
  }

  public static async findActiveUsers(): Promise<User[]> {
    return this.findAll({ where: { isActive: true } });
  }

  public static async findAdmins(): Promise<User[]> {
    return this.findAll({ where: { role: 'admin', isActive: true } });
  }
}

// Initialize the User model
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'First name is required',
        },
        len: {
          args: [2, 50],
          msg: 'First name must be between 2 and 50 characters',
        },
      },
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Last name is required',
        },
        len: {
          args: [2, 50],
          msg: 'Last name must be between 2 and 50 characters',
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: 'unique_email',
        msg: 'Email address is already in use',
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address',
        },
        notEmpty: {
          msg: 'Email is required',
        },
      },
      set(value: string) {
        this.setDataValue('email', value.toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Password is required',
        },
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters long',
        },
      },
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false,
      defaultValue: 'customer',
      validate: {
        isIn: {
          args: [['customer', 'admin']],
        msg: 'Role must be customer or admin',
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    otpCode: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetOtp: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    passwordResetOtpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLogin: {
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['email_verified'],
      },
      {
        fields: ['created_at'],
      },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await User.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && user.password) {
          user.password = await User.hashPassword(user.password);
        }
      },
    },
    defaultScope: {
      attributes: {
        exclude: ['password', 'otpCode', 'otpExpires', 'passwordResetOtp', 'passwordResetOtpExpires'],
      },
    },
    scopes: {
      withPassword: {
        attributes: {
          include: ['password'],
        },
      },
      withTokens: {
        attributes: {
          include: ['otpCode', 'otpExpires', 'passwordResetOtp', 'passwordResetOtpExpires'],
        },
      },
      admins: {
        where: {
          role: 'admin',
          isActive: true,
        },
      },
      customers: {
        where: {
          role: 'customer',
          isActive: true,
        },
      },
      active: {
        where: {
          isActive: true,
        },
      },
      verified: {
        where: {
          emailVerified: true,
        },
      },
    },
  }
);

export default User;
export { User };