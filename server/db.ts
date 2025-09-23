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
    
    console.log('📋 All database tables created/verified successfully (users, sessions, chats, messages, vendors, services, products)!');
  } catch (error) {
    console.warn('⚠️ Warning: Failed to create some tables:', error);
    // Don't fail completely, the app might still work
  }
}

// Initialize database connection (but don't await it here)
initializeDatabase();

export { db, ensureTablesExist };
