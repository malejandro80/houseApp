-- ==========================================
-- Legal Documents System Migration
-- ==========================================

-- 1. Create Feature Flag
INSERT INTO public.feature_flags (key, description, is_enabled)
VALUES 
    ('legal_documents_system', 'Enables document generation, template management, and digital signature status tracking', true)
ON CONFLICT (key) DO UPDATE SET is_enabled = true;


-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE doc_status AS ENUM ('draft', 'generated', 'sent_to_sign', 'signed', 'voided');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE template_type AS ENUM ('promise_sale', 'mandate', 'rent_contract', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 3. Create Contract Templates Table
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type template_type NOT NULL,
    content_html TEXT NOT NULL, -- Handlebars/Mustache syntax
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Legal Documents Table
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.contract_templates(id),
    status doc_status DEFAULT 'draft',
    
    -- Metadata for external providers (DocuSign)
    docusign_envelope_id TEXT,
    pdf_url TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- 6. Policies

-- Templates: 
-- Admins can manage
CREATE POLICY "Admins manage templates" ON public.contract_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Advisors can view active templates
CREATE POLICY "Advisors view active templates" ON public.contract_templates
    FOR SELECT USING (is_active = true);


-- Documents:
-- Advisors can view/create documents for properties they are assigned to
CREATE POLICY "Advisors manage docs for assigned properties" ON public.legal_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_id AND assigned_advisor_id = auth.uid()
        )
    );

-- Admins view all
CREATE POLICY "Admins view all documents" ON public.legal_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- 7. Triggers for updated_at
CREATE TRIGGER update_contract_templates_updated_at
    BEFORE UPDATE ON public.contract_templates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
    BEFORE UPDATE ON public.legal_documents
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
