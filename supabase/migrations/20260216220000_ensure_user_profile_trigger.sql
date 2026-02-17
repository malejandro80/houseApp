-- ==========================================
-- Ensure User Profile Creation Trigger
-- ==========================================

-- 1. Create or Replace the Function
-- This function handles the insertion into public.profiles
-- whenever a new user is created in auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'usuario') -- Allow role override from metadata if needed, default to 'usuario'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url; -- If exists, just update basic info
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure Trigger Exists
-- We drop it first to be safe and re-create it.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill missing profiles (Optional safety net)
-- Insert profiles for any existing users that might have been missed
INSERT INTO public.profiles (id, full_name, avatar_url, role)
SELECT 
    id, 
    raw_user_meta_data->>'full_name', 
    raw_user_meta_data->>'avatar_url', 
    'usuario'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;
