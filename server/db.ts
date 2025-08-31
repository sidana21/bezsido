import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

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

// Initialize database connection (but don't await it here)
initializeDatabase();

export { pool, db };
