-- Seeder: Add Land And Commercial Properties
-- This script adds various properties of type 'land' and 'commercial' to the database.

DO $$
DECLARE
    seller_id UUID;
    advisor_id UUID;
BEGIN
    -- 1. Identify a Seller (First user in the system)
    SELECT id INTO seller_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    -- 2. Identify an Advisor (First advisor in profiles)
    SELECT id INTO advisor_id FROM public.profiles WHERE role = 'asesor' LIMIT 1;

    -- Only proceed if we have a seller
    IF seller_id IS NOT NULL THEN
        -- Add properties
        INSERT INTO public.properties (
            user_id, title, sale_price, rent_price, area_total, area_built, address, 
            lat, lon, neighborhood, type, bedrooms, bathrooms, parking, 
            description, listing_status, purpose, is_listed, accepted_listing_terms, assigned_advisor_id, 
            cover_image, images
        ) VALUES
        -- LAND PROPERTIES (Lotes)
        
        -- 1. Lote en Llanogrande - Exclusivo
        (seller_id, 'Lote Exclusivo Parcelación Llanogrande', 1200000000, 0, 3500, 0, 'Vía Llanogrande - Rionegro', 
         6.1345, -75.4231, 'Llanogrande', 'land', 0, 0, 0, 
         'Lote plano en parcelación de lujo. Todos los servicios públicos, vigilancia 24h.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef']),

        -- 2. Lote en Santa Elena - Vista
        (seller_id, 'Terreno con Vista Panorámica Santa Elena', 450000000, 0, 6400, 0, 'Vereda El Placer', 
         6.2056, -75.5012, 'Santa Elena', 'land', 0, 0, 0, 
         'Terreno con topografía mixta y bosque nativo. Vista espectacular a la ciudad.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1516156008625-3a9d60da4804?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1516156008625-3a9d60da4804']),

        -- 3. Lote Industrial Guarne
        (seller_id, 'Lote Industrial Autopista Medellín-Bogotá', 2800000000, 0, 5000, 0, 'Autopista km 20', 
         6.2890, -75.4567, 'Guarne', 'land', 0, 0, 0, 
         'Uso de suelo industrial. Sobre la autopista, ideal para bodega o centro logístico.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf']),

        -- 4. Lote Parcelación La Fe
        (seller_id, 'Lote en La Fe - El Retiro', 850000000, 0, 2200, 0, 'Vía La Fe - El Retiro', 
         6.0987, -75.4890, 'El Retiro', 'land', 0, 0, 0, 
         'Atmósfera tranquila rodeada de naturaleza. Cerca a Mall Macedonia.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1448630360428-65456885c650']),


        -- COMMERCIAL PROPERTIES (Locales)

        -- 5. Local en Laureles
        (seller_id, 'Local Comercial Av. Nutibara', 1500000000, 15000000, 180, 180, 'Avenida Nutibara', 
         6.2423, -75.5945, 'Laureles', 'commercial', 0, 2, 2, 
         'Local esquinero de alta visibilidad. Apto para restaurante o banco.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1556740738-b6a63e27c4df']),

        -- 6. Oficina/Local Milla de Oro
        (seller_id, 'Oficina/Consultorio Milla de Oro', 650000000, 4500000, 65, 65, 'Carrera 43A', 
         6.2045, -75.5723, 'El Poblado', 'commercial', 0, 1, 1, 
         'Consultorio en edificio empresarial. Recepción común y parqueadero de visitantes.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c']),
        
        -- 7. Bodega Itagüí
        (seller_id, 'Bodega Parque Industrial Itagüí', 3200000000, 25000000, 800, 800, 'Zona Industrial', 
         6.1756, -75.6123, 'Itagüí', 'commercial', 0, 3, 5, 
         'Bodega triple altura con mezanine de oficinas. Muelle de carga.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d']),

        -- 8. Local Centro
        (seller_id, 'Local Pasaje Comercial Centro', 280000000, 3500000, 35, 35, 'Junín con La Playa', 
         6.2512, -75.5678, 'La Candelaria', 'commercial', 0, 0, 0, 
         'Pequeño local en el pasaje más tradicional. Tráfico peatonal inmenso.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1560179707-f14e90ef3623']);

    END IF;
END $$;
