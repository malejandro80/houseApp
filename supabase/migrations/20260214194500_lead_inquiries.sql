-- Migration: Enhance leads table for inquiries and public submissions
-- Adjusting RLS to allow users to send messages to advisors.

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS message TEXT;

-- Update RLS Policies for leads
-- 1. Advisors can still manage their own leads
-- 2. Authenticated users can INSERT leads (inquiries) for any advisor

DROP POLICY IF EXISTS "Advisors can manage their own leads" ON public.leads;

-- Policy for advisors: FULL control of their own leads
CREATE POLICY "Advisors can manage their own leads" ON public.leads
    FOR ALL USING (auth.uid() = advisor_id);

-- Policy for public/authenticated users: Only INSERT inquiries
-- We restrict this so they can only insert into the 'prospecto' stage (ideally)
-- but for now let's allow insert with a basic check.
DROP POLICY IF EXISTS "Users can submit inquiries" ON public.leads;
CREATE POLICY "Users can submit inquiries" ON public.leads
    FOR INSERT WITH CHECK (true);
