
-- BOLÃO DA COPA CREDIT - SUPABASE SCHEMA
-- Execute este arquivo no Supabase > SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  cpf text unique not null,
  full_name text not null,
  team_name text not null,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  cpf text unique not null references public.participants(cpf) on delete cascade,
  result_pick text not null,
  brazil_score int not null default 0,
  japan_score int not null default 0,
  first_goal_player text not null,
  result_points numeric not null default 0,
  score_points numeric not null default 0,
  player_points numeric not null default 0,
  total_allocated numeric not null default 0,
  max_possible numeric not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.game_result (
  id int primary key default 1,
  result text not null default 'Empate',
  brazil_score int not null default 0,
  japan_score int not null default 0,
  first_goal_player text not null default 'Nenhum',
  updated_at timestamptz default now(),
  constraint single_game_result check (id = 1)
);

insert into public.game_result (id, result, brazil_score, japan_score, first_goal_player)
values (1, 'Empate', 0, 0, 'Nenhum')
on conflict (id) do nothing;

alter table public.participants enable row level security;
alter table public.bets enable row level security;
alter table public.game_result enable row level security;

drop policy if exists "participants_select_public" on public.participants;
create policy "participants_select_public"
on public.participants for select
using (true);

drop policy if exists "participants_insert_public" on public.participants;
create policy "participants_insert_public"
on public.participants for insert
with check (true);

drop policy if exists "participants_update_public" on public.participants;
create policy "participants_update_public"
on public.participants for update
using (true);

drop policy if exists "participants_delete_public" on public.participants;
create policy "participants_delete_public"
on public.participants for delete
using (true);

drop policy if exists "bets_select_public" on public.bets;
create policy "bets_select_public"
on public.bets for select
using (true);

drop policy if exists "bets_insert_public" on public.bets;
create policy "bets_insert_public"
on public.bets for insert
with check (true);

drop policy if exists "bets_update_public" on public.bets;
create policy "bets_update_public"
on public.bets for update
using (true);

drop policy if exists "bets_delete_public" on public.bets;
create policy "bets_delete_public"
on public.bets for delete
using (true);

drop policy if exists "game_result_select_public" on public.game_result;
create policy "game_result_select_public"
on public.game_result for select
using (true);

drop policy if exists "game_result_update_public" on public.game_result;
create policy "game_result_update_public"
on public.game_result for update
using (true);

-- STORAGE
-- Depois de executar o SQL:
-- 1. Vá em Supabase > Storage.
-- 2. Crie um bucket chamado: avatars
-- 3. Marque como Public bucket.
