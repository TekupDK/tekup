import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import federation from 'vite-plugin-federation'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'tekup-ai-platform',
      remotes: {
        'ai-proposal-engine': {
          external: 'http://localhost:3001/assets/remoteEntry.js',
          format: 'esm',
          from: 'vite'
        },
        'ai-content-generator': {
          external: 'http://localhost:3002/assets/remoteEntry.js',
          format: 'esm',
          from: 'vite'
        },
        'ai-customer-support': {
          external: 'http://localhost:3003/assets/remoteEntry.js',
          format: 'esm',
          from: 'vite'
        },
        'tekup-crm': {
          external: 'http://localhost:3004/assets/remoteEntry.js',
          format: 'esm',
          from: 'vite'
        }
      },
      shared: {
        'react': {
          singleton: true,
          requiredVersion: '^18.3.1'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1'
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.30.1'
        },
        '@tanstack/react-query': {
          singleton: true,
          requiredVersion: '^5.68.0'
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 3000,
    host: true,
    hmr: {
      port: 3000
    }
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
      output: {
        minifyInternalExports: false
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
