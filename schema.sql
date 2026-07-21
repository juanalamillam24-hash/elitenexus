-- ============================================================
-- NEXUS · ELITE — Esquema de base de datos (Supabase / Postgres)
-- Copia y pega TODO esto en Supabase: menú "SQL Editor" > "New query" > Run.
-- ============================================================

-- Tabla única llave-valor. Guarda tanto los pasos del checklist de cada
-- agente (steps:...) como su registro diario (chk:...:fecha).
create table if not exists public.kv (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Activar seguridad a nivel de fila.
alter table public.kv enable row level security;

-- ------------------------------------------------------------
-- Política de acceso.
-- Como el login es por nombre (sin usuario/contraseña de Supabase),
-- se permite lectura y escritura con la llave pública (anon).
-- Es una herramienta interna del equipo; cualquiera con el enlace
-- puede leer y escribir. Si más adelante quieres proteger por
-- contraseña, se cambia esta política.
-- ------------------------------------------------------------
drop policy if exists "acceso equipo nexus" on public.kv;
create policy "acceso equipo nexus"
  on public.kv
  for all
  to anon
  using (true)
  with check (true);
