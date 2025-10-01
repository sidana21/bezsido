import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getReplitPlugins() {
  const plugins = [];
  
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
  
  const config = {
    plugins: [
      react(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client/src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0" as const,
      port: 5000,
      allowedHosts: true as const,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
  
  return config;
});
