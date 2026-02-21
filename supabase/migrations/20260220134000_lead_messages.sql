CREATE TABLE IF NOT EXISTS lead_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;

-- Policy: advisors and users involved can read and write
CREATE POLICY "Advisors and Users can manage their own lead messages" ON lead_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = lead_messages.lead_id
            AND (leads.advisor_id = auth.uid() OR leads.created_by = auth.uid())
        )
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE lead_messages;
