-- Enum for Task Priority
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kanban_priority') THEN
        CREATE TYPE kanban_priority AS ENUM ('low', 'medium', 'high');
    END IF;
END $$;

-- Table for Kanban stages (Columns)
CREATE TABLE IF NOT EXISTS kanban_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Leads/Tasks
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_contact TEXT,
    address_reference TEXT,
    estimated_value NUMERIC,
    priority kanban_priority DEFAULT 'medium',
    
    stage_id UUID REFERENCES kanban_stages(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_leads_advisor ON leads(advisor_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage_id);

-- Enable RLS
ALTER TABLE kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies for kanban_stages (Read for all authenticated users)
CREATE POLICY "Everyone can view stages" ON kanban_stages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for leads (CRUD for the assigned advisor)
CREATE POLICY "Advisors can manage their own leads" ON leads
    FOR ALL USING (auth.uid() = advisor_id);

-- Insert default stages
INSERT INTO kanban_stages (name, slug, color, order_index)
VALUES 
    ('Prospectos', 'prospecto', 'bg-blue-500', 0),
    ('Visitas Programadas', 'visita', 'bg-amber-500', 1),
    ('Ofertas Recibidas', 'oferta', 'bg-indigo-500', 2),
    ('Cierre / Contrato', 'cierre', 'bg-emerald-500', 3)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index;
