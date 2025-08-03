import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_NAME = 'ecommerce_db',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_DIALECT = 'mysql',
  DATABASE_URL = 'sqlite:./database.sqlite',
  NODE_ENV = 'development'
} = process.env;

// Database configuration
const config = {
  development: DB_DIALECT === 'sqlite' ? {
    dialect: 'sqlite' as const,
    storage: './database.sqlite',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  } : {
    host: DB_HOST,
    port: parseInt(DB_PORT),
    database: DB_NAME,
    username: DB_USER,
    password: DB_PASSWORD,
    dialect: DB_DIALECT as 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    dialectOptions: {
      connectTimeout: 60000
    }
  },

  production: {
    host: DB_HOST,
    port: parseInt(DB_PORT),
    database: DB_NAME,
    username: DB_USER,
    password: DB_PASSWORD,
    dialect: DB_DIALECT as 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    dialectOptions: {
      connectTimeout: 60000,
      ...(process.env.NODE_ENV === 'production' && process.env.DB_SSL_CA && {
        ssl: {
          require: true,
          rejectUnauthorized: false,
          ca: process.env.DB_SSL_CA,
          cert: process.env.DB_SSL_CERT,
          key: process.env.DB_SSL_KEY
        }
      })
    }
  }
};

const environment = NODE_ENV as keyof typeof config;
const dbConfig = config[environment];

// Create Sequelize instance
const sequelize = DB_DIALECT === 'sqlite' 
  ? new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    })
  : new Sequelize(
      (dbConfig as any).database,
      (dbConfig as any).username,
      (dbConfig as any).password,
      {
        host: (dbConfig as any).host,
        port: (dbConfig as any).port,
        dialect: (dbConfig as any).dialect,
        logging: (dbConfig as any).logging,
        pool: (dbConfig as any).pool,
        define: (dbConfig as any).define,
        ...((dbConfig as any).dialectOptions && { dialectOptions: (dbConfig as any).dialectOptions })
      }
    );



// Sync database (use with caution in production)
export const syncDatabase = async (force: boolean = false): Promise<void> => {
  await sequelize.sync({ force });
  // console.log('✅ Database synchronized successfully.');
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  await sequelize.close();
  // console.log('✅ Database connection closed.');
};

export { sequelize, config };
export default sequelize;