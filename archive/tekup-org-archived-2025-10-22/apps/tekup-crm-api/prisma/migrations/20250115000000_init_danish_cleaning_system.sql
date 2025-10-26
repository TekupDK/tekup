-- Migration: Initialize Danish Cleaning Industry Database
-- TekUp.org CRM - Rengøringsbranchen database schema
-- Created: 2025-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TENANT MANAGEMENT
-- ============================================================================

CREATE TABLE tenants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Danish business fields
    cvr_number TEXT UNIQUE,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    
    -- Subscription and billing
    subscription_tier TEXT NOT NULL DEFAULT 'basic',
    max_users INTEGER NOT NULL DEFAULT 5,
    max_jobs INTEGER NOT NULL DEFAULT 100
);

-- ============================================================================
-- USER MANAGEMENT & AUTHENTICATION
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'TENANT_ADMIN', 
    'TEAM_LEADER',
    'CLEANER',
    'CUSTOMER'
);

CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'CLEANER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- CUSTOMER MANAGEMENT
-- ============================================================================

CREATE TYPE customer_segment AS ENUM (
    'COMMERCIAL',
    'RESIDENTIAL', 
    'PUBLIC',
    'HOSPITALITY'
);

CREATE TYPE service_level AS ENUM (
    'STANDARD',
    'PREMIUM',
    'ENTERPRISE'
);

CREATE TYPE cleaning_type AS ENUM (
    'OFFICE',
    'INDUSTRIAL',
    'HOSPITALITY',
    'RESIDENTIAL'
);

CREATE TYPE visit_frequency AS ENUM (
    'DAILY',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY'
);

CREATE TABLE customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    segment customer_segment NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Contact information
    email TEXT,
    phone TEXT,
    website TEXT,
    
    -- Danish address fields
    address TEXT,
    city TEXT,
    postal_code TEXT,
    coordinates JSONB, -- {lat: number, lng: number}
    
    -- Business information
    cvr_number TEXT,
    annual_contract_value DECIMAL(10,2),
    contract_start DATE,
    contract_end DATE,
    service_level service_level NOT NULL DEFAULT 'STANDARD',
    
    -- Customer preferences
    cleaning_preferences JSONB, -- CleaningPreferences interface
    access_instructions TEXT,
    special_requirements TEXT[],
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE customer_locations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    square_meters INTEGER,
    cleaning_type cleaning_type NOT NULL,
    visit_frequency visit_frequency NOT NULL,
    special_requirements TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ============================================================================
-- TEAM MANAGEMENT
-- ============================================================================

CREATE TYPE team_role AS ENUM (
    'TEAM_LEADER',
    'CLEANER',
    'SPECIALIST',
    'TRAINEE'
);

CREATE TYPE cleaning_skill AS ENUM (
    'BASIC_CLEANING',
    'WINDOW_CLEANING',
    'CARPET_CLEANING',
    'PRESSURE_WASHING',
    'FLOOR_MAINTENANCE',
    'SPECIALIZED_EQUIPMENT',
    'CHEMICAL_HANDLING',
    'QUALITY_CONTROL'
);

CREATE TABLE team_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role team_role NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    hourly_rate DECIMAL(8,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Skills and certifications
    skills cleaning_skill[],
    certifications TEXT[],
    
    -- Availability (stored as JSON for flexibility)
    availability JSONB NOT NULL, -- TeamAvailability interface
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- JOB SCHEDULING & MANAGEMENT
-- ============================================================================

CREATE TYPE cleaning_job_type AS ENUM (
    'KONTORRENHOLD',
    'PRIVATRENHOLD',
    'FLYTTERENHOLD',
    'BYGGERENHOLD',
    'VINDUESPUDSNING',
    'TÆPPERENS',
    'SPECIALRENGØRING',
    'VEDLIGEHOLDELSE',
    'DYBRENGØRING',
    'AKUTRENGØRING'
);

CREATE TYPE job_status AS ENUM (
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'PAUSED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'RESCHEDULED'
);

CREATE TYPE job_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);

