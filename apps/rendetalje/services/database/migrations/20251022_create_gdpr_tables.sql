-- GDPR Compliance Tables
-- These tables support GDPR requirements for data protection, consent management, and user rights

-- Data Export Requests (Right to Data Portability)
CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    download_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Data Deletion Requests (Right to be Forgotten)
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    scheduled_deletion_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Consent Records (Consent Management)
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- e.g., 'marketing', 'analytics', 'cookies', 'data_processing'
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0', -- Privacy policy version
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Privacy Policies (Version Management)
CREATE TABLE IF NOT EXISTS privacy_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Data Processing Activities (GDPR Article 30 - Records of Processing)
CREATE TABLE IF NOT EXISTS data_processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    purpose TEXT NOT NULL, -- Purpose of processing
    legal_basis VARCHAR(100) NOT NULL, -- Legal basis under GDPR
    data_categories TEXT[], -- Categories of personal data
    data_subjects TEXT[], -- Categories of data subjects
    recipients TEXT[], -- Recipients of personal data
    retention_period VARCHAR(100), -- Data retention period
    security_measures TEXT, -- Technical and organizational measures
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Data Breach Log (GDPR Article 33 - Notification of breach)
CREATE TABLE IF NOT EXISTS data_breach_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    discovered_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    description TEXT NOT NULL,
    affected_data_types TEXT[], -- Types of data affected
    affected_records_count INTEGER,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    notification_required BOOLEAN NOT NULL DEFAULT FALSE,
    authority_notified BOOLEAN NOT NULL DEFAULT FALSE,
    authority_notification_date TIMESTAMP WITH TIME ZONE,
    subjects_notified BOOLEAN NOT NULL DEFAULT FALSE,
    subjects_notification_date TIMESTAMP WITH TIME ZONE,
    mitigation_measures TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Audit Log for GDPR Activities
CREATE TABLE IF NOT EXISTS gdpr_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(100) NOT NULL, -- e.g., 'data_export', 'data_deletion', 'consent_granted'
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_expires_at ON data_export_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_scheduled_date ON data_deletion_requests(scheduled_deletion_date);

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_granted_at ON consent_records(granted_at);

CREATE INDEX IF NOT EXISTS idx_privacy_policies_active ON privacy_policies(active);
CREATE INDEX IF NOT EXISTS idx_privacy_policies_version ON privacy_policies(version);

CREATE INDEX IF NOT EXISTS idx_data_breach_log_incident_date ON data_breach_log(incident_date);
CREATE INDEX IF NOT EXISTS idx_data_breach_log_status ON data_breach_log(status);
CREATE INDEX IF NOT EXISTS idx_data_breach_log_risk_level ON data_breach_log(risk_level);

CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_user_id ON gdpr_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_activity_type ON gdpr_audit_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_created_at ON gdpr_audit_log(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data export requests
CREATE POLICY data_export_requests_user_policy ON data_export_requests
    FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own data deletion requests
CREATE POLICY data_deletion_requests_user_policy ON data_deletion_requests
    FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own consent records
CREATE POLICY consent_records_user_policy ON consent_records
    FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own audit log entries
CREATE POLICY gdpr_audit_log_user_policy ON gdpr_audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Privacy policies are readable by all authenticated users
CREATE POLICY privacy_policies_read_policy ON privacy_policies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage privacy policies
CREATE POLICY privacy_policies_admin_policy ON privacy_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Only admins can access data processing activities and breach logs
CREATE POLICY data_processing_activities_admin_policy ON data_processing_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY data_breach_log_admin_policy ON data_breach_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_data_export_requests_updated_at 
    BEFORE UPDATE ON data_export_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at 
    BEFORE UPDATE ON data_deletion_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_processing_activities_updated_at 
    BEFORE UPDATE ON data_processing_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_breach_log_updated_at 
    BEFORE UPDATE ON data_breach_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default privacy policy
INSERT INTO privacy_policies (version, content, active) VALUES (
    '1.0',
    'Default Privacy Policy Content - This should be replaced with actual privacy policy content.',
    TRUE
) ON CONFLICT (version) DO NOTHING;

-- Insert default data processing activities
INSERT INTO data_processing_activities (
    name, 
    description, 
    purpose, 
    legal_basis, 
    data_categories, 
    data_subjects, 
    recipients, 
    retention_period, 
    security_measures
) VALUES (
    'Customer Management',
    'Processing customer data for service delivery',
    'Service delivery and customer relationship management',
    'Contract performance (GDPR Art. 6(1)(b))',
    ARRAY['Name', 'Email', 'Phone', 'Address', 'Service preferences'],
    ARRAY['Customers', 'Potential customers'],
    ARRAY['Internal staff', 'Service providers'],
    '7 years after last service',
    'Encryption at rest and in transit, access controls, regular backups'
),
(
    'Employee Management',
    'Processing employee data for HR and payroll',
    'Employment relationship management',
    'Contract performance (GDPR Art. 6(1)(b))',
    ARRAY['Name', 'Email', 'Phone', 'Address', 'Employment details', 'Time tracking'],
    ARRAY['Employees', 'Job applicants'],
    ARRAY['HR department', 'Payroll provider'],
    '5 years after employment ends',
    'Encryption at rest and in transit, role-based access controls'
),
(
    'Service Analytics',
    'Analysis of service performance and customer satisfaction',
    'Business improvement and quality assurance',
    'Legitimate interest (GDPR Art. 6(1)(f))',
    ARRAY['Service ratings', 'Feedback', 'Usage patterns'],
    ARRAY['Customers'],
    ARRAY['Internal management'],
    '3 years',
    'Anonymization where possible, access controls'
) ON CONFLICT DO NOTHING;