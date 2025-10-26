-- Tekup Unified Platform - Database Initialization
-- This script sets up the initial database structure for production

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS tekup_unified;

-- Use the database
\c tekup_unified;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Europe/Copenhagen';

-- Create initial admin user (will be created by Prisma migrations)
-- This is just a placeholder for reference
