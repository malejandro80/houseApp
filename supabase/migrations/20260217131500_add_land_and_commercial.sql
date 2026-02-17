-- Migration to add 'land' property type and seed data

-- 1. Ensure 'land' and 'commercial' exist in the enum
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'land';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'commercial';
