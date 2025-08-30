import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// إعداد Vite للنشر على المواقع الخارجية (بدون اعتماديات Replit)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});