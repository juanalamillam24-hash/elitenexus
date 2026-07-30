create table if not exists public.kv (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.kv enable row level security;

drop policy if exists "acceso equipo nexus" on public.kv;
create policy "acceso equipo nexus"
  on public.kv
  for all
  to anon
  using (true)
  with check (true);

-- Registros de eventos (formulario público "NOCHE DE EXPERIENCIAS").
create table if not exists public.registros (
  id         uuid primary key default gen_random_uuid(),
  evento     text not null default 'noche-experiencias',
  nombre     text not null,
  celular    text not null,
  correo     text not null,
  agente     text not null,
  created_at timestamptz not null default now()
);

alter table public.registros enable row level security;

-- Cualquiera puede registrarse (insert público desde el formulario).
drop policy if exists "registro publico insert" on public.registros;
create policy "registro publico insert"
  on public.registros
  for insert
  to anon
  with check (true);

-- Lectura para el panel del equipo.
drop policy if exists "registro lectura equipo" on public.registros;
create policy "registro lectura equipo"
  on public.registros
  for select
  to anon
  using (true);

create index if not exists registros_evento_created_idx
  on public.registros (evento, created_at desc);
