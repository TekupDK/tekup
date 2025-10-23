-- RendetaljeOS Database Setup Script
-- Run this script to set up the complete database schema

-- First, run the main schema
\i schema.sql

-- Then apply RLS policies
\i rls-policies.sql

-- Finally, configure Supabase-specific features
\i supabase-config.sql

-- Insert default data for development/testing
INSERT INTO organizations (id, name, email, phone, address, settings) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Rendetalje.dk',
    'info@rendetalje.dk',
    '+45 12 34 56 78',
    '{"street": "Hovedgade 123", "city": "København", "postal_code": "1000", "country": "Denmark"}',
    '{"timezone": "Europe/Copenhagen", "currency": "DKK", "language": "da"}'
);

-- Insert default owner user
INSERT INTO users (id, organization_id, email, name, role, phone, settings) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'owner@rendetalje.dk',
    'Rendetalje Owner',
    'owner',
    '+45 12 34 56 78',
    '{"notifications": {"email": true, "sms": true, "push": true}}'
);

-- Insert default quality checklists
INSERT INTO quality_checklists (organization_id, service_type, name, items) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'standard',
    'Standard Cleaning Checklist',
    '[
        {"id": "vacuum_floors", "title": "Støvsug alle gulve", "required": true, "photo_required": false},
        {"id": "mop_floors", "title": "Vask alle gulve", "required": true, "photo_required": false},
        {"id": "clean_bathroom", "title": "Rengør badeværelse", "required": true, "photo_required": true},
        {"id": "clean_kitchen", "title": "Rengør køkken", "required": true, "photo_required": true},
        {"id": "dust_surfaces", "title": "Aftør alle overflader", "required": true, "photo_required": false},
        {"id": "empty_trash", "title": "Tøm skraldespande", "required": true, "photo_required": false},
        {"id": "check_supplies", "title": "Tjek forsyninger", "required": false, "photo_required": false}
    ]'
),
(
    '00000000-0000-0000-0000-000000000001',
    'deep',
    'Deep Cleaning Checklist',
    '[
        {"id": "vacuum_floors", "title": "Støvsug alle gulve grundigt", "required": true, "photo_required": false},
        {"id": "mop_floors", "title": "Vask alle gulve grundigt", "required": true, "photo_required": true},
        {"id": "clean_bathroom_deep", "title": "Dybderengør badeværelse", "required": true, "photo_required": true},
        {"id": "clean_kitchen_deep", "title": "Dybderengør køkken", "required": true, "photo_required": true},
        {"id": "clean_windows", "title": "Rengør vinduer", "required": true, "photo_required": true},
        {"id": "clean_baseboards", "title": "Rengør fodpaneler", "required": true, "photo_required": false},
        {"id": "clean_light_fixtures", "title": "Rengør lamper", "required": true, "photo_required": false},
        {"id": "organize_spaces", "title": "Organiser rum", "required": false, "photo_required": false}
    ]'
),
(
    '00000000-0000-0000-0000-000000000001',
    'window',
    'Window Cleaning Checklist',
    '[
        {"id": "clean_exterior_windows", "title": "Rengør vinduer udefra", "required": true, "photo_required": true},
        {"id": "clean_interior_windows", "title": "Rengør vinduer indefra", "required": true, "photo_required": true},
        {"id": "clean_window_frames", "title": "Rengør vinduesrammer", "required": true, "photo_required": false},
        {"id": "clean_window_sills", "title": "Rengør vindueskarme", "required": true, "photo_required": false},
        {"id": "check_window_condition", "title": "Tjek vinduestilstand", "required": false, "photo_required": true}
    ]'
);

-- Create sample customer for testing
INSERT INTO customers (organization_id, name, email, phone, address, preferences) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Test Kunde',
    'kunde@example.com',
    '+45 87 65 43 21',
    '{"street": "Testvej 456", "city": "Aarhus", "postal_code": "8000", "country": "Denmark"}',
    '{"preferred_time": "morning", "special_instructions": "Ring på før ankomst", "key_location": "Under dørmåtten"}'
);

-- Display setup completion message
SELECT 'RendetaljeOS database setup completed successfully!' as message;