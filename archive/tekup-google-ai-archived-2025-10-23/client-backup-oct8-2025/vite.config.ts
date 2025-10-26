import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Chunk size warning limit (only as temporary measure)
    chunkSizeWarningLimit: 1000, // Increased limit since we're using automatic chunking
    // Add hash to filenames for cache busting
    rollupOptions: {
      output: {
        // Ensure unique filenames on each build for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // CRITICAL FIX: Remove manualChunks entirely
        // Let Vite automatically handle chunking to prevent React loading order issues
        // Manual chunking was causing "Cannot read properties of undefined (reading 'useState')"
        // because React hooks were being accessed before React was properly initialized
        manualChunks: undefined,
      },
    },
  },
})
