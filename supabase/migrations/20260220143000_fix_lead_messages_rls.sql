DROP POLICY IF EXISTS "Advisors and Users can manage their own lead messages" ON lead_messages;

CREATE POLICY "Enable read access for involved users" ON lead_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = lead_messages.lead_id
            AND (leads.advisor_id = auth.uid() OR leads.created_by = auth.uid())
        )
    );

CREATE POLICY "Enable insert for involved users" ON lead_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = lead_id
            AND (leads.advisor_id = auth.uid() OR leads.created_by = auth.uid())
        )
    );
