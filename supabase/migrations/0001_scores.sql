-- Bombazo · P3 ranking global (Supabase)
-- Aplicar en el proyecto Supabase (via MCP apply_migration o el editor SQL).

-- Puntaje por usuario (una fila por cuenta; se hace upsert con el mejor XP).
create table if not exists public.scores (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text not null default 'Jugador',
  xp         integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Mantener updated_at fresco en cada upsert.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists scores_touch on public.scores;
create trigger scores_touch before update on public.scores
  for each row execute function public.touch_updated_at();

-- RLS: cualquiera lee el ranking; cada quien escribe solo su fila.
alter table public.scores enable row level security;

drop policy if exists "scores read all" on public.scores;
create policy "scores read all" on public.scores for select using (true);

drop policy if exists "scores insert own" on public.scores;
create policy "scores insert own" on public.scores for insert with check (auth.uid() = user_id);

drop policy if exists "scores update own" on public.scores;
create policy "scores update own" on public.scores for update using (auth.uid() = user_id);

-- Vista pública del ranking, ya ordenada y con posición.
create or replace view public.leaderboard as
  select
    name,
    xp,
    updated_at,
    rank() over (order by xp desc) as position
  from public.scores
  order by xp desc;

grant select on public.leaderboard to anon, authenticated;
