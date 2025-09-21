import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage, type IStorage } from "./storage";
import { AdminManager } from "./admin-manager";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
