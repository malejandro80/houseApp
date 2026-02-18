create table if not exists public.error_logs (
  id uuid default gen_random_uuid() primary key,
  occurred_at timestamptz default now(),
  user_id uuid references auth.users(id),
  context text,
  message text,
  stack_trace text,
  metadata jsonb,
  environment text
);

alter table public.error_logs enable row level security;

create policy "Enable insert for authenticated users only"
on public.error_logs for insert
to authenticated
with check (true);

create policy "Enable read for admins"
on public.error_logs for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'superadmin'
  )
);
