-- ==========================================
-- Payment System Migration
-- ==========================================

-- 1. Create Feature Flag
INSERT INTO public.feature_flags (key, description, is_enabled)
VALUES 
    ('payments_system', 'Enables payment processing, wallet visuals, and transaction history', true)
ON CONFLICT (key) DO UPDATE SET is_enabled = true;


-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('wompi', 'stripe', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status transaction_status DEFAULT 'pending',
    provider payment_provider DEFAULT 'wompi',
    provider_ref TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 6. Policies

-- Transactions:
-- Users see their own transactions (as buyer)
DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
CREATE POLICY "Users view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = buyer_id);

-- Admins see all
DROP POLICY IF EXISTS "Admins view all transactions" ON public.transactions;
CREATE POLICY "Admins view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Wallets:
-- Users see own wallet
DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Admins see all wallets
DROP POLICY IF EXISTS "Admins view all wallets" ON public.wallets;
CREATE POLICY "Admins view all wallets" ON public.wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- 7. Triggers for updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
