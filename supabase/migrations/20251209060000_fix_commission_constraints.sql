-- Migration to add unique constraints to commission_settings

-- 1. Clean up potential duplicates (keep the most recent one)
DELETE FROM public.commission_settings a USING (
      SELECT MIN(ctid) as ctid, entity_type, entity_id
      FROM public.commission_settings 
      GROUP BY entity_type, entity_id HAVING COUNT(*) > 1
      ) b
      WHERE a.entity_type = b.entity_type 
      AND (a.entity_id = b.entity_id OR (a.entity_id IS NULL AND b.entity_id IS NULL))
      AND a.ctid <> b.ctid;

-- 2. Create Partial Unique Index for GLOBAL settings (entity_id is NULL)
DROP INDEX IF EXISTS idx_unique_global_settings;
CREATE UNIQUE INDEX idx_unique_global_settings 
ON public.commission_settings (entity_type) 
WHERE entity_type = 'GLOBAL';

-- 3. Create Partial Unique Index for AGENT settings (entity_id is NOT NULL)
DROP INDEX IF EXISTS idx_unique_agent_settings;
CREATE UNIQUE INDEX idx_unique_agent_settings 
ON public.commission_settings (entity_type, entity_id) 
WHERE entity_type = 'AGENT';
