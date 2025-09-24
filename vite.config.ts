import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Function to conditionally load Replit plugins
async function getReplitPlugins() {
  const plugins = [];
  
  // Only load Replit plugins when in Replit environment
  if (process.env.REPL_ID !== undefined) {
    try {
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
      plugins.push(runtimeErrorOverlay.default());
    } catch (e) {
      console.log("Replit runtime error overlay not available");
    }
    
    if (process.env.NODE_ENV !== "production") {
      try {
        const cartographer = await import("@replit/vite-plugin-cartographer");
        plugins.push(cartographer.cartographer());
      } catch (e) {
        console.log("Replit cartographer not available");
      }
    }
  }
  
  return plugins;
}

export default defineConfig(async () => {
  const replitPlugins = await getReplitPlugins();
  
  return {
    plugins: [
      react(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve("./client/src"),
        "@shared": path.resolve("./shared"),
        "@assets": path.resolve("./attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
