import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Custom plugin to clean docs/assets directory before build
const cleanAssetsPlugin = () => {
  return {
    name: 'clean-assets',
    buildStart() {
      const assetsDir = path.resolve(__dirname, 'docs/assets');
      if (fs.existsSync(assetsDir)) {
        // Remove all files in docs/assets directory
        const files = fs.readdirSync(assetsDir);
        files.forEach(file => {
          const filePath = path.join(assetsDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        });
        console.log('🧹 Cleaned docs/assets directory');
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    cleanAssetsPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'docs',
    emptyOutDir: false,
  },
  publicDir: false,
}));
