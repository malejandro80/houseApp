-- Enable RLS on the table (if not already enabled)
ALTER TABLE datahouse ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous users to insert data
-- This is necessary because by default RLS blocks all access
CREATE POLICY "Enable insert for anon users"
ON datahouse
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy to allow anonymous users to select data (optional, if you want to display it properly)
CREATE POLICY "Enable select for anon users"
ON datahouse
FOR SELECT
TO anon
USING (true);
