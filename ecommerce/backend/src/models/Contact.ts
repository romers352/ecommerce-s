import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Contact as ContactInterface } from '../types';

// Define the creation attributes (optional fields for creation)
interface ContactCreationAttributes extends Optional<ContactInterface, 'id' | 'status' | 'priority' | 'adminNotes' | 'repliedAt' | 'repliedBy' | 'createdAt' | 'updatedAt'> {}

// Define the Contact model class
class Contact extends Model<ContactInterface, ContactCreationAttributes> implements ContactInterface {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone?: string;
  public subject!: string;
  public message!: string;
  public status!: 'new' | 'read' | 'replied' | 'closed';
  public priority!: 'low' | 'medium' | 'high';
  public adminNotes?: string;
  public repliedAt?: Date;
  public repliedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public markAsRead(): void {
    this.status = 'read';
  }

  public markAsReplied(adminId: number): void {
    this.status = 'replied';
    this.repliedAt = new Date();
    this.repliedBy = adminId;
  }

  public close(): void {
    this.status = 'closed';
  }

  public setPriority(priority: 'low' | 'medium' | 'high'): void {
    this.priority = priority;
  }

  public addAdminNotes(notes: string): void {
    this.adminNotes = notes;
  }

  // Static methods
  public static async getUnreadCount(): Promise<number> {
    return await Contact.count({
      where: {
        status: 'new'
      }
    });
  }

  public static async getByStatus(status: 'new' | 'read' | 'replied' | 'closed'): Promise<Contact[]> {
    return await Contact.findAll({
      where: { status },
      order: [['createdAt', 'DESC']]
    });
  }

  public static async getByPriority(priority: 'low' | 'medium' | 'high'): Promise<Contact[]> {
    return await Contact.findAll({
      where: { priority },
      order: [['createdAt', 'DESC']]
    });
  }

  public static async getHighPriorityUnread(): Promise<Contact[]> {
    return await Contact.findAll({
      where: {
        status: 'new',
        priority: 'high'
      },
      order: [['createdAt', 'DESC']]
    });
  }
}

// Initialize the model
Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Name is required'
        },
        len: {
          args: [2, 100],
          msg: 'Name must be between 2 and 100 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        },
        notEmpty: {
          msg: 'Email is required'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: {
          args: [0, 20],
          msg: 'Phone number must be less than 20 characters'
        }
      }
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Subject is required'
        },
        len: {
          args: [5, 200],
          msg: 'Subject must be between 5 and 200 characters'
        }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Message is required'
        },
        len: {
          args: [10, 5000],
          msg: 'Message must be between 10 and 5000 characters'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('new', 'read', 'replied', 'closed'),
      allowNull: false,
      defaultValue: 'new',
      validate: {
        isIn: {
          args: [['new', 'read', 'replied', 'closed']],
          msg: 'Status must be one of: new, read, replied, closed'
        }
      }
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: {
          args: [['low', 'medium', 'high']],
          msg: 'Priority must be one of: low, medium, high'
        }
      }
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    repliedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    repliedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Contact',
    tableName: 'contacts',
    timestamps: true
  }
);

export default Contact;
export { Contact };