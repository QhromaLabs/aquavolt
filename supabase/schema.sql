-- Aquavolt Database Schema - FIXED VERSION
-- This script creates all tables FIRST, then adds RLS policies
-- This prevents "relation does not exist" errors

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE ALL TABLES FIRST (No RLS policies yet)
-- ============================================================================

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'landlord', 'caretaker', 'tenant', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  location TEXT,
  region_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UNITS TABLE
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  meter_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UNIT ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS unit_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TOPUPS TABLE
CREATE TABLE IF NOT EXISTS topups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount_paid NUMERIC(10, 2) NOT NULL,
  amount_vended NUMERIC(10, 2) NOT NULL,
  fee_amount NUMERIC(10, 2) DEFAULT 0,
  payment_channel TEXT,
  token TEXT,
  futurise_status TEXT,
  futurise_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MAINTENANCE TOKENS TABLE
CREATE TABLE IF NOT EXISTS maintenance_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_number TEXT NOT NULL,
  sub_class INTEGER NOT NULL,
  value NUMERIC,
  explain TEXT,
  token TEXT,
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topup_id UUID REFERENCES topups(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ISSUES TABLE
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  caretaker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('meter_tamper', 'power_cut', 'phase_error', 'meter_lock', 'keypad_error', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS api_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL UNIQUE,
  credentials JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_meter ON units(meter_number);
CREATE INDEX IF NOT EXISTS idx_unit_assignments_unit ON unit_assignments(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_assignments_tenant ON unit_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_topups_unit ON topups(unit_id);
CREATE INDEX IF NOT EXISTS idx_topups_tenant ON topups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_topups_created ON topups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_property ON commissions(property_id);
CREATE INDEX IF NOT EXISTS idx_issues_unit ON issues(unit_id);
CREATE INDEX IF NOT EXISTS idx_issues_caretaker ON issues(caretaker_id);

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PROFILES
-- ============================================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - PROPERTIES
-- ============================================================================
CREATE POLICY "Landlords can view own properties"
  ON properties FOR SELECT
  USING (landlord_id = auth.uid());

CREATE POLICY "Admins can view all properties"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert properties"
  ON properties FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update properties"
  ON properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Landlords can update own properties"
  ON properties FOR UPDATE
  USING (landlord_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - UNITS
-- ============================================================================
CREATE POLICY "Landlords can view units in their properties"
  ON units FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = units.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can view their assigned units"
  ON units FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM unit_assignments
      WHERE unit_assignments.unit_id = units.id
      AND unit_assignments.tenant_id = auth.uid()
      AND unit_assignments.status = 'active'
    )
  );

CREATE POLICY "Admins can view all units"
  ON units FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage units"
  ON units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - UNIT ASSIGNMENTS
-- ============================================================================
CREATE POLICY "Tenants can view own assignments"
  ON unit_assignments FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Landlords can view assignments in their properties"
  ON unit_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = (SELECT property_id FROM units WHERE units.id = unit_assignments.unit_id)
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage assignments"
  ON unit_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - TOPUPS
-- ============================================================================
CREATE POLICY "Tenants can view own topups"
  ON topups FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert own topups"
  ON topups FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Landlords can view topups in their properties"
  ON topups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON units.property_id = properties.id
      WHERE units.id = topups.unit_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all topups"
  ON topups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - MAINTENANCE TOKENS
-- ============================================================================
CREATE POLICY "Only admins can manage maintenance tokens"
  ON maintenance_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - COMMISSIONS
-- ============================================================================
CREATE POLICY "Agents can view own commissions"
  ON commissions FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Landlords can view commissions for their properties"
  ON commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = commissions.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage commissions"
  ON commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - ISSUES
-- ============================================================================
CREATE POLICY "Caretakers can insert issues"
  ON issues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'caretaker'
    )
  );

CREATE POLICY "Caretakers can view own issues"
  ON issues FOR SELECT
  USING (caretaker_id = auth.uid());

CREATE POLICY "Landlords can view issues in their properties"
  ON issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON units.property_id = properties.id
      WHERE units.id = issues.unit_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage issues"
  ON issues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - API CREDENTIALS
-- ============================================================================
CREATE POLICY "Only admins can manage API credentials"
  ON api_credentials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unit_assignments_updated_at BEFORE UPDATE ON unit_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
