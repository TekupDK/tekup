/**
 * Knex Configuration for RestaurantIQ
 * Database migrations and seeds setup
 */

require('dotenv').config();
require('ts-node/register');

const config = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'postgres',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'restaurantiq_dev',
      user: process.env.DB_USER || 'restaurantiq_user',
      password: process.env.DB_PASSWORD || 'restaurantiq_password',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
      loadExtensions: ['.ts']
    },
    seeds: {
      directory: './src/db/seeds',
      extension: 'ts',
      loadExtensions: ['.ts']
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/db/seeds',
      extension: 'ts'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 20
    },
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/db/seeds',
      extension: 'ts'
    }
  }
};

module.exports = config;
