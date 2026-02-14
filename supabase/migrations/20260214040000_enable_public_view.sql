-- Enable RLS on properties table (if not already enabled)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 1. Policy for Public View (Listed properties are visible to everyone)
-- This allows anyone (authenticated or anonymous) to SELECT properties that are listed.
DROP POLICY IF EXISTS "Public properties are visible to everyone" ON properties;
CREATE POLICY "Public properties are visible to everyone"
ON properties FOR SELECT
USING (is_listed = true);

-- 2. Policy for Owner View (Owner can see all their properties, listed or not)
-- This covers investment/private properties.
DROP POLICY IF EXISTS "Users can see their own properties" ON properties;
CREATE POLICY "Users can see their own properties"
ON properties FOR SELECT
USING (auth.uid() = user_id);

-- 3. Policy for Insert (Authenticated users can create properties)
DROP POLICY IF EXISTS "Users can create properties" ON properties;
CREATE POLICY "Users can create properties"
ON properties FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Policy for Update (Users can update their own properties)
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
CREATE POLICY "Users can update their own properties"
ON properties FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Policy for Delete (Users can delete their own properties)
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
CREATE POLICY "Users can delete their own properties"
ON properties FOR DELETE
USING (auth.uid() = user_id);
