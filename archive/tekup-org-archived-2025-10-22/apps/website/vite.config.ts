import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react-swc";
import autoprefixer from "autoprefixer";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 3001,
    open: true, // Automatically open browser
    hmr: {
      overlay: true, // Show errors in browser overlay
      clientPort: 3001,
      port: 24678, // Separate HMR port
      // Reduced HMR aggressiveness
      timeout: 60000, // Longer timeout to prevent rapid reloads
      skipErrors: ['EADDRINUSE'],
    },
    watch: {
      usePolling: false, // Disable polling for better performance
      interval: 300, // Slower polling if needed (was 25)
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      // Reduce watched file extensions
      include: [
        '**/*.tsx',
        '**/*.ts',
        '**/*.jsx',
        '**/*.js'
      ]
    },
    // Middleware for enhanced development
    middlewareMode: false,
    cors: true,
    // Pre-transform known dependencies
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@vite/client', '@vite/env']
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tekup/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  build: {
    sourcemap: true, // Enable CSS source maps
    cssCodeSplit: true, // Split CSS for better caching
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
    // CSS optimization
    cssMinify: 'esbuild',
    target: 'esnext'
  },

  css: {
    devSourcemap: true, // Enable CSS source maps in development
    // Simplified CSS processing to avoid PostCSS issues
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    },
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";'
      }
    },
    // CSS modules configuration for component isolation
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[local]_[hash:base64:8]'
    },
  },
  // PWA specific configuration
  publicDir: 'public',
  // Ensure PWA files are properly served
  assetsInclude: ['**/*.png', '**/*.ico', '**/*.svg'],
}));