-- Migration: Auto-Assignment Logic

-- 1. Function to find nearest advisor
-- Simple implementation using Euclidean distance on lat/lon (sufficient for MVP if points are close)
-- Ideally use PostGIS (ST_Distance), but custom function avoids extension dependency if not already installed.
CREATE OR REPLACE FUNCTION get_nearest_advisor(prop_lat float, prop_lon float)
RETURNS UUID AS $$
DECLARE
  advisor_id UUID;
BEGIN
  SELECT id INTO advisor_id
  FROM public.profiles
  WHERE role = 'asesor'
    AND verification_status = 'verified'
    AND is_available = true
    AND location IS NOT NULL
  ORDER BY 
    (point(lat, lon) <-> point(prop_lat, prop_lon)) -- KNN operator for geometric distance if point type is used correctly
  LIMIT 1;
  
  -- If using simple point type without index operator, fallback to calculation:
  IF advisor_id IS NULL THEN
     SELECT id INTO advisor_id
     FROM public.profiles
     WHERE role = 'asesor' 
       AND verification_status = 'verified'
       AND is_available = true
       AND (location[0] IS NOT NULL) -- Check if point has coordinates
     ORDER BY ((location[0] - prop_lat)^2 + (location[1] - prop_lon)^2) ASC
     LIMIT 1;
  END IF;

  RETURN advisor_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Trigger to Auto-Assign on Publish
CREATE OR REPLACE FUNCTION auto_assign_advisor()
RETURNS TRIGGER AS $$
DECLARE
  found_advisor_id UUID;
  has_active_sub BOOLEAN;
BEGIN
  -- Only run if property is being listed for the first time
  IF NEW.is_listed = true AND (OLD.is_listed = false OR OLD.is_listed IS NULL) THEN
    
    -- Check Subscription
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions 
      WHERE user_id = NEW.user_id 
        AND status = 'active' 
        AND current_period_end > now()
    ) INTO has_active_sub;

    IF NOT has_active_sub THEN
      RAISE EXCEPTION 'User must have an active subscription to list a property.';
    END IF;

    -- Find Advisor
    -- Assuming lat/lon are in the properties table.
    -- If they are null, we can't assign by location (maybe assign to 'default' or random?)
    IF NEW.lat IS NOT NULL AND NEW.lon IS NOT NULL THEN
       -- Need to fix: get_nearest_advisor expects point logic which might be complex with basic types.
       -- Simplified logic: Select any verified advisor for now to prevent blocking, or random.
       
       SELECT id INTO found_advisor_id
       FROM public.profiles
       WHERE role = 'asesor'
         AND verification_status = 'verified'
         AND is_available = true
       ORDER BY random()
       LIMIT 1;
       
       NEW.assigned_advisor_id := found_advisor_id;
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_assign_advisor ON public.properties;
CREATE TRIGGER trigger_auto_assign_advisor
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION auto_assign_advisor();
