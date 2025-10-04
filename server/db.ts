import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Pool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Allow application to work without database in production
let db: any = null;

// Function to save DATABASE_URL to local config
function saveDatabaseConfig(databaseUrl: string) {
  try {
    const configPath = join(process.cwd(), 'database-config.json');
    const config = existsSync(configPath) 
      ? JSON.parse(readFileSync(configPath, 'utf8'))
      : {};
    
    config.DATABASE_URL = databaseUrl;
    config.lastUpdated = new Date().toISOString();
    config.note = "رابط قاعدة البيانات الخارجية المحفوظ تلقائياً";
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('💾 تم حفظ رابط قاعدة البيانات في الملف المحلي');
  } catch (error) {
    console.warn('⚠️ فشل في حفظ إعدادات قاعدة البيانات:', error);
  }
}

// Function to load DATABASE_URL from local config
function loadDatabaseConfig(): string | null {
  try {
    const configPath = join(process.cwd(), 'database-config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      if (config.DATABASE_URL && config.DATABASE_URL.trim()) {
        console.log('📂 تم تحميل رابط قاعدة البيانات من الملف المحلي');
        return config.DATABASE_URL;
      }
    }
  } catch (error) {
    console.warn('⚠️ فشل في قراءة إعدادات قاعدة البيانات:', error);
  }
  return null;
}

