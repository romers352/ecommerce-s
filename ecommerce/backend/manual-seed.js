const { seedDatabase, syncModels } = require('./dist/models/index');

async function runManualSeed() {
  try {
    console.log('🌱 Starting manual database seeding...');
    
    // First sync models
    console.log('Syncing models...');
    await syncModels();
    console.log('✅ Models synced');
    
    // Then seed
    console.log('Running seed function...');
    await seedDatabase();
    console.log('✅ Seeding completed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during manual seeding:', error);
    process.exit(1);
  }
}

runManualSeed();