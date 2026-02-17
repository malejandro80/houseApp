-- ==========================================
-- Mock Payment Logic (Smoke Testing)
-- ==========================================

-- 1. Update Properties Status Check
-- We need to allow 'reserved' status.
-- Postgres doesn't easily allow altering a CHECK constraint, so we drop and re-add.
DO $$
BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS listing_status_check;
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS check_listing_status; -- Try both common names
    
    ALTER TABLE public.properties
    ADD CONSTRAINT listing_status_check 
    CHECK (listing_status IN ('active', 'sold', 'rented', 'inactive', 'reserved'));
END $$;


-- 2. Mock Payment Functions

-- A. Initiate Payment (User clicks "Pay / Separate")
-- Creates a transaction in 'pending' state.
CREATE OR REPLACE FUNCTION mock_payment_initiate(
    p_property_id UUID, 
    p_buyer_id UUID, 
    p_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
    new_tx_id UUID;
BEGIN
    INSERT INTO public.transactions (property_id, buyer_id, amount, status, provider, provider_ref)
    VALUES (p_property_id, p_buyer_id, p_amount, 'pending', 'wompi', 'MOCK-' || gen_random_uuid())
    RETURNING id INTO new_tx_id;
    
    RETURN new_tx_id;
END;
$$ LANGUAGE plpgsql;


-- B. Authorize Payment (Webhook Success Simulation)
-- Updates transaction to 'completed' AND reserves property.
CREATE OR REPLACE FUNCTION mock_payment_authorize(p_tx_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_prop_id UUID;
BEGIN
    -- Get property ID
    SELECT property_id INTO v_prop_id FROM public.transactions WHERE id = p_tx_id;
    
    IF v_prop_id IS NULL THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    -- Update Transaction
    UPDATE public.transactions 
    SET status = 'completed', updated_at = now()
    WHERE id = p_tx_id;
    
    -- Reserve Property
    UPDATE public.properties
    SET listing_status = 'reserved', updated_at = now()
    WHERE id = v_prop_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;


-- C. Release Payment (Deal Signed)
-- Updates transaction (conceptually released) AND marks property SOLD.
CREATE OR REPLACE FUNCTION mock_payment_release(p_tx_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_prop_id UUID;
BEGIN
    SELECT property_id INTO v_prop_id FROM public.transactions WHERE id = p_tx_id;
    
    -- Update Property to SOLD
    UPDATE public.properties
    SET listing_status = 'sold', updated_at = now()
    WHERE id = v_prop_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;


-- D. Refund Payment (Deal Cancelled)
-- Updates transaction to 'refunded' AND releases property back to ACTIVE.
CREATE OR REPLACE FUNCTION mock_payment_refund(p_tx_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_prop_id UUID;
BEGIN
    SELECT property_id INTO v_prop_id FROM public.transactions WHERE id = p_tx_id;
    
    -- Update Transaction
    UPDATE public.transactions 
    SET status = 'refunded', updated_at = now()
    WHERE id = p_tx_id;
    
    -- Release Property
    UPDATE public.properties
    SET listing_status = 'active', updated_at = now()
    WHERE id = v_prop_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;
