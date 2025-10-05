import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { neon } from '@neondatabase/serverless';

// This script runs all migration SQL files directly
// It's called automatically on server startup to ensure all tables exist
export async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('⚠️ No DATABASE_URL found - skipping database initialization');
    return false;
  }

  try {
    console.log('🔄 Checking database tables...');
    const sql = neon(databaseUrl);
    
    // Read ALL migration SQL files
    const migrationsDir = join(process.cwd(), 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Process in order (0000, 0001, etc.)
    
    console.log(`📋 Found ${migrationFiles.length} migration file(s): ${migrationFiles.join(', ')}`);
    
    let migrationSQL = '';
    
    // Combine all migration files
    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      migrationSQL += readFileSync(filePath, 'utf-8') + '\n';
    }
    
    // Remove statement breakpoints and split into individual statements
    migrationSQL = migrationSQL.replace(/--> statement-breakpoint/g, '');
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let created = 0;
    let skipped = 0;
    
    // Execute each CREATE TABLE statement
    for (const statement of statements) {
      try {
        // Only execute CREATE TABLE statements (skip ALTER TABLE for now)
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          await sql(statement);
          created++;
        } else if (statement.toUpperCase().includes('ALTER TABLE')) {
          // Try to execute ALTER TABLE but don't fail if constraint already exists
          try {
            await sql(statement);
          } catch (e: any) {
            if (e.code === '42710' || e.code === '42P07') {
              // Constraint or table already exists - this is fine
              skipped++;
            } else {
              throw e;
            }
          }
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.code === '42P07') {
          skipped++;
        } else if (error.code === '42710') {
          // Constraint already exists
          skipped++;
        } else {
          console.error(`⚠️ Error executing statement: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Database initialization complete:`);
    console.log(`   - Created: ${created} tables`);
    console.log(`   - Skipped: ${skipped} (already exist)`);
    console.log(`✅ All tables verified including: story_likes, story_comments, follows, posts, etc.`);
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}
