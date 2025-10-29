-- Rendetalje Database Initialization Script
-- This script runs automatically when the PostgreSQL container starts

-- Create a dedicated user for Rendetalje applications
CREATE USER rendetalje_app WITH PASSWORD 'app_password_2025';
CREATE USER rendetalje_admin WITH PASSWORD 'admin_password_2025';

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE rendetalje TO rendetalje_app;
GRANT ALL PRIVILEGES ON DATABASE rendetalje TO rendetalje_admin;

-- Connect to the rendetalje database and create schema
\c rendetalje;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO rendetalje_app;
GRANT ALL ON SCHEMA public TO rendetalje_admin;
GRANT ALL ON SCHEMA auth TO rendetalje_app;
GRANT ALL ON SCHEMA auth TO rendetalje_admin;
GRANT ALL ON SCHEMA core TO rendetalje_app;
GRANT ALL ON SCHEMA core TO rendetalje_admin;
GRANT ALL ON SCHEMA integrations TO rendetalje_app;
GRANT ALL ON SCHEMA integrations TO rendetalje_admin;
GRANT ALL ON SCHEMA analytics TO rendetalje_app;
GRANT ALL ON SCHEMA analytics TO rendetalje_admin;
GRANT ALL ON SCHEMA audit TO rendetalje_app;
GRANT ALL ON SCHEMA audit TO rendetalje_admin;

-- Create default tables for development (example structure)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data for development
INSERT INTO users (email) VALUES 
    ('admin@rendetalje.dk'),
    ('dev@rendetalje.dk'),
    ('test@rendetalje.dk')
ON CONFLICT (email) DO NOTHING;

-- Set up RLS (Row Level Security) - basic example
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (true);

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO rendetalje_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO rendetalje_admin;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO rendetalje_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO rendetalje_admin;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Log successful initialization
INSERT INTO audit_log (table_name, operation, new_data)
VALUES ('database', 'init', '{"status": "initialized", "version": "1.0.0"}');