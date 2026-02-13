-- Migration: Business Model Enhancements (Advisor Verification, Subscriptions)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE verification_status_type AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_type AS ENUM ('active', 'inactive', 'past_due', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Modify 'profiles' for Advisor Verification & Availability
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_status verification_status_type DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb, -- Array of URLs
ADD COLUMN IF NOT EXISTS location POINT, -- PostGIS or simple point (lat/lon)
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Index for finding available advisors
CREATE INDEX IF NOT EXISTS idx_profiles_available_advisor 
ON public.profiles(role, verification_status, is_available) 
WHERE role = 'asesor' AND verification_status = 'verified' AND is_available = true;


-- 3. Create 'subscriptions' table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status subscription_status_type DEFAULT 'inactive',
    plan_type TEXT DEFAULT 'seller_basic',
    current_period_start TIMESTAMPTZ DEFAULT now(),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only service_role (payment webhook) or admin should update subscriptions normally.
-- For simple testing, we allow users to insert (e.g. buying a plan via client-side mock).
CREATE POLICY "Users can insert subscription (mock payment)" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. Modify 'properties' for Selling & Assignment
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_advisor_id UUID REFERENCES public.profiles(id);

-- Index for public listing
CREATE INDEX IF NOT EXISTS idx_properties_listed 
ON public.properties(is_listed) 
WHERE is_listed = true;
