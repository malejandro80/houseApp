-- ==========================================
-- Smart Auto-Assignment Logic Migration
-- ==========================================

-- 1. Create table for assignment logs
CREATE TABLE IF NOT EXISTS public.assignment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    advisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    score DECIMAL(10, 2),
    metrics_snapshot JSONB, -- Snapshot of metrics at time of assignment
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for logs
ALTER TABLE public.assignment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all assignment logs" ON public.assignment_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );


-- 2. Function: Get Best Advisor
-- Logic: 
--  Filter: Role=asesor, Verified, Available, Load < 20 (Simulated by checking active properties)
--  Score: (Sales * 0.6) + (Speed_Score * 0.2) + (Rating * 0.2)
--    * Speed_Score: Invert response time (Lower is better). 
--      Let's assume max speed is 60 mins. Score = GREATEST(0, 60 - avg_response_time)
--    * Rating: 0-5 scale. Normalized to 0-100? Or just weighted as-is? 
--      Let's use raw weighted sum for simplicity first.
CREATE OR REPLACE FUNCTION get_best_advisor_for_property(prop_id UUID)
RETURNS UUID AS $$
DECLARE
    best_advisor_id UUID;
    advisor_record RECORD;
    current_score DECIMAL;
    max_score DECIMAL DEFAULT -1;
    
    -- Weights
    w_sales DECIMAL DEFAULT 0.6;
    w_speed DECIMAL DEFAULT 0.2;
    w_rating DECIMAL DEFAULT 0.2;
    
    -- Metrics
    m_sales INT;
    m_response FLOAT;
    m_rating FLOAT;
    
    -- Calculated components
    score_speed DECIMAL;
    
    -- Logging
    log_metrics JSONB;
BEGIN
    -- Iterate through candidate advisors
    -- Candidates: Role 'asesor', Verified, Available
    FOR advisor_record IN 
        SELECT p.id, m.sales_count, m.avg_response_time, m.rating_avg, m.current_tier
        FROM public.profiles p
        LEFT JOIN public.advisor_metrics m ON p.id = m.advisor_id
        WHERE p.role = 'asesor' 
          AND p.verification_status = 'verified'
          AND p.is_available = true
    LOOP
        -- 1. Check Load (Optional: Limit to 20 active properties)
        -- performed via subquery count if strict limit needed. 
        -- For now we assume all available advisors are eligible.

        -- 2. Get Metrics (Handle NULLs)
        m_sales := COALESCE(advisor_record.sales_count, 0);
        m_response := COALESCE(advisor_record.avg_response_time, 60); -- Default slow if no data
        m_rating := COALESCE(advisor_record.rating_avg, 3.0); -- Default average
        
        -- 3. Calculate Score
        -- Sales: Raw count
        -- Speed: Invert. Example: 5 min avg -> 60-5 = 55 points. 120 min avg -> 0 points.
        score_speed := GREATEST(0, 60 - m_response); 
        
        current_score := (m_sales * w_sales) + (score_speed * w_speed) + (m_rating * 20 * w_rating); 
        -- Rating * 20 makes 5 stars = 100 points scale to match speed roughly

        -- Boost for Tiers
        IF advisor_record.current_tier = 'DIAMOND' THEN
            current_score := current_score * 1.2;
        ELSIF advisor_record.current_tier = 'GOLD' THEN
             current_score := current_score * 1.1;
        END IF;

        -- 4. Pick Winner
        IF current_score > max_score THEN
            max_score := current_score;
            best_advisor_id := advisor_record.id;
            
            log_metrics := jsonb_build_object(
                'sales', m_sales,
                'response', m_response,
                'rating', m_rating,
                'tier', advisor_record.current_tier,
                'final_score', current_score
            );
        END IF;
    END LOOP;

    -- Log the assignment if found
    IF best_advisor_id IS NOT NULL THEN
        INSERT INTO public.assignment_logs (property_id, advisor_id, score, metrics_snapshot, reason)
        VALUES (prop_id, best_advisor_id, max_score, log_metrics, 'Auto-Assignment Smart Logic');
    END IF;

    RETURN best_advisor_id;
END;
$$ LANGUAGE plpgsql;


-- 3. Update Trigger
CREATE OR REPLACE FUNCTION auto_assign_advisor()
RETURNS TRIGGER AS $$
DECLARE
    found_advisor_id UUID;
BEGIN
    -- Only run if property is being listed for the first time
    -- AND currently has no advisor
    IF NEW.is_listed = true AND (OLD.is_listed = false OR OLD.is_listed IS NULL) AND NEW.assigned_advisor_id IS NULL THEN
        
        -- Call scoring function
        found_advisor_id := get_best_advisor_for_property(NEW.id);
        
        IF found_advisor_id IS NOT NULL THEN
            NEW.assigned_advisor_id := found_advisor_id;
        END IF;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger to be sure
DROP TRIGGER IF EXISTS trigger_auto_assign_advisor ON public.properties;
CREATE TRIGGER trigger_auto_assign_advisor
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_advisor();
