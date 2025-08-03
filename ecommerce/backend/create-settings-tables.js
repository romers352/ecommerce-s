const { sequelize, SiteSettings, HomePageSection, PaymentMethod } = require('./dist/models/index');

async function createSettingsTables() {
  try {
    console.log('Creating settings tables...');
    
    // Create only the new tables, don't alter existing ones
    await SiteSettings.sync({ force: false });
    console.log('✅ SiteSettings table created/verified');
    
    await HomePageSection.sync({ force: false });
    console.log('✅ HomePageSection table created/verified');
    
    await PaymentMethod.sync({ force: false });
    console.log('✅ PaymentMethod table created/verified');
    
    console.log('🎉 All settings tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

createSettingsTables();