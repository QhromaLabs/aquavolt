-- Create regions table for Futurise region management
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    description TEXT,
    futurise_region_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read regions
CREATE POLICY "Authenticated users can view regions"
    ON public.regions
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Allow admins to do everything (using profiles table)
CREATE POLICY "Admin full access to regions"
    ON public.regions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_regions_name ON public.regions(name);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_regions_updated_at
    BEFORE UPDATE ON public.regions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
