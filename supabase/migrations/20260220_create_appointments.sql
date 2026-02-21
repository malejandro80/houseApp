-- Migration: Create Appointments Table
-- To be executed in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  type VARCHAR NOT NULL DEFAULT 'visit',
  status VARCHAR NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for Calendar read-speed
CREATE INDEX IF NOT EXISTS idx_appointments_advisor ON appointments(advisor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_date);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 1. Advisors can view all appointments belonging to them
CREATE POLICY "Advisors can view own appointments" 
ON appointments FOR SELECT 
USING (auth.uid() = advisor_id);

-- 2. Users can view appointments tied to their leads
CREATE POLICY "Users can view appointments via leads" 
ON appointments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM leads 
    WHERE leads.id = appointments.lead_id 
    AND leads.created_by = auth.uid()
  )
);

-- 3. Advisors can insert and manage their own blocks/appointments
CREATE POLICY "Advisors can insert appointments" 
ON appointments FOR INSERT 
WITH CHECK (auth.uid() = advisor_id);

CREATE POLICY "Advisors can update own appointments" 
ON appointments FOR UPDATE 
USING (auth.uid() = advisor_id);

-- 4. Users can insert appointments via the Schedule Visit modal (tie to their lead)
CREATE POLICY "Users can schedule appointments via leads" 
ON appointments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leads 
    WHERE leads.id = appointments.lead_id 
    AND leads.created_by = auth.uid()
  )
);
