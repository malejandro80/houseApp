-- Script para migrar/mergear datos de 'datahouse' a 'properties'
-- Este query mapea las columnas y transforma los tipos de datos necesarios.

INSERT INTO public.properties (
    user_id,
    title,
    sale_price,
    rent_price,
    area_total,
    area_built,
    address,
    lat,
    lon,
    type,
    metadata,
    images,
    cover_image,
    created_at,
    updated_at
)
SELECT
    COALESCE(d.user_id, (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)),
    d.title,
    d.sale_price::numeric,
    d.rent_price::numeric,
    d.m2::numeric,           -- Mapeamos m2 a area_total
    d.m2::numeric,           -- Asumimos area_built igual a m2 por defecto
    d.address,
    d.lat,
    d.lon,
    -- Transformación de tipos de texto a Enum property_type
    CASE d.type
        WHEN 'casa' THEN 'house'::property_type
        WHEN 'departamento' THEN 'apartment'::property_type
        WHEN 'office' THEN 'commercial'::property_type
        ELSE 'house'::property_type -- Valor por defecto si no coincide
    END,
    -- Guardamos campos que no tienen columna directa en properties dentro de metadata
    jsonb_strip_nulls(jsonb_build_object(
        'rooms', d.rooms,
        'bathrooms', d.bathrooms,
        'has_garage', d.has_garage,
        'contact_phone', d.contact_phone,
        'legacy_source', 'datahouse',
        'legacy_id', d.id
    )),
    d.images,
    d.cover_image,
    COALESCE(d.created_at, now()),
    COALESCE(d.created_at, now())
FROM
    public.datahouse d
-- Evitamos duplicados verificando si ya existe el legacy_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.metadata->>'legacy_id' = d.id::text
)
AND (d.user_id IS NOT NULL OR EXISTS (SELECT 1 FROM auth.users));;
