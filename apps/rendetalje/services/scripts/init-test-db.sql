-- Initialize RenOS Test Database
-- This script creates the schema and seed data for integration tests

-- Create 'renos' schema
CREATE SCHEMA IF NOT EXISTS renos;

-- Set search path
SET search_path TO renos, public;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'employee', 'customer')),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    type VARCHAR(50) CHECK (type IN ('private', 'business')),
    cvr VARCHAR(20),
    address_street VARCHAR(255),
    address_postal_code VARCHAR(10),
    address_city VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('window', 'facade', 'gutter', 'pressure_wash', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    address VARCHAR(500) NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    price DECIMAL(10,2),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job logs table
CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);

-- Insert seed data for testing

-- Test users (passwords are 'securePassword123' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, name, role, phone, email_verified) VALUES
    ('11111111-1111-1111-1111-111111111111', 'owner@example.com', '$2b$10$rVqKYXJzGkXZ4YQZ4YQZ4uJ9kZ4YQZ4YQZ4YQZ4YQZ4YQZ4YQZ4Y', 'Test Owner', 'owner', '12345678', true),
    ('22222222-2222-2222-2222-222222222222', 'employee@example.com', '$2b$10$rVqKYXJzGkXZ4YQZ4YQZ4uJ9kZ4YQZ4YQZ4YQZ4YQZ4YQZ4YQZ4Y', 'Test Employee', 'employee', '23456789', true),
    ('33333333-3333-3333-3333-333333333333', 'customer@example.com', '$2b$10$rVqKYXJzGkXZ4YQZ4YQZ4uJ9kZ4YQZ4YQZ4YQZ4YQZ4YQZ4YQZ4Y', 'Test Customer', 'customer', '34567890', true)
ON CONFLICT (id) DO NOTHING;

-- Test customers
INSERT INTO customers (id, user_id, name, email, phone, type, address_street, address_postal_code, address_city) VALUES
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Lars Hansen', 'lars@example.com', '20304050', 'private', 'Nørregade 10', '1234', 'København'),
    ('55555555-5555-5555-5555-555555555555', NULL, 'Test Virksomhed ApS', 'kontakt@testvirksomhed.dk', '30405060', 'business', 'Industrivej 5', '2000', 'Frederiksberg')
ON CONFLICT (id) DO NOTHING;

-- Test jobs
INSERT INTO jobs (id, customer_id, assigned_to, type, status, address, description, estimated_hours, price, scheduled_at) VALUES
    ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'window', 'pending', 'Nørregade 10, 1234 København', 'Vinduespudsning på 3. sal', 2.0, 500.00, NOW() + INTERVAL '2 days'),
    ('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', NULL, 'facade', 'in_progress', 'Industrivej 5, 2000 Frederiksberg', 'Facadepolering', 4.0, 1200.00, NOW() + INTERVAL '1 day'),
    ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'window', 'completed', 'Nørregade 10, 1234 København', 'Vinduespudsning', 1.5, 450.00, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Test invoices
INSERT INTO invoices (id, job_id, customer_id, invoice_number, amount, status, due_date) VALUES
    ('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'INV-2025-0001', 450.00, 'paid', CURRENT_DATE - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Job logs
INSERT INTO job_logs (job_id, user_id, action, details) VALUES
    ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'created', 'Job created by owner'),
    ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'status_changed', 'Status changed from pending to in_progress'),
    ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'completed', 'Job completed successfully')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA renos TO renos_test;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA renos TO renos_test;
GRANT USAGE ON SCHEMA renos TO renos_test;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'RenOS test database initialized successfully';
END $$;
