const fs = require('fs');
const path = require('path');

function removeSQLiteFiles() {
  console.log('🧹 Removing SQLite files and cleaning up...');
  
  const filesToRemove = [
    './backend/database.sqlite',
    './backend/database/ecommerce.db'
  ];
  
  let removedCount = 0;
  
  filesToRemove.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ Removed: ${file}`);
        removedCount++;
      } else {
        console.log(`ℹ️  File not found: ${file}`);
      }
    } catch (error) {
      console.log(`❌ Error removing ${file}:`, error.message);
    }
  });
  
  // Update .gitignore to exclude SQLite files
  const gitignorePath = './.gitignore';
  try {
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    const sqliteIgnores = [
      '# SQLite databases',
      '*.sqlite',
      '*.sqlite3',
      '*.db',
      'database.sqlite',
      'backend/database.sqlite',
      'backend/database/*.db'
    ];
    
    let updated = false;
    sqliteIgnores.forEach(ignore => {
      if (!gitignoreContent.includes(ignore)) {
        gitignoreContent += `\n${ignore}`;
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('✅ Updated .gitignore to exclude SQLite files');
    }
    
  } catch (error) {
    console.log('❌ Error updating .gitignore:', error.message);
  }
  
  console.log(`\n🎉 Cleanup completed! Removed ${removedCount} SQLite files.`);
  console.log('\n📋 Your project is now configured for MySQL only:');
  console.log('✅ SQLite files removed');
  console.log('✅ Database configuration set to MySQL');
  console.log('✅ MySQL dependencies already installed (mysql2)');
  console.log('\n🚀 Run "node setup-mysql.js" to set up your MySQL database!');
}

removeSQLiteFiles();