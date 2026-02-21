-- Fix RLS for leads table to allow creators to read their own leads
DROP POLICY IF EXISTS "Advisors can manage their own leads" ON leads;

-- Full access for advisors
CREATE POLICY "Advisors can manage their own leads" ON leads
    FOR ALL USING (auth.uid() = advisor_id);

-- Read access for creators
CREATE POLICY "Creators can view their own leads" ON leads
    FOR SELECT USING (auth.uid() = created_by);
