-- Correction migration for Commission Settings Constraints

-- 1. Standardize entity_id for GLOBAL settings (replace NULL with 'GLOBAL')
UPDATE public.commission_settings 
SET entity_id = 'GLOBAL' 
WHERE entity_type = 'GLOBAL' AND entity_id IS NULL;

-- 2. Drop previous partial indexes if they exist
DROP INDEX IF EXISTS idx_unique_global_settings;
DROP INDEX IF EXISTS idx_unique_agent_settings;

-- 3. Create a single STANDARD Unique Index that works with ON CONFLICT (entity_type, entity_id)
-- Note: We rely on entity_id being non-null for uniqueness to work as expected across all rows.
-- If specific agent IDs could be 'GLOBAL', that would be a conflict, but IDs are UUIDs, so 'GLOBAL' is safe.
CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_settings_unique_upsert 
ON public.commission_settings (entity_type, entity_id);

-- 4. Optional: Enforce entity_id constraint if desired, but for now we just rely on the index.
-- ALTER TABLE public.commission_settings ALTER COLUMN entity_id SET NOT NULL; -- Can do this if we are sure no other nulls exist.
