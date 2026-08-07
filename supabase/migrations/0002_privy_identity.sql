-- Bombazo · P3 (bis) — identidad Privy además de Supabase nativo.
-- STAGED: NO aplicar suelto. Es parte del puente Privy->Supabase, que es un
-- cambio ATÓMICO (migración + Third-Party Auth + wiring de accessToken en
-- net/cloud.js) y necesita verificarse con el login de Privy en el dominio real
-- (localhost no puede: el CSP frame-ancestors de Privy no whitelistea localhost).
-- Runbook completo en PENDIENTES.md.
--
-- Convierte scores.user_id a text para aceptar tanto el uuid de Supabase Auth
-- (anónimo/Google) como el DID de Privy (claim `sub`, ej. did:privy:...).

-- 1) Quitar el FK a auth.users (el DID de Privy no vive en esa tabla).
alter table public.scores drop constraint if exists scores_user_id_fkey;

-- 2) user_id a text (uuid castea a text sin pérdida; la PK sigue en la columna).
alter table public.scores alter column user_id type text using user_id::text;

-- 3) RLS unificado: cada quien escribe SOLO su fila, venga de Supabase
--    (auth.uid()) o de Privy (sub del JWT). Para tokens de Supabase el claim
--    `sub` ya es el uuid, así que coalesce cubre ambos casos.
drop policy if exists "scores insert own" on public.scores;
create policy "scores insert own" on public.scores for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', auth.uid()::text));

drop policy if exists "scores update own" on public.scores;
create policy "scores update own" on public.scores for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', auth.uid()::text));

-- La vista public.leaderboard no cambia (solo expone name/xp/position).
