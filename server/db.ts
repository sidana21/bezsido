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

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('✅ Database connection established');
  } catch (error) {
    console.warn('⚠️ Failed to connect to database, falling back to in-memory storage:', error);
    db = null;
  }
} else {
  console.log('ℹ️ No DATABASE_URL provided, using in-memory storage');
}

export { pool, db };
