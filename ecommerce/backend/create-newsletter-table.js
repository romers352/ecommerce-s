const mysql = require('mysql2/promise');

async function createNewsletterTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce_db'
    });

    // Create newsletter table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS newsletters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_is_active (is_active),
        INDEX idx_subscribed_at (subscribed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableSQL);
    console.log('✅ Newsletter table created successfully');

    // Verify table creation
    const [rows] = await connection.execute('SHOW TABLES LIKE "newsletters"');
    if (rows.length > 0) {
      console.log('✅ Newsletter table verified');
      
      // Show table structure
      const [structure] = await connection.execute('DESCRIBE newsletters');
      console.log('\n📋 Newsletter table structure:');
      structure.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key}`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createNewsletterTable();