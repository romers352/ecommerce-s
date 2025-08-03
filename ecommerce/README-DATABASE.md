# Database Setup Guide

This guide provides multiple options for setting up a database for the ecommerce application.

## 🚀 Quick Start - Cloud Database (Recommended)

The application is **ready to connect** to a real database! You just need to update the credentials in your `.env` file.

### Option 1: PlanetScale (Free Tier Available)
1. Go to [PlanetScale](https://planetscale.com/)
2. Create a free account
3. Create a new database
4. Get connection details from the dashboard
5. Update your `backend/.env` file:

```env
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
DB_DIALECT=mysql
```

### Option 2: Railway (Free Tier Available)
1. Go to [Railway](https://railway.app/)
2. Create account and new project
3. Add MySQL database service
4. Get connection details
5. Update your `backend/.env` file with Railway credentials

### Option 3: Aiven (Free Tier Available)
1. Go to [Aiven](https://aiven.io/)
2. Create account
3. Create MySQL service
4. Update your `backend/.env` file with Aiven credentials

## 🐳 Local Development Options

### Option 4: Local Docker MySQL

#### Prerequisites
- Docker Desktop installed and running

#### Setup Steps
1. Make sure Docker Desktop is running
2. Run the following command in the project root:

```bash
docker-compose up -d mysql
```

3. Wait for MySQL to start (may take a few minutes on first run)
4. Update your `backend/.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce_db
DB_USER=root
DB_PASSWORD=rootpassword
DB_DIALECT=mysql
```

### Option 5: Local XAMPP

#### Prerequisites
- XAMPP installed

#### Setup Steps
1. Start XAMPP Control Panel
2. Start Apache and MySQL services
3. Open phpMyAdmin (http://localhost/phpmyadmin)
4. Create a new database named `ecommerce_db`
5. Update your `backend/.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce_db
DB_USER=root
DB_PASSWORD=
DB_DIALECT=mysql
```

## ⚡ After Database Setup

1. The backend server will automatically connect to your database
2. Run database migrations:
```bash
cd backend
npm run db:migrate
```

3. Seed the database (optional):
```bash
npm run db:seed
```

4. The server should now be running successfully!

## 🔧 Current Status

✅ **SSL/TLS Configuration**: Ready for cloud databases  
✅ **Database Models**: Configured with Sequelize  
✅ **Environment Variables**: Set up in `.env` file  
✅ **Connection Handling**: Automatic retry and error handling  

**Next Step**: Update your database credentials in `backend/.env` and restart the server!

## 🛠️ Troubleshooting

### Docker Issues
- Make sure Docker Desktop is running
- Try restarting Docker Desktop
- Check if port 3306 is already in use

### Connection Issues
- Verify database credentials in `backend/.env` file
- Check if database server is running
- For cloud databases, ensure SSL/TLS is properly configured

### SSL/TLS Issues (Cloud Databases)
- ✅ The application is already configured for SSL connections
- ✅ Supports all major cloud database providers
- If you encounter SSL errors, check your cloud provider's documentation

### Current Error
If you see "Access denied for user 'your-username'", it means:
- ✅ SSL connection is working
- ❌ Database credentials need to be updated in `backend/.env`