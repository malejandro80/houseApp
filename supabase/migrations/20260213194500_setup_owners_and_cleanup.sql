-- 1. Eliminar la tabla antigua 'datahouse'
DROP TABLE IF EXISTS public.datahouse;

-- 2. Crear la tabla 'property_owners'
-- Esta tabla almacena la información de los dueños de las propiedades.
-- Un "owner" es una entidad distinta al usuario del sistema (agente), aunque podrían coincidir en datos.
CREATE TABLE public.property_owners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referencia al usuario (agente) que creó este registro de dueño
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    -- Datos del dueño
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    tax_id TEXT, -- Cédula, NIT, RUT, etc.
    address TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS en 'property_owners'
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver y gestionar los dueños que ellos mismos crearon
CREATE POLICY "Users can manage property owners they created" ON public.property_owners
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- 4. Actualizar tabla 'properties' para relacionarla con 'property_owners'
ALTER TABLE public.properties 
ADD COLUMN owner_id UUID REFERENCES public.property_owners(id);

-- Crear índice para mejorar rendimiento en búsquedas por dueño
CREATE INDEX idx_properties_owner_id ON public.properties(owner_id);

-- Comentario sobre la migración
COMMENT ON TABLE public.property_owners IS 'Información de dueños de propiedades gestionados por agentes (users)';
COMMENT ON COLUMN public.properties.owner_id IS 'Referencia al dueño de la propiedad (Property Owner)';
