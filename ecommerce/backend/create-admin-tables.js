const { sequelize } = require('./dist/config/database');
const { Admin } = require('./dist/models');

async function createAdminTables() {
  try {
    console.log('🔄 Creating admin tables...');
    
    // Create or update the admins table
    await Admin.sync({ force: false });
    
    console.log('✅ Admin tables created successfully');
    
    // Check if any super admin exists
    const existingSuperAdmin = await Admin.findOne({
      where: { isSuperAdmin: true }
    });
    
    if (!existingSuperAdmin) {
      console.log('🔄 Creating initial super admin...');
      
      // Create initial super admin
      const superAdmin = await Admin.create({
        username: 'superadmin',
        email: 'admin@ecommerce.com',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin',
        isSuperAdmin: true,
        isActive: true,
        permissions: [],
      });
      
      console.log('✅ Super admin created successfully');
      console.log('📧 Email: admin@ecommerce.com');
      console.log('👤 Username: superadmin');
      console.log('🔑 Password: SuperAdmin123!');
      console.log('⚠️  Please change the password after first login!');
    } else {
      console.log('ℹ️  Super admin already exists');
    }
    
    console.log('🎉 Admin setup completed successfully');
    
  } catch (error) {
    console.error('❌ Error creating admin tables:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

createAdminTables()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });