# E-commerce Application

A full-stack e-commerce application built with React (TypeScript) frontend and Node.js (Express + Sequelize) backend.

## 🚀 Features

### Frontend
- **Modern React with TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Responsive Design** - Mobile-first approach
- **State Management** - Context API and custom hooks
- **Authentication** - JWT-based auth with refresh tokens
- **Shopping Cart** - Persistent cart with local storage
- **Product Catalog** - Search, filter, and pagination
- **User Dashboard** - Order history and profile management
- **Admin Panel** - Product and order management

### Backend
- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe server development
- **Sequelize ORM** - Database abstraction layer
- **MySQL** - Robust relational database
- **JWT Authentication** - Secure token-based auth
- **File Upload** - Multer for image handling
- **Rate Limiting** - Protection against abuse
- **Input Validation** - Joi schema validation
- **Error Handling** - Centralized error management
- **Security** - Helmet, CORS, and other security measures

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- MySQL (v8.0 or higher)
- Git

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ecommerce
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Database Setup

#### Create MySQL database
```sql
CREATE DATABASE `e-commerce_db`;
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON `e-commerce_db`.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Configure environment variables

**Backend (.env)**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=e-commerce_db
DB_USER=root
DB_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_DEST=uploads

# Email Configuration
# SMTP Settings (for sending emails)
EMAIL_HOST=free.mboxhosting.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=contact@nurekha.com
EMAIL_PASS=your_email_password
EMAIL_FROM=contact@nurekha.com
EMAIL_REPLY_TO=contact@nurekha.com

# IMAP Settings (for reading emails)
IMAP_HOST=free.mboxhosting.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=contact@nurekha.com
IMAP_PASS=your_email_password
```

**Frontend (.env)**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=E-commerce App
```

### 4. Database Migration and Seeding
```bash
# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

## 🚀 Running the Application

### Development Mode
```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately
npm run dev:frontend  # Frontend only (http://localhost:3000)
npm run dev:backend   # Backend only (http://localhost:5000)
```

### Production Mode
```bash
# Build both applications
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
ecommerce/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── App.tsx          # Main app component
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Node.js Express backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point
│   ├── uploads/             # File upload directory
│   └── package.json
├── package.json             # Root package.json
└── README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile

### Products
- `GET /api/v1/products` - Get all products (with filters)
- `GET /api/v1/products/:id` - Get single product
- `GET /api/v1/products/featured` - Get featured products
- `GET /api/v1/products/sale` - Get sale products
- `POST /api/v1/products` - Create product (Admin)
- `PUT /api/v1/products/:id` - Update product (Admin)
- `DELETE /api/v1/products/:id` - Delete product (Admin)

### Categories
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:id` - Get single category
- `POST /api/v1/categories` - Create category (Admin)
- `PUT /api/v1/categories/:id` - Update category (Admin)
- `DELETE /api/v1/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:id` - Update cart item
- `DELETE /api/v1/cart/items/:id` - Remove cart item
- `DELETE /api/v1/cart/clear` - Clear cart

### Orders
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get single order
- `POST /api/v1/orders` - Create order
- `PATCH /api/v1/orders/:id/cancel` - Cancel order
- `GET /api/v1/orders/admin/all` - Get all orders (Admin)
- `PATCH /api/v1/orders/:id/status` - Update order status (Admin)

### Reviews
- `GET /api/v1/reviews/product/:productId` - Get product reviews
- `POST /api/v1/reviews` - Create review
- `PUT /api/v1/reviews/:id` - Update review
- `DELETE /api/v1/reviews/:id` - Delete review
- `PATCH /api/v1/reviews/:id/helpful` - Mark review as helpful

## 📝 Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run build` | Build both applications for production |
| `npm start` | Start production server |

| `npm run lint` | Run linting on both applications |
| `npm run install:all` | Install dependencies for all applications |
| `npm run clean` | Clean node_modules and build directories |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:reset` | Reset database (drop and recreate) |

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **Input Validation** using Joi schemas
- **CORS Protection** with configurable origins
- **Helmet** for security headers
- **File Upload Validation** with type and size limits
- **SQL Injection Protection** via Sequelize ORM
- **XSS Protection** through input sanitization

## 🚀 Deployment

### Environment Variables for Production

Make sure to set the following environment variables in production:

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_NAME=your_production_db_name
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_ACCESS_SECRET=your_strong_jwt_secret
JWT_REFRESH_SECRET=your_strong_refresh_secret
FRONTEND_URL=https://your-frontend-domain.com
```

### Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/yourusername/ecommerce-app/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

## 🙏 Acknowledgments

- React team for the amazing frontend framework
- Express.js team for the robust backend framework
- Sequelize team for the excellent ORM
- All open-source contributors who made this project possible