async function initializeDatabase() {
  // In production (Render/deployment), ONLY use environment variable
  // In development, try environment variable first, then local config
  let databaseUrl: string | null = process.env.DATABASE_URL || null;
  
  // Only load local config in development mode
  if (!databaseUrl && process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
    databaseUrl = loadDatabaseConfig();
  }
  
  if (databaseUrl) {
    try {
      // Try Neon serverless first, fallback to traditional pg on Render
      console.log('🔧 Attempting database connection...');
      
      // Clean the DATABASE_URL - remove 'psql ' prefix if it exists
      let cleanDatabaseUrl = databaseUrl;
      if (cleanDatabaseUrl.startsWith('psql ')) {
        cleanDatabaseUrl = cleanDatabaseUrl.replace('psql ', '');
        console.log('🔧 Cleaned DATABASE_URL by removing psql prefix');
      }
      
      // CRITICAL: Always use Neon HTTP driver for neon.tech databases
      // Pool/node-postgres fails on Render due to firewall restrictions
      const isNeonDatabase = cleanDatabaseUrl.includes('neon.tech');
      
      if (isNeonDatabase) {
        console.log('🚀 Using Neon HTTP driver (works on Render + local)...');
        const connection = neon(cleanDatabaseUrl, {
          fetchOptions: {
            cache: 'no-store',
          },
        });
        db = drizzle({ client: connection, schema });
      } else {
        // For non-Neon databases (Render Postgres, AWS RDS, etc), use Pool
        console.log('📡 Using traditional PostgreSQL Pool connection...');
        
        let sslConfig: boolean | { rejectUnauthorized: boolean } = false;
        let sslMode = 'disable';
        
        if (cleanDatabaseUrl.includes('sslmode=require') || 
            cleanDatabaseUrl.includes('amazonaws.com')) {
          sslConfig = { rejectUnauthorized: false };
          sslMode = 'require';
        }
        
        let connectionString = cleanDatabaseUrl;
        if (!connectionString.includes('connect_timeout')) {
          const separator = connectionString.includes('?') ? '&' : '?';
          connectionString = `${connectionString}${separator}sslmode=${sslMode}&connect_timeout=15&pool_timeout=15`;
        }
        
        const pool = new Pool({
          connectionString,
          ssl: sslConfig,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 15000,
          max: 5,
        });
        
        console.log('🔐 SSL Configuration:', sslConfig ? 'Enabled' : 'Disabled');
        db = drizzlePg({ client: pool, schema });
      }
      
      // Test the connection with retry logic for cold starts
      let retries = 3;
      while (retries > 0) {
        try {
          await db.execute(sql`SELECT 1`);
          console.log('✅ Database connection established successfully');
          
          // Save DATABASE_URL to local config for future use
          if (process.env.DATABASE_URL) {
            saveDatabaseConfig(process.env.DATABASE_URL);
          }
          
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(`⏳ Database cold start detected, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Create tables if they don't exist - use migration-based initialization
      try {
        const { initializeDatabase: initDB } = await import('../scripts/init-db.js');
        await initDB();
      } catch (error) {
        console.warn('⚠️ Migration-based init failed, using fallback method:', error);
        await ensureTablesExist();
      }
      console.log('✅ Database tables verified/created');
      
      return true;
    } catch (error) {
      // In production (Render), FAIL HARD - don't allow fallback to in-memory storage
      if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
        console.error('🚨 CRITICAL: Failed to connect to PostgreSQL database in production!');
        console.error('🔍 DATABASE_URL:', databaseUrl ? 'SET (hidden for security)' : 'NOT SET');
        console.error('❌ Error details:', error);
        console.error('💡 Check: SSL settings, connection timeout, credentials, network access');
        console.error('⛔ Application CANNOT start without database in production');
        throw new Error('PostgreSQL connection failed in production - cannot use in-memory fallback');
      }
      
      // In development, allow fallback to in-memory storage
      console.warn('⚠️ Failed to connect to database, falling back to in-memory storage:', error);
      console.warn('💡 For Render deployment, ensure DATABASE_URL includes connection timeout parameters');
      db = null;
      return false;
    }
  } else {
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.error('🚨 CRITICAL: No DATABASE_URL found in production environment!');
      console.error('💡 Make sure DATABASE_URL is set in your Render environment variables');
      throw new Error('DATABASE_URL is required in production');
    } else {
      console.log('ℹ️ No DATABASE_URL provided, using in-memory storage');
      return false;
    }
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
        password TEXT,
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
        message_type TEXT NOT NULL DEFAULT 'text',
        image_url TEXT,
        audio_url TEXT,
        sticker_url TEXT,
        sticker_id VARCHAR,
        location_lat DECIMAL,
        location_lon DECIMAL,
        location_name TEXT,
        reply_to_message_id VARCHAR,
        timestamp TIMESTAMP DEFAULT NOW(),
        is_read BOOLEAN DEFAULT false,
        is_delivered BOOLEAN DEFAULT false,
        is_edited BOOLEAN DEFAULT false,
        edited_at TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    // Create vendor_categories table for service providers
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vendor_categories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT DEFAULT '#3B82F6',
        commission_rate DECIMAL NOT NULL DEFAULT '0.05',
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create service_categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service_categories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT DEFAULT '#3B82F6',
        commission_rate DECIMAL NOT NULL DEFAULT '0.05',
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create vendors table for service providers
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vendors (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        business_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT NOT NULL,
        category_id VARCHAR NOT NULL REFERENCES vendor_categories(id),
        logo_url TEXT,
        banner_url TEXT,
        location TEXT NOT NULL,
        address TEXT,
        phone_number TEXT,
        whatsapp_number TEXT,
        email TEXT,
        website TEXT,
        social_links JSONB DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending',
        is_active BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        is_premium BOOLEAN DEFAULT false,
        verified_at TIMESTAMP,
        approved_at TIMESTAMP,
        suspended_at TIMESTAMP,
        featured_until TIMESTAMP,
        premium_until TIMESTAMP,
        total_sales DECIMAL DEFAULT '0',
        total_orders INTEGER DEFAULT 0,
        total_products INTEGER DEFAULT 0,
        average_rating DECIMAL DEFAULT '0',
        total_reviews INTEGER DEFAULT 0,
        working_hours JSONB DEFAULT '{}',
        delivery_areas JSONB DEFAULT '[]',
        delivery_fee DECIMAL DEFAULT '0',
        min_order_amount DECIMAL DEFAULT '0',
        approved_by VARCHAR REFERENCES users(id),
        rejection_reason TEXT,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create services table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id VARCHAR NOT NULL REFERENCES vendors(id),
        category_id VARCHAR NOT NULL REFERENCES service_categories(id),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        short_description TEXT,
        base_price DECIMAL NOT NULL,
        price_per_km DECIMAL,
        price_per_hour DECIMAL,
        minimum_charge DECIMAL DEFAULT '0',
        currency TEXT NOT NULL DEFAULT 'DZD',
        images JSONB DEFAULT '[]',
        video_url TEXT,
        service_type TEXT NOT NULL,
        availability TEXT NOT NULL DEFAULT 'available',
        estimated_duration INTEGER,
        max_capacity INTEGER,
        features JSONB DEFAULT '[]',
        equipment JSONB DEFAULT '[]',
        requirements JSONB DEFAULT '[]',
        service_areas JSONB DEFAULT '[]',
        location TEXT NOT NULL,
        latitude DECIMAL,
        longitude DECIMAL,
        radius INTEGER DEFAULT 10,
        working_hours JSONB DEFAULT '{}',
        is_available_24x7 BOOLEAN DEFAULT false,
        status TEXT NOT NULL DEFAULT 'draft',
        is_active BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        is_emergency_service BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        order_count INTEGER DEFAULT 0,
        average_rating DECIMAL DEFAULT '0',
        total_reviews INTEGER DEFAULT 0,
        completion_rate DECIMAL DEFAULT '0',
        published_at TIMESTAMP,
        featured_until TIMESTAMP,
        commission_rate DECIMAL NOT NULL DEFAULT '0.05',
        platform_fee DECIMAL DEFAULT '0.02',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product_categories table 
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS product_categories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        parent_id VARCHAR,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create products table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id VARCHAR NOT NULL REFERENCES vendors(id),
        category_id VARCHAR NOT NULL REFERENCES product_categories(id),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        short_description TEXT,
        sku TEXT UNIQUE,
        barcode TEXT,
        original_price DECIMAL NOT NULL,
        sale_price DECIMAL,
        cost_price DECIMAL,
        currency TEXT NOT NULL DEFAULT 'DZD',
        images JSONB DEFAULT '[]',
        video_url TEXT,
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        stock_status TEXT NOT NULL DEFAULT 'in_stock',
        manage_stock BOOLEAN DEFAULT true,
        attributes JSONB DEFAULT '{}',
        variations JSONB DEFAULT '[]',
        weight DECIMAL,
        dimensions JSONB,
        shipping_class TEXT,
        slug TEXT UNIQUE,
        meta_title TEXT,
        meta_description TEXT,
        tags JSONB DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'draft',
        is_active BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        is_digital BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        order_count INTEGER DEFAULT 0,
        average_rating DECIMAL DEFAULT '0',
        total_reviews INTEGER DEFAULT 0,
        published_at TIMESTAMP,
        featured_until TIMESTAMP,
        sale_start_date TIMESTAMP,
        sale_end_date TIMESTAMP,
        commission_rate DECIMAL NOT NULL DEFAULT '0.05',
        marketplace_fee DECIMAL DEFAULT '0.02',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create app_features table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_features (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        category TEXT NOT NULL DEFAULT 'general',
        priority INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create admin_credentials table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id VARCHAR PRIMARY KEY DEFAULT 'admin_settings',
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create stickers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stickers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create stories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        location TEXT NOT NULL,
        content TEXT,
        image_url TEXT,
        video_url TEXT,
        background_color TEXT DEFAULT '#075e54',
        text_color TEXT DEFAULT '#ffffff',
        timestamp TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        view_count TEXT DEFAULT '0',
        viewers JSONB DEFAULT '[]'
      )
    `);

    // Create verification_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        vendor_id VARCHAR REFERENCES vendors(id),
        request_type TEXT NOT NULL,
        verification_type TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        documents JSONB DEFAULT '[]',
        reason TEXT,
        admin_note TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        reviewed_at TIMESTAMP,
        reviewed_by VARCHAR REFERENCES users(id)
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS privacy_sections (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        section_key VARCHAR NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        last_updated_by VARCHAR,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add password column to existing users table if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT
      `);
      console.log('✅ Password column added/verified for users table');
    } catch (error) {
      console.log('ℹ️ Password column already exists or could not be added:', error instanceof Error ? error.message : error);
    }

    // Add verification_type column to existing users table if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_type TEXT
      `);
      console.log('✅ Verification_type column added/verified for users table');
    } catch (error) {
      console.log('ℹ️ Verification_type column already exists or could not be added:', error instanceof Error ? error.message : error);
    }

    // Fix messages table schema for existing Render deployments
    try {
      // Check if old 'type' column exists and rename it to 'message_type'
      await db.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'messages' AND column_name = 'type') THEN
            ALTER TABLE messages RENAME COLUMN type TO message_type;
          END IF;
        END $$;
      `);
      
      // Add missing columns to messages table if they don't exist
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS sticker_url TEXT;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS sticker_id VARCHAR;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS location_lat DECIMAL;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS location_lon DECIMAL;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS location_name TEXT;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id VARCHAR;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT false;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
      `);
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      `);
      
      // Rename timestamp column if it's called created_at
      await db.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'messages' AND column_name = 'created_at') 
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'messages' AND column_name = 'timestamp') THEN
            ALTER TABLE messages RENAME COLUMN created_at TO timestamp;
          END IF;
        END $$;
      `);
      
      console.log('✅ Messages table schema updated/verified for Render compatibility');
    } catch (error) {
      console.log('ℹ️ Messages table schema update error (may be expected):', error instanceof Error ? error.message : error);
    }

    console.log('📋 All database tables created/verified successfully (users, sessions, chats, messages, vendors, services, products, app_features, admin_credentials, stickers, stories)!');
  } catch (error) {
    console.warn('⚠️ Warning: Failed to create some tables:', error);
    // Don't fail completely, the app might still work
  }
}

// Initialize database connection (but don't await it here)
initializeDatabase();

export { db, ensureTablesExist, initializeDatabase };
