/**
 * Development Server Script for RestaurantIQ
 * Starts the server with development-specific configurations
 */

import 'dotenv/config';
import { watch } from 'fs';
import { resolve } from 'path';
import { initializeApp } from './app';

// Set development environment if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Enable auto-seeding in development
if (!process.env.AUTO_SEED) {
  process.env.AUTO_SEED = 'true';
}

console.log('🚀 Starting RestaurantIQ Development Server...');
console.log('📁 Working Directory:', process.cwd());
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🗄️ Database:', process.env.DB_HOST);
console.log('🔴 Redis:', process.env.REDIS_URL);
console.log('');

// Start the application
initializeApp().catch((error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Log some helpful development information
  setTimeout(() => {
    console.log('');
    console.log('📋 Development URLs:');
    console.log(`   API Base:     http://localhost:${process.env.PORT || 3001}/api`);
    console.log(`   Health Check: http://localhost:${process.env.PORT || 3001}/health`);
    console.log(`   API Status:   http://localhost:${process.env.PORT || 3001}/api/status`);
    console.log('');
    console.log('🧪 Development Endpoints:');
    console.log(`   Test:         http://localhost:${process.env.PORT || 3001}/api/dev/test`);
    console.log(`   Redis Test:   http://localhost:${process.env.PORT || 3001}/api/dev/redis`);
    console.log(`   DB Test:      http://localhost:${process.env.PORT || 3001}/api/dev/database`);
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Use Ctrl+C to stop the server');
    console.log('   - Server will auto-restart on file changes (if using nodemon)');
    console.log('   - Check logs in ./logs directory');
    console.log('');
  }, 2000);
}