CREATE TABLE cleaning_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    location_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    job_type cleaning_job_type NOT NULL,
    status job_status NOT NULL DEFAULT 'SCHEDULED',
    priority job_priority NOT NULL DEFAULT 'NORMAL',
    
    -- Scheduling
    scheduled_date TIMESTAMP(3) NOT NULL,
    scheduled_time TEXT NOT NULL, -- "09:00" format
    estimated_duration INTEGER NOT NULL, -- minutes
    actual_duration INTEGER, -- minutes
    completed_at TIMESTAMP(3),
    
    -- Location details
    location_details JSONB, -- JobLocation interface
    
    -- Recurring configuration
    recurring_config JSONB, -- RecurringConfig interface
    
    -- Equipment and supplies
    equipment_requirements JSONB, -- EquipmentRequirement[]
    supply_requirements JSONB, -- SupplyRequirement[]
    special_requirements TEXT[],
    
    -- Quality and feedback
    quality_check JSONB, -- QualityCheck interface
    customer_signature TEXT,
    
    -- Cost information
    cost_details JSONB NOT NULL, -- JobCost interface
    
    -- Metadata
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES customer_locations(id)
);

CREATE TABLE job_team_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    job_id TEXT NOT NULL,
    team_member_id TEXT NOT NULL,
    role TEXT, -- specific role for this job
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(job_id, team_member_id),
    FOREIGN KEY (job_id) REFERENCES cleaning_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
);

-- ============================================================================
-- QUALITY CONTROL & DOCUMENTATION
-- ============================================================================

CREATE TYPE photo_type AS ENUM (
    'BEFORE',
    'DURING',
    'AFTER',
    'ISSUE',
    'COMPLETED'
);

CREATE TYPE note_type AS ENUM (
    'GENERAL',
    'ISSUE',
    'CUSTOMER',
    'INTERNAL'
);

CREATE TYPE sentiment AS ENUM (
    'POSITIVE',
    'NEUTRAL',
    'NEGATIVE'
);

CREATE TABLE job_photos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    job_id TEXT NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    type photo_type NOT NULL,
    uploaded_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT NOT NULL,
    
    FOREIGN KEY (job_id) REFERENCES cleaning_jobs(id) ON DELETE CASCADE
);

CREATE TABLE job_notes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    job_id TEXT NOT NULL,
    text TEXT NOT NULL,
    type note_type NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    
    FOREIGN KEY (job_id) REFERENCES cleaning_jobs(id) ON DELETE CASCADE
);

CREATE TABLE customer_feedback (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL,
    job_id TEXT,
    rating INTEGER NOT NULL, -- 1-5
    comment TEXT,
    themes TEXT[], -- feedback themes
    sentiment sentiment NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ============================================================================
-- ROUTE OPTIMIZATION
-- ============================================================================

CREATE TYPE route_status AS ENUM (
    'PLANNED',
    'ACTIVE',
    'COMPLETED'
);

CREATE TABLE routes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    team_member_id TEXT NOT NULL,
    date TIMESTAMP(3) NOT NULL,
    status route_status NOT NULL DEFAULT 'PLANNED',
    
    -- Route details
    estimated_duration INTEGER NOT NULL, -- total minutes
    estimated_distance DECIMAL(8,2) NOT NULL, -- km
    estimated_cost DECIMAL(10,2) NOT NULL, -- DKK
    
    -- Location data
    start_location JSONB, -- JobLocation
    end_location JSONB, -- JobLocation
    
    -- Optimization data
    optimization_data JSONB, -- RouteOptimization interface
    
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
);

CREATE TABLE route_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    route_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    order_index INTEGER NOT NULL, -- sequence in route
    estimated_arrival TIMESTAMP(3),
    actual_arrival TIMESTAMP(3),
    estimated_departure TIMESTAMP(3),
    actual_departure TIMESTAMP(3),
    
    UNIQUE(route_id, job_id),
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES cleaning_jobs(id) ON DELETE CASCADE
);

-- ============================================================================
-- CALENDAR & SCHEDULING
-- ============================================================================

CREATE TYPE event_type AS ENUM (
    'JOB',
    'BREAK',
    'TRAVEL',
    'MEETING',
    'VACATION'
);

CREATE TABLE calendar_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    job_id TEXT UNIQUE,
    title TEXT NOT NULL,
    start TIMESTAMP(3) NOT NULL,
    end TIMESTAMP(3) NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT false,
    type event_type NOT NULL,
    color TEXT,
    editable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES cleaning_jobs(id) ON DELETE CASCADE
);

-- ============================================================================
-- INVENTORY MANAGEMENT
-- ============================================================================

