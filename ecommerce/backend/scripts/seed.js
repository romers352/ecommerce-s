const { seedDatabase, syncModels } = require('../dist/models/index');

async function runSeed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Sync models first
    await syncModels();
    console.log('✅ Database models synchronized');
    
    // Run seeding
    await seedDatabase();
    console.log('✅ Database seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

runSeed();