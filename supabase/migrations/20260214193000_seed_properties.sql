-- Seed: Add more properties for sale in Medellín
-- This script adds various properties to the database for testing the public map and listings.

DO $$
DECLARE
    seller_id UUID;
    advisor_id UUID;
BEGIN
    -- 1. Identify a Seller (First user in the system)
    SELECT id INTO seller_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    -- 2. Identify an Advisor (First advisor in profiles)
    SELECT id INTO advisor_id FROM public.profiles WHERE role = 'asesor' LIMIT 1;

    -- If no advisor found, these won't have an assigned advisor (which is fine)
    
    IF seller_id IS NOT NULL THEN
        -- Add properties
        INSERT INTO public.properties (
            user_id, title, sale_price, rent_price, area_total, area_built, address, 
            lat, lon, neighborhood, type, bedrooms, bathrooms, parking, 
            description, listing_status, purpose, is_listed, accepted_listing_terms, assigned_advisor_id, 
            cover_image, images
        ) VALUES
        -- 1. Apartamento en El Poblado - Milla de Oro
        (seller_id, 'Penthouse Milla de Oro', 1250000000, 8500000, 240, 240, 'Carrera 43A # 1-50', 
         6.2089, -75.5711, 'El Poblado', 'apartment', 3, 4, 3, 
         'Exclusivo penthouse con vista 360 sobre la ciudad. Acabados de lujo y domótica.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750', 'https://images.unsplash.com/photo-1600585154340-be6199f7d009']),

        -- 2. Apartamento en Laureles
        (seller_id, 'Apartamento Moderno Laureles', 580000000, 3200000, 110, 110, 'Circular 4 # 73-20', 
         6.2445, -75.5902, 'Laureles', 'apartment', 3, 2, 1, 
         'Cerca al primer parque de Laureles. Remodelado, cocina abierta y balcón amplio.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb']),

        -- 3. Casa en Envigado - Loma de las Brujas
        (seller_id, 'Casa Campestre Loma de las Brujas', 1850000000, 12000000, 350, 280, 'Calle 36 Sur # 25-10', 
         6.1652, -75.5789, 'Envigado', 'house', 4, 5, 4, 
         'Casa independiente en zona campestre. Jardín privado y terraza con chimenea.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9']),

        -- 4. Apartamento en Belén Rosales
        (seller_id, 'Dúplex Belén Rosales', 420000000, 2400000, 95, 95, 'Carrera 70 # 30-45', 
         6.2312, -75.5856, 'Belén', 'apartment', 2, 2, 1, 
         'Excelente iluminación natural, sector tranquilo y residencial. Cerca a la 70.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688']),

        -- 5. Apartamento Sensacional en Provenza
        (seller_id, 'Loft Provenza Estilo Industrial', 890000000, 6500000, 85, 85, 'Carrera 35 # 8-15', 
         6.2105, -75.5678, 'El Poblado', 'apartment', 1, 2, 1, 
         'Ideal para Airbnb o inversión. Ubicación premium en el corazón de Provenza.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1536376073347-da230ef5c474?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1536376073347-da230ef5c474']),

        -- 6. Casa en Sabaneta - La Doctora
        (seller_id, 'Casa de Campo Sabaneta', 2100000000, 0, 1200, 450, 'Vereda La Doctora', 
         6.1345, -75.6012, 'Sabaneta', 'house', 5, 6, 6, 
         'Lote de 1200m2. Casa con piscina privada, zona BBQ y cuarto de hobbies.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811']),

        -- 7. Apartamento en Conquistadores
        (seller_id, 'Apartamento Conquistadores Parques del Río', 520000000, 2800000, 105, 105, 'Carrera 64 # 33-12', 
         6.2412, -75.5789, 'Conquistadores', 'apartment', 3, 2, 1, 
         'Frente a Parques del Río. Excelente ubicación céntrica y conectividad.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267']),

        -- 8. Apartamento de Lujo en Castropol
        (seller_id, 'Castropol Luxury View', 1100000000, 7200000, 165, 165, 'Carrera 42 # 12-80', 
         6.2189, -75.5689, 'El Poblado', 'apartment', 3, 4, 2, 
         'Piso alto con vista al sur de la ciudad. Club house completo con piscina y gym.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858']),

        -- 9. Apartamento en Los Colores
        (seller_id, 'Apartamento Los Colores Familiar', 380000000, 2100000, 80, 80, 'Calle 55 # 78-40', 
         6.2612, -75.5945, 'Los Colores', 'apartment', 3, 2, 1, 
         'Urbanización cerrada con zonas verdes. Ideal para familias jóvenes.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1493238792000-8113da705763']),

        -- 10. Local Comercial en Manila
        (seller_id, 'Local Gastro-Bar Manila', 950000000, 8500000, 120, 180, 'Carrera 43E # 11-25', 
         6.2134, -75.5702, 'El Poblado', 'commercial', 0, 2, 0, 
         'Local de dos niveles en sector gastronómico de Manila. Terraza autorizada.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1554118811-1e0d58224f24']),

        -- 11. Casa en Robledo - Pilarica
        (seller_id, 'Casa Pilarica cerca a ITM', 320000000, 1800000, 110, 110, 'Carrera 75 # 76-15', 
         6.2756, -75.5867, 'Robledo', 'house', 4, 2, 1, 
         'Casa unifamiliar cerca a universidades. Excelente potencial de renta por habitaciones.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6']),

        -- 12. Apartamento en Altavista - Belén
        (seller_id, 'Belén Altavista Vista Campestre', 450000000, 2500000, 88, 88, 'Calle 10 Sur # 84-20', 
         6.2156, -75.5945, 'Belén', 'apartment', 3, 2, 1, 
         'Piso alto con vista a la montaña. Urbanización con piscina climatizada.', 'active', 'sale', true, true, advisor_id,
         'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000',
         ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00']);
    END IF;
END $$;
