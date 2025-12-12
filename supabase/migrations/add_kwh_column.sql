-- Add kWh column to topups table
ALTER TABLE topups ADD COLUMN IF NOT EXISTS units_kwh NUMERIC(10, 2);

-- Create index for reporting
CREATE INDEX IF NOT EXISTS idx_topups_units_kwh ON topups(units_kwh);
