-- Seed data for testing Aquavolt platform
-- Run this after running schema.sql

-- ============================================================================
-- SEED DATA - TEST USERS
-- ============================================================================
-- Note: These users need to be created through Supabase Auth first
-- Then their profiles will be auto-created by the trigger

-- For testing, you can create users with these emails in Supabase Dashboard:
-- 1. admin@aquavolt.com (role: admin, password: admin123)
-- 2. landlord@aquavolt.com (role: landlord, password: landlord123)
-- 3. caretaker@aquavolt.com (role: caretaker, password: caretaker123)
-- 4. tenant@aquavolt.com (role: tenant, password: tenant123)
-- 5. agent@aquavolt.com (role: agent, password: agent123)

-- ============================================================================
-- SEED DATA - PROPERTIES
-- ============================================================================
-- First, get the landlord's UUID from profiles table
-- Replace 'LANDLORD_UUID' with the actual UUID after creating the landlord user

-- INSERT INTO properties (name, location, region_code, landlord_id) VALUES
-- ('Green Valley Apartments', 'Nairobi, Westlands', 'NBI-001', 'LANDLORD_UUID'),
-- ('Sunrise Residences', 'Nairobi, Kilimani', 'NBI-002', 'LANDLORD_UUID'),
-- ('Palm Heights', 'Mombasa, Nyali', 'MBA-001', 'LANDLORD_UUID');

-- ============================================================================
-- SEED DATA - UNITS
-- ============================================================================
-- Replace 'PROPERTY_UUID' with actual property UUIDs

-- INSERT INTO units (property_id, label, meter_number, status) VALUES
-- ('PROPERTY_UUID', 'Unit A1', '12345678901', 'active'),
-- ('PROPERTY_UUID', 'Unit A2', '12345678902', 'active'),
-- ('PROPERTY_UUID', 'Unit A3', '12345678903', 'active'),
-- ('PROPERTY_UUID', 'Unit B1', '12345678904', 'active'),
-- ('PROPERTY_UUID', 'Unit B2', '12345678905', 'active');

-- ============================================================================
-- SEED DATA - UNIT ASSIGNMENTS
-- ============================================================================
-- Replace 'UNIT_UUID' and 'TENANT_UUID' with actual UUIDs

-- INSERT INTO unit_assignments (unit_id, tenant_id, start_date, status) VALUES
-- ('UNIT_UUID', 'TENANT_UUID', '2024-01-01', 'active');

-- ============================================================================
-- SEED DATA - API CREDENTIALS
-- ============================================================================
-- Store Futurise API credentials (admin only)

INSERT INTO api_credentials (service_name, credentials) VALUES
('futurise', '{
  "base_url": "https://dlms.futurise-tech.com/api",
  "vendor": "aquavolt",
  "password": "123456",
  "token": null,
  "token_expires_at": null
}'::jsonb),
('mpesa', '{
  "consumer_key": "Sk9iveI4ZAJ7PIbMyGgKLOozsd52xbCALmERpSzpif1V1gsd",
  "consumer_secret": "K2qJMLSj8tgAeGXi6IpuW2ZEPUL72QoFvMXb7YQs6UoGBzbAQQqBtgo4Av83t3CL",
  "shortcode": "4214025",
  "passkey": ""
}'::jsonb);

-- ============================================================================
-- HELPER QUERIES FOR TESTING
-- ============================================================================

-- View all profiles
-- SELECT id, full_name, email, role FROM profiles;

-- View all properties with landlord info
-- SELECT p.*, pr.full_name as landlord_name
-- FROM properties p
-- LEFT JOIN profiles pr ON p.landlord_id = pr.id;

-- View all units with property info
-- SELECT u.*, p.name as property_name
-- FROM units u
-- LEFT JOIN properties p ON u.property_id = p.id;

-- View tenant assignments
-- SELECT ua.*, u.label as unit_label, p.full_name as tenant_name
-- FROM unit_assignments ua
-- LEFT JOIN units u ON ua.unit_id = u.id
-- LEFT JOIN profiles p ON ua.tenant_id = p.id;
