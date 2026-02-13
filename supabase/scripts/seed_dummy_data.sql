-- Helper function to seed dummy data safely
-- LOCATIONS: Carabobo (Venezuela) & Medellín (Colombia)
do $$
declare
  v_user_id uuid;
  v_zone_valencia_id bigint;
  v_zone_medellin_id bigint;
  i integer;
begin
  -- 1. Get a valid user ID (First available user)
  select id into v_user_id from auth.users limit 1;
  
  if v_user_id is null then
    raise notice 'No users found to assign data to. Skipping seed.';
    return;
  end if;

  -- 2. Seed Properties (datahouse)
  -- Prices assumed in USD for simplicity/standardization or local context logic
  insert into public.datahouse (title, address, type, sale_price, rent_price, m2, rooms, bathrooms, lat, lon, has_garage)
  values 
    -- CARABOBO, VENEZUELA
    ('Casa en Altos de Guataparo', 'Calle Los Campos, Valencia, Carabobo', 'casa', 250000, 1200, 350, 4, 4, 10.2150, -68.0350, true),
    ('Apartamento en La Trigaleña', 'Av. 102, Valencia, Carabobo', 'departamento', 65000, 450, 95, 3, 2, 10.2000, -68.0100, true),
    ('Townhouse en San Diego', 'Urb. El Remanso, San Diego', 'casa', 45000, 300, 110, 3, 2, 10.2500, -67.9500, true),
    ('Oficina en Torre Bod', 'Av. Bolivar, Valencia', 'office', 85000, 800, 70, 1, 1, 10.1850, -68.0050, true),
    
    -- MEDELLÍN, COLOMBIA
    ('Penthouse en El Poblado', 'Carrera 43A, Medellín', 'departamento', 450000, 2500, 220, 3, 4, 6.2050, -75.5650, true),
    ('Apartaestudio en Laureles', 'Circular 4, Medellín', 'departamento', 120000, 800, 60, 1, 1, 6.2450, -75.5900, false),
    ('Casa Campestre Envigado', 'Loma del Escobero, Envigado', 'casa', 680000, 3500, 400, 5, 5, 6.1600, -75.5800, true),
    ('Loft Industrial Manila', 'Calle 12, Poblado, Medellín', 'departamento', 180000, 1100, 85, 1, 2, 6.2100, -75.5700, true);

  -- 3. Seed Zones (Create or Get existing to avoid duplicates if re-run)
  
  -- Zone 1: Valencia Norte (Carabobo)
  insert into public.zones (user_id, name, lat, lon, radius)
  values (v_user_id, 'Inversión Valencia Norte', 10.2100, -68.0200, 3.0)
  returning id into v_zone_valencia_id;

  -- Zone 2: Medellín Poblado
  insert into public.zones (user_id, name, lat, lon, radius)
  values (v_user_id, 'Zona El Poblado', 6.2050, -75.5650, 2.0)
  returning id into v_zone_medellin_id;

  -- 4. Seed Zone History (Generate 30 days of data)
  
  -- Loop for Valencia (Zone 1)
  -- Simulating stable/slightly volatile market
  for i in 0..30 loop
    insert into public.zone_history (
      zone_id, recorded_at, avg_price, avg_m2_price, property_count, avg_roi, 
      avg_rooms, avg_bathrooms, min_price, max_price
    ) values (
      v_zone_valencia_id,
      now() - (i || ' days')::interval,
      120000 + (random() * 5000) - (i * 200), -- Slight downward trend
      850 + (random() * 50),
      12 + (random() * 3)::int,
      7.2 + (random() * 0.5), 
      3.1, 2.5, 40000, 350000
    );
  end loop;

  -- Loop for Medellín (Zone 2)
  -- Simulating strong growth
  for i in 0..30 loop
     insert into public.zone_history (
      zone_id, recorded_at, avg_price, avg_m2_price, property_count, avg_roi,
      avg_rooms, avg_bathrooms, min_price, max_price
    ) values (
      v_zone_medellin_id,
      now() - (i || ' days')::interval,
      320000 + (random() * 10000) + (i * 5000), -- Upward trend
      2100 + (random() * 100) + (i * 10),
      45 + (random() * 5)::int,
      5.5 + (random() * 0.3), 
      2.8, 2.2, 150000, 900000
    );
  end loop;

  raise notice 'Seed data inserted successfully for user % with Zone IDs % (Valencia) and % (Medellín)', v_user_id, v_zone_valencia_id, v_zone_medellin_id;

end $$;
