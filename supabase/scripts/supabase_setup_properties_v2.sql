-- 1. Create Enums if they don't exist
do $$ begin
    create type property_type as enum ('house', 'apartment', 'land', 'commercial', 'warehouse');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type legal_status_type as enum ('deed_ready', 'possession', 'legal_issue');
exception
    when duplicate_object then null;
end $$;

-- 2. Create Properties Table
create table if not exists public.properties (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  -- Generales
  title text,
  sale_price numeric not null,
  rent_price numeric default 0,
  area_total numeric not null, -- m2
  area_built numeric default 0, -- m2
  address text,
  lat double precision,
  lon double precision,
  neighborhood text,
  age integer default 0,
  stratum integer default 0,
  
  -- Tipo y Detalles (JSONB)
  type property_type not null,
  -- Contains: bedrooms, bathrooms, parking, amenities, land_use, etc.
  metadata jsonb default '{}'::jsonb, 
  
  -- Análisis y Riesgo
  legal_status legal_status_type default 'deed_ready',
  risk_score numeric default 0,
  profitability_score numeric default 0,
  
  -- Factores de Riesgo (JSONB)
  -- Contains: risk_zone (bool), road_affectation (bool), tax_debt (numeric), heritage (bool)
  risk_factors jsonb default '{}'::jsonb,
  
  -- Media
  images text[],
  cover_image text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.properties enable row level security;

-- 4. Policies
create policy "Users can view their own properties" on public.properties
  for select using (auth.uid() = user_id);

create policy "Users can insert their own properties" on public.properties
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own properties" on public.properties
  for update using (auth.uid() = user_id);

create policy "Users can delete their own properties" on public.properties
  for delete using (auth.uid() = user_id);

-- 5. Indexes for performance
create index if not exists properties_user_id_idx on public.properties(user_id);
create index if not exists properties_type_idx on public.properties(type);
create index if not exists properties_lat_lon_idx on public.properties(lat, lon);