CREATE TABLE equipment (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    maintenance_schedule JSONB, -- maintenance intervals
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE supplies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL, -- 'stk', 'liter', 'kg'
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER,
    cost_per_unit DECIMAL(8,2) NOT NULL,
    supplier TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- ANALYTICS & REPORTING
-- ============================================================================

CREATE TABLE scheduling_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    period_start TIMESTAMP(3) NOT NULL,
    period_end TIMESTAMP(3) NOT NULL,
    
    -- Job metrics
    total_jobs INTEGER NOT NULL,
    completed_jobs INTEGER NOT NULL,
    cancelled_jobs INTEGER NOT NULL,
    average_job_duration DECIMAL(8,2) NOT NULL, -- minutes
    
    -- Financial metrics
    total_revenue DECIMAL(12,2) NOT NULL,
    average_job_value DECIMAL(10,2) NOT NULL,
    
    -- Quality metrics
    customer_satisfaction DECIMAL(3,2) NOT NULL, -- 0-5 scale
    team_utilization DECIMAL(3,2) NOT NULL, -- 0-1 scale
    route_efficiency DECIMAL(3,2) NOT NULL, -- 0-1 scale
    
    -- Performance metrics
    on_time_completion DECIMAL(3,2) NOT NULL, -- 0-1 scale
    customer_retention DECIMAL(3,2) NOT NULL, -- 0-1 scale
    
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, period_start, period_end),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

CREATE TABLE system_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, key),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tenant-based indexes for multi-tenancy
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customer_locations_customer_id ON customer_locations(customer_id);
CREATE INDEX idx_team_members_tenant_id ON team_members(tenant_id);
CREATE INDEX idx_cleaning_jobs_tenant_id ON cleaning_jobs(tenant_id);
CREATE INDEX idx_cleaning_jobs_customer_id ON cleaning_jobs(customer_id);
CREATE INDEX idx_cleaning_jobs_scheduled_date ON cleaning_jobs(scheduled_date);
CREATE INDEX idx_routes_tenant_id ON routes(tenant_id);
CREATE INDEX idx_routes_team_member_id ON routes(team_member_id);
CREATE INDEX idx_calendar_events_start ON calendar_events(start);
CREATE INDEX idx_equipment_tenant_id ON equipment(tenant_id);
CREATE INDEX idx_supplies_tenant_id ON supplies(tenant_id);
CREATE INDEX idx_scheduling_metrics_tenant_id ON scheduling_metrics(tenant_id);
CREATE INDEX idx_system_config_tenant_id ON system_config(tenant_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);

-- Danish postal code indexes
CREATE INDEX idx_customers_postal_code ON customers(postal_code);
CREATE INDEX idx_customer_locations_postal_code ON customer_locations(postal_code);

-- Job status and priority indexes
CREATE INDEX idx_cleaning_jobs_status ON cleaning_jobs(status);
CREATE INDEX idx_cleaning_jobs_priority ON cleaning_jobs(priority);
CREATE INDEX idx_cleaning_jobs_job_type ON cleaning_jobs(job_type);

-- Route optimization indexes
CREATE INDEX idx_routes_date ON routes(date);
CREATE INDEX idx_routes_status ON routes(status);

-- Calendar event indexes
CREATE INDEX idx_calendar_events_type ON calendar_events(type);
CREATE INDEX idx_calendar_events_all_day ON calendar_events(all_day);

-- Equipment and supplies indexes
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_is_available ON equipment(is_available);
CREATE INDEX idx_supplies_category ON supplies(category);
CREATE INDEX idx_supplies_is_active ON supplies(is_active);

-- Audit log indexes
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_locations_updated_at BEFORE UPDATE ON customer_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cleaning_jobs_updated_at BEFORE UPDATE ON cleaning_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplies_updated_at BEFORE UPDATE ON supplies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tenants IS 'Multi-tenant SaaS platform tenants for Danish cleaning companies';
COMMENT ON TABLE customers IS 'Customers of cleaning companies with Danish business requirements';
COMMENT ON TABLE cleaning_jobs IS 'Core job scheduling table for Danish cleaning industry';
COMMENT ON TABLE team_members IS 'Cleaning team members with Danish certifications and skills';
COMMENT ON TABLE routes IS 'Route optimization for Danish addresses and postal codes';
COMMENT ON TABLE calendar_events IS 'Calendar integration for Danish business hours and holidays';

COMMENT ON COLUMN customers.postal_code IS 'Danish postal code (4 digits)';
COMMENT ON COLUMN customers.cvr_number IS 'Danish CVR number for business customers';
COMMENT ON COLUMN cleaning_jobs.scheduled_time IS 'Time in HH:MM format (24-hour)';
COMMENT ON COLUMN team_members.hourly_rate IS 'Hourly rate in DKK';
COMMENT ON COLUMN cleaning_jobs.cost_details IS 'Job cost breakdown in DKK currency';
