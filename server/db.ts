import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Pool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

// Allow application to work without database in production
let db: any = null;

async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    try {
      // Try Neon serverless first, fallback to traditional pg on Render
      console.log('🔧 Attempting database connection...');
      
      // For Render deployment, use traditional pg driver for better reliability
      if (process.env.RENDER || process.env.NODE_ENV === 'production') {
        console.log('📡 Using traditional PostgreSQL connection for production/Render...');
        
        // Parse connection string and add timeout parameters for Neon on Render
        const connectionString = process.env.DATABASE_URL.includes('connect_timeout') 
          ? process.env.DATABASE_URL 
          : `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require&connect_timeout=15&pool_timeout=15`;
        
        const pool = new Pool({
          connectionString,
          ssl: { rejectUnauthorized: false },
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 15000,
          max: 5, // Limit connections for Neon
        });
        
        db = drizzlePg({ client: pool, schema });
      } else {
        // Use Neon serverless for development
        console.log('🚀 Using Neon serverless for development...');
        const connection = neon(process.env.DATABASE_URL, {
          fetchOptions: {
            cache: 'no-store',
          },
        });
        db = drizzle({ client: connection, schema });
      }
      
      // Test the connection with retry logic for cold starts
      let retries = 3;
      while (retries > 0) {
        try {
          await db.execute(sql`SELECT 1`);
          console.log('✅ Database connection established successfully');
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(`⏳ Database cold start detected, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Create tables if they don't exist
      await ensureTablesExist();
      console.log('✅ Database tables verified/created');
      
      return true;
    } catch (error) {
      console.warn('⚠️ Failed to connect to database, falling back to in-memory storage:', error);
      console.warn('💡 For Render deployment, ensure DATABASE_URL includes connection timeout parameters');
      db = null;
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
        email VARCHAR NOT NULL UNIQUE,
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
        email VARCHAR NOT NULL,
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

export { db, ensureTablesExist };
