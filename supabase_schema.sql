
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
  constraint one_row_only check (id = 1)
);

insert into public.game_result (id, result, brazil_score, japan_score, first_goal_player)
values (1, 'Empate', 0, 0, 'Nenhum')
on conflict (id) do nothing;

alter table public.participants enable row level security;
alter table public.bets enable row level security;
alter table public.game_result enable row level security;

drop policy if exists "participants_select" on public.participants;
create policy "participants_select" on public.participants for select using (true);

drop policy if exists "participants_insert" on public.participants;
create policy "participants_insert" on public.participants for insert with check (true);

drop policy if exists "participants_update" on public.participants;
create policy "participants_update" on public.participants for update using (true);

drop policy if exists "participants_delete" on public.participants;
create policy "participants_delete" on public.participants for delete using (true);

drop policy if exists "bets_select" on public.bets;
create policy "bets_select" on public.bets for select using (true);

drop policy if exists "bets_insert" on public.bets;
create policy "bets_insert" on public.bets for insert with check (true);

drop policy if exists "bets_update" on public.bets;
create policy "bets_update" on public.bets for update using (true);

drop policy if exists "bets_delete" on public.bets;
create policy "bets_delete" on public.bets for delete using (true);

drop policy if exists "result_select" on public.game_result;
create policy "result_select" on public.game_result for select using (true);

drop policy if exists "result_update" on public.game_result;
create policy "result_update" on public.game_result for update using (true);

-- IMPORTANTE:
-- No Supabase Storage, crie um bucket público chamado: avatars
