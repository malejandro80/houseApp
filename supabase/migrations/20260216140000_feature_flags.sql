-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone (or at least authenticated users, depending on strictness. Public read is often needed for login/landing flags) 
--    Let's allow public read for now to prevent chicken-egg issues on landing pages.
DROP POLICY IF EXISTS "Public read access" ON public.feature_flags;
CREATE POLICY "Public read access" ON public.feature_flags
    FOR SELECT USING (true);

-- 2. Only Admins can insert/update/delete
--    Assuming 'admin' role or specific claim. For now, we use the service_role for seeding 
--    and restrict via app logic, or check auth.jwt() -> role = 'admin' if using Supabase Auth custom claims.
--    This policy assumes a profile table check or simple auth check. 
--    Let's make it strict: Only users with role 'admin' in public.profiles (if exists) or service_role.
--    To keep it simple and robust for this step:
DROP POLICY IF EXISTS "Admins can manage flags" ON public.feature_flags;
CREATE POLICY "Admins can manage flags" ON public.feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
