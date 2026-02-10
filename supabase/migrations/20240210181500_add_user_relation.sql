-- Add user_id column to datahouse table
ALTER TABLE datahouse 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS (Redundant if already enabled, but safe)
ALTER TABLE datahouse ENABLE ROW LEVEL SECURITY;

-- Update Policies for Authenticated Users

-- 1. Allow authenticated users to insert their own properties
CREATE POLICY "Enable insert for authenticated users only"
ON datahouse
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to see only their own properties (or public ones if intended)
-- Assuming private for now based on "My Properties" context
CREATE POLICY "Enable select for owners"
ON datahouse
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow users to update their own properties
CREATE POLICY "Enable update for owners"
ON datahouse
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to delete their own properties
CREATE POLICY "Enable delete for owners"
ON datahouse
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Note: We might need to drop the old "anon" policies if we want to restrict access strictly to owners.
-- However, for now, I will keep them but user_id is optional for legacy data.
