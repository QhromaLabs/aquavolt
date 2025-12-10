-- Add agent_id to properties
ALTER TABLE "public"."properties" ADD COLUMN IF NOT EXISTS "agent_id" uuid REFERENCES "auth"."users"("id");

-- DROP tables to ensure clean slate (avoids column conflicts if table existed)
DROP TABLE IF EXISTS "public"."commissions";
DROP TABLE IF EXISTS "public"."commission_settings";

-- Create commission_settings table
CREATE TABLE IF NOT EXISTS "public"."commission_settings" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" text NOT NULL CHECK (entity_type IN ('GLOBAL', 'PROPERTY', 'AGENT')),
    "entity_id" text, -- Can be NULL for GLOBAL, or property_id/agent_id
    "percentage" numeric NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS "public"."commissions" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "recipient_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "source_topup_id" uuid NOT NULL REFERENCES "public"."topups"("id"),
    "amount" numeric NOT NULL,
    "percentage_applied" numeric NOT NULL,
    "status" text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "paid_at" timestamp with time zone
);

-- Enable RLS
ALTER TABLE "public"."commission_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;

-- Policies for Commission Settings
CREATE POLICY "Admins full access to commission_settings"
    ON "public"."commission_settings"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policies for Commissions
CREATE POLICY "Agents can view their own commissions"
    ON "public"."commissions"
    FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can view all commissions"
    ON "public"."commissions"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Trigger Function to Calculate Commission
CREATE OR REPLACE FUNCTION public.calculate_commission_on_topup()
RETURNS TRIGGER AS $$
DECLARE
    v_agent_id uuid;
    v_commission_rate numeric;
    v_commission_amount numeric;
BEGIN
    -- 1. Get the agent assigned to the property of the unit being topped up
    SELECT p.agent_id INTO v_agent_id
    FROM public.units u
    JOIN public.properties p ON p.id = u.property_id
    WHERE u.id = NEW.unit_id;

    -- If no agent assigned, exit
    IF v_agent_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 2. Determine Commission Rate
    -- Check specific agent setting
    SELECT percentage INTO v_commission_rate
    FROM public.commission_settings
    WHERE entity_type = 'AGENT' AND entity_id = v_agent_id::text
    LIMIT 1;

    -- If not found, check global
    IF v_commission_rate IS NULL THEN
        SELECT percentage INTO v_commission_rate
        FROM public.commission_settings
        WHERE entity_type = 'GLOBAL'
        LIMIT 1;
    END IF;

    -- Default to 0 if still null
    IF v_commission_rate IS NULL THEN
        v_commission_rate := 0; 
    END IF;

    -- 3. Calculate Amount
    v_commission_amount := NEW.amount_paid * (v_commission_rate / 100);

    -- 4. Insert Commission Record
    IF v_commission_amount > 0 THEN
        INSERT INTO public.commissions (recipient_id, source_topup_id, amount, percentage_applied, status)
        VALUES (v_agent_id, NEW.id, v_commission_amount, v_commission_rate, 'PENDING');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.topups;
CREATE TRIGGER trigger_calculate_commission
    AFTER INSERT ON public.topups
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_commission_on_topup();
