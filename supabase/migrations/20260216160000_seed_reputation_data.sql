-- 1. Enable Feature Flag
INSERT INTO public.feature_flags (key, description, is_enabled)
VALUES 
    ('advisor_reputation_system', 'Enables reputation system, XP tracking and Gamification UI', true)
ON CONFLICT (key) DO UPDATE SET is_enabled = true;

-- 2. Seed Advisor Data (Idempotent)
DO $$
DECLARE
    target_advisor_id UUID;
BEGIN
    -- Try to find an existing advisor
    SELECT id INTO target_advisor_id FROM public.profiles WHERE role = 'asesor' LIMIT 1;

    -- If no advisor exists, we cannot seed metrics effectively without creating a user
    -- But we can try to update metrics if the ID was found.
    IF target_advisor_id IS NOT NULL THEN
        
        -- Insert/Update Metrics (Give them GOLD Tier to show off UI)
        INSERT INTO public.advisor_metrics (advisor_id, current_xp, current_tier, sales_count, avg_response_time, rating_avg)
        VALUES (target_advisor_id, 7500, 'GOLD', 12, 15.5, 4.8)
        ON CONFLICT (advisor_id) DO UPDATE SET
            current_xp = 7500,
            current_tier = 'GOLD',
            sales_count = 12,
            avg_response_time = 15.5,
            rating_avg = 4.8;
            
        -- Insert Logs (Sample History)
        -- Delete old logs for this seed to avoid duplicates if re-run
        DELETE FROM public.reputation_logs WHERE advisor_id = target_advisor_id;

        INSERT INTO public.reputation_logs (advisor_id, event_type, points_delta, reason, created_at)
        VALUES 
            (target_advisor_id, 'SALE_CLOSED', 1000, 'Closed deal #1023 in Santa Monica', now() - interval '2 days'),
            (target_advisor_id, 'REVIEW_5_STAR', 200, 'Excellent service review from Client X', now() - interval '5 days'),
            (target_advisor_id, 'FAST_RESPONSE', 10, 'Replied under 5 mins', now() - interval '6 days'),
            (target_advisor_id, 'SALE_CLOSED', 1000, 'Closed deal #998 Penthouse', now() - interval '10 days'),
            (target_advisor_id, 'NO_SHOW', -300, 'Missed appointment with lead Y', now() - interval '20 days');
            
    END IF;
END $$;
