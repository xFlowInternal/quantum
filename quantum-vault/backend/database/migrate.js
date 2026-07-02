const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'quantumvault',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'quantumvault_dev',
  password: process.env.DB_PASSWORD || 'dev_password',
  port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database migrations...');
    
    // Create migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Migrations table ready');

    // Get executed migrations
    const { rows: executed } = await client.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedNames = executed.map(r => r.name);
    console.log(`✓ Found ${executedNames.length} executed migrations`);

    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`✓ Found ${files.length} migration files`);

    // Run pending migrations
    let migrationsRun = 0;
    for (const file of files) {
      if (!executedNames.includes(file)) {
        console.log(`\n📝 Running migration: ${file}`);
        
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`✅ Migration ${file} completed`);
          migrationsRun++;
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration ${file} failed:`, error.message);
          throw error;
        }
      } else {
        console.log(`⏭️  Skipping ${file} (already executed)`);
      }
    }

    if (migrationsRun === 0) {
      console.log('\n✅ All migrations are up to date');
    } else {
      console.log(`\n✅ Successfully ran ${migrationsRun} migration(s)`);
    }
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('\n🎉 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
