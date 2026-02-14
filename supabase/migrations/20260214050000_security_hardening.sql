-- SECURITY HARDENING MIGRATION

-- 1. Ensure RLS is enabled on all key tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.zone_history ENABLE ROW LEVEL SECURITY;

-- 2. Hardening Profiles (Ensure nobody can change their own role)
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If the role is being changed and the caller is not a superuser/service_role
    IF (OLD.role != NEW.role) AND (current_setting('role') != 'service_role') THEN
        -- Only check if auth.uid() is not null (web context)
        IF auth.uid() IS NOT NULL THEN
            -- Check if caller is superadmin
            IF NOT EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'superadmin'
            ) THEN
                RAISE EXCEPTION 'Solo los superadmins pueden cambiar roles.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_role();


-- 3. Zones RLS (Hardening)
DROP POLICY IF EXISTS "Users can manage their own zones" ON public.zones;
DROP POLICY IF EXISTS "Users can view their own zones" ON public.zones;
DROP POLICY IF EXISTS "Users can insert their own zones" ON public.zones;
DROP POLICY IF EXISTS "Users can update their own zones" ON public.zones;
DROP POLICY IF EXISTS "Users can delete their own zones" ON public.zones;

CREATE POLICY "Users can manage their own zones" ON public.zones
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 4. Zone History RLS (Hardening)
DROP POLICY IF EXISTS "Users can view history of their own zones" ON public.zone_history;
DROP POLICY IF EXISTS "Users can view zone history" ON public.zone_history;

CREATE POLICY "Users can view zone history" ON public.zone_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.zones
        WHERE zones.id = zone_history.zone_id
        AND zones.user_id = auth.uid()
    )
);

-- 5. Subscriptions RLS (FIXING SECURITY HOLE)
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert subscription (mock payment)" ON public.subscriptions;

-- Users can only READ their own subscription
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- DO NOT allow users to insert/update subscriptions directly. 
-- In a real app, this is done via Webhooks using service_role.
-- If the project still needs "mock" payments from client, 
-- keep it restricted to 'active' status being set only via Backend Server Actions.
-- For maximum security, we remove the INSERT/UPDATE policy for public/anon.
