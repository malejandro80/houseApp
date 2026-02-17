-- Migration: Add Contact Information columns to Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;
