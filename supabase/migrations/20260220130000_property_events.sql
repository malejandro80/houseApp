-- Migration to create the property_events table for tracking analytics

CREATE TABLE IF NOT EXISTS public.property_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'view', 'contact_click', 'share'
    viewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_events ENABLE ROW LEVEL SECURITY;

-- Everyone can insert events (including anon users if they browse)
CREATE POLICY "Enable insert for all" ON public.property_events
    FOR INSERT WITH CHECK (true);

-- Owners and assigned advisors can read events for their properties
CREATE POLICY "Enable read for related users" ON public.property_events
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM public.properties 
            WHERE user_id = auth.uid() OR assigned_advisor_id = auth.uid()
        )
    );
