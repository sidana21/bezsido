import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage, type IStorage } from "./storage";
import { AdminManager } from "./admin-manager";

// Ensure uploads directory exists (critical for Render deployment)
try {
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
    console.log('📁 Created uploads directory');
  } else {
    console.log('📁 Uploads directory already exists');
  }
} catch (error) {
  console.error('⚠️ Failed to create uploads directory:', error);
}

// Fix SSL certificate issues in Replit development environment
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('🔧 SSL certificate verification disabled for development');
}

// Enhanced error handling for production environments
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Don't exit in production - let the server continue running
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

const app = express();

// إعداد CORS للسماح بالطلبات من أي مصدر (مطلوب لـ Render)
app.use(cors({ 
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: false
}));

// إعداد middleware لمعالجة البيانات
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// إضافة headers لمنع الـ caching على Render - يحل مشكلة الشاشة السوداء
app.use((req, res, next) => {
  // منع caching كلياً لمنع مشكلة الشاشة السوداء على Render
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // إضافة headers إضافية لضمان عدم caching المحتوى
  res.setHeader('X-Accel-Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // إضافة header لإخبار المتصفح أن المحتوى تم تحديثه
  res.setHeader('Last-Modified', new Date().toUTCString());
  res.setHeader('ETag', `"${Date.now()}"`);
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize default features on startup
  try {
    console.log('Initializing default app features...');
    await storage.initializeDefaultFeatures();
    console.log('App features initialized successfully');
  } catch (error) {
    console.error('Warning: Failed to initialize default features:', error);
  }

  // Initialize default stickers on startup
  try {
    console.log('Initializing default stickers...');
    if (typeof (storage as any).initializeDefaultStickers === 'function') {
      await (storage as any).initializeDefaultStickers();
      console.log('Default stickers initialized successfully');
    } else {
      console.log('Stickers initialization not available in current storage type');
    }
  } catch (error) {
    console.error('Warning: Failed to initialize default stickers:', error);
  }

  // Initialize daily missions on startup
  try {
    console.log('Initializing daily missions...');
    if (typeof (storage as any).initializeDailyMissions === 'function') {
      await (storage as any).initializeDailyMissions();
      console.log('Daily missions initialized successfully');
    } else {
      console.log('Daily missions initialization not available in current storage type');
    }
  } catch (error) {
    console.error('Warning: Failed to initialize daily missions:', error);
  }

  // Initialize vendor categories on startup
  try {
    console.log('Initializing vendor categories...');
    if (typeof (storage as any).initializeVendorCategories === 'function') {
      await (storage as any).initializeVendorCategories();
      console.log('Vendor categories initialized successfully');
    } else {
      console.log('Vendor categories initialization not available in current storage type');
    }
  } catch (error) {
    console.error('Warning: Failed to initialize vendor categories:', error);
  }

  // Initialize admin user (with data protection)
  try {
    console.log('Initializing admin user...');
    console.log('🔒 Data Protection Mode: ON - Real user data will be preserved');
    const adminManager = new AdminManager(storage as IStorage);
    await adminManager.ensureAdminUser();
    console.log('Admin user initialized successfully');
  } catch (error) {
    console.error('Warning: Failed to initialize admin user:', error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Express error:', err);
    res.status(status).json({ message });
    // Don't re-throw in production to prevent crashes
    if (process.env.NODE_ENV === 'development') {
      throw err;
    }
  });

  // Serve uploaded files statically (before Vite but after API routes)
  app.use('/uploads', express.static('uploads'));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
