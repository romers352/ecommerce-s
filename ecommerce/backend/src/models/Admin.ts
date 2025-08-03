import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import * as bcrypt from 'bcryptjs';

// Define the Admin interface
export interface AdminInterface {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the attributes for Admin creation
interface AdminCreationAttributes extends Optional<AdminInterface, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isSuperAdmin' | 'permissions' | 'lastLogin' | 'loginAttempts' | 'lockUntil'> {}

// Define the Admin model class
class Admin extends Model<AdminInterface, AdminCreationAttributes> implements AdminInterface {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public avatar?: string;
  public isActive!: boolean;
  public isSuperAdmin!: boolean;
  public permissions!: string[];
  public lastLogin?: Date;
  public loginAttempts!: number;
  public lockUntil?: Date;
  public passwordResetToken?: string;
  public passwordResetExpires?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
  }

  public async incrementLoginAttempts(): Promise<void> {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < new Date()) {
      await this.update({
        loginAttempts: 1,
        lockUntil: undefined,
      });
      return;
    }

    const updates: any = { loginAttempts: this.loginAttempts + 1 };

    // If we've reached max attempts and it's not locked already, lock the account
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
      updates.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await this.update(updates);
  }

  public async resetLoginAttempts(): Promise<void> {
    await this.update({
      loginAttempts: 0,
      lockUntil: undefined,
    });
  }

  public hasPermission(permission: string): boolean {
    return this.isSuperAdmin || this.permissions.includes(permission);
  }

  public toJSON(): Partial<AdminInterface> {
    const values = Object.assign({}, this.get());
    const { password: _password, passwordResetToken: _passwordResetToken, passwordResetExpires: _passwordResetExpires, ...cleanValues } = values;
    return cleanValues;
  }

  // Static methods
  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public static async findByEmail(email: string): Promise<Admin | null> {
    return this.findOne({ where: { email: email.toLowerCase() } });
  }

  public static async findByUsername(username: string): Promise<Admin | null> {
    return this.findOne({ where: { username: username.toLowerCase() } });
  }

  public static async findByEmailOrUsername(identifier: string): Promise<Admin | null> {
    return this.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() }
        ]
      }
    });
  }

  public static async findActiveAdmins(): Promise<Admin[]> {
    return this.findAll({ where: { isActive: true } });
  }

  public static async findSuperAdmins(): Promise<Admin[]> {
    return this.findAll({ where: { isSuperAdmin: true, isActive: true } });
  }
}

// Initialize the Admin model
Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        name: 'unique_username',
        msg: 'Username is already taken',
      },
      validate: {
        notEmpty: {
          msg: 'Username is required',
        },
        len: {
          args: [3, 50],
          msg: 'Username must be between 3 and 50 characters',
        },
        isAlphanumeric: {
          msg: 'Username can only contain letters and numbers',
        },
      },
      set(value: string) {
        this.setDataValue('username', value.toLowerCase());
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: 'unique_admin_email',
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
          args: [8, 255],
          msg: 'Password must be at least 8 characters long',
        },
      },
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
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isSuperAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Permissions must be an array');
          }
        },
      },
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetExpires: {
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
    modelName: 'Admin',
    tableName: 'admins',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        unique: true,
        fields: ['username'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['is_super_admin'],
      },
      {
        fields: ['created_at'],
      },
    ],
    hooks: {
      beforeCreate: async (admin: Admin) => {
        if (admin.password) {
          admin.password = await Admin.hashPassword(admin.password);
        }
      },
      beforeUpdate: async (admin: Admin) => {
        if (admin.changed('password') && admin.password) {
          admin.password = await Admin.hashPassword(admin.password);
        }
      },
    },
    defaultScope: {
      attributes: {
        exclude: ['password', 'passwordResetToken', 'passwordResetExpires'],
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
          include: ['passwordResetToken', 'passwordResetExpires'],
        },
      },
      active: {
        where: {
          isActive: true,
        },
      },
      superAdmins: {
        where: {
          isSuperAdmin: true,
          isActive: true,
        },
      },
    },
  }
);

export default Admin;
export { Admin };