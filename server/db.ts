import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;
// Fix certificate issues in Replit environment
if (process.env.NODE_ENV === 'development') {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
}

// Allow application to work without database in production
let pool: Pool | null = null;
let db: any = null;

async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    try {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema });
      
      // Test the connection
      await pool.query('SELECT 1');
      console.log('✅ Database connection established');
      
      // Create tables if they don't exist (for Render deployment)
      await ensureTablesExist();
      console.log('✅ Database tables verified/created');
      
      return true;
    } catch (error) {
      console.warn('⚠️ Failed to connect to database, falling back to in-memory storage:', error);
      db = null;
      pool = null;
      return false;
    }
  } else {
    console.log('ℹ️ No DATABASE_URL provided, using in-memory storage');
    return false;
  }
}

// Function to ensure all tables exist (create them if they don't)
async function ensureTablesExist() {
  if (!db) return;
  
  try {
    console.log('🔧 Checking/creating database tables...');
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number VARCHAR NOT NULL UNIQUE,
        name TEXT NOT NULL,
        avatar TEXT,
        location TEXT NOT NULL,
        is_online BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        verified_at TIMESTAMP,
        is_admin BOOLEAN DEFAULT false,
        last_seen TIMESTAMP DEFAULT NOW(),
        points INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        last_streak_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        token VARCHAR NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create otp_codes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number VARCHAR NOT NULL,
        code VARCHAR NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create chats table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        is_group BOOLEAN DEFAULT false,
        avatar TEXT,
        participants JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id VARCHAR NOT NULL REFERENCES chats(id),
        sender_id VARCHAR NOT NULL REFERENCES users(id),
        content TEXT,
        type VARCHAR DEFAULT 'text',
        file_url TEXT,
        file_name TEXT,
        file_size INTEGER,
        file_type VARCHAR,
        read_by JSONB DEFAULT '[]'::jsonb,
        delivered_to JSONB DEFAULT '[]'::jsonb,
        replied_to VARCHAR,
        is_forwarded BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('📋 Essential database tables created/verified successfully');
  } catch (error) {
    console.warn('⚠️ Warning: Failed to create some tables:', error);
    // Don't fail completely, the app might still work
  }
}

// Initialize database connection (but don't await it here)
initializeDatabase();

export { pool, db, ensureTablesExist };
