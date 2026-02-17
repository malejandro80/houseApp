-- Create advisor_metrics table
CREATE TABLE IF NOT EXISTS public.advisor_metrics (
    advisor_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_xp INTEGER DEFAULT 0,
    current_tier TEXT DEFAULT 'ROOKIE' CHECK (current_tier IN ('ROOKIE', 'GOLD', 'DIAMOND')),
    sales_count INTEGER DEFAULT 0,
    avg_response_time FLOAT DEFAULT 0,
    rating_avg FLOAT DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reputation_logs table
CREATE TABLE IF NOT EXISTS public.reputation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    advisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'SALE_CLOSED', 'REVIEW_5_STAR', 'LEAK_ATTEMPT'
    points_delta INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advisor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for advisor_metrics
-- Public read (for showing badges on listings)
DROP POLICY IF EXISTS "Public read metrics" ON public.advisor_metrics;
CREATE POLICY "Public read metrics" ON public.advisor_metrics
    FOR SELECT USING (true);

-- System update only (service role)
-- No INSERT/UPDATE policies for authenticated users, updates happen via server actions with service role

-- Policies for reputation_logs
-- Advisors can see their own logs
DROP POLICY IF EXISTS "Advisors view own logs" ON public.reputation_logs;
CREATE POLICY "Advisors view own logs" ON public.reputation_logs
    FOR SELECT USING (auth.uid() = advisor_id);

-- Trigger for metrics updated_at
DROP TRIGGER IF EXISTS update_advisor_metrics_updated_at ON public.advisor_metrics;
CREATE TRIGGER update_advisor_metrics_updated_at
    BEFORE UPDATE ON public.advisor_metrics
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
