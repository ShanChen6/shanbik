-- ShanBik Task 23.2: per-user sync tables with row level security.
-- Requires Supabase (auth.users, auth.uid(), roles anon/authenticated).
-- Deletions are tombstones (deleted = true) so other devices learn them.

create table public.solves (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (id ~ '^[a-zA-Z0-9-]{1,100}$'),
  puzzle text not null check (puzzle = '3x3'),
  duration_ms integer not null check (duration_ms >= 0),
  scramble text not null check (char_length(scramble) between 1 and 2048),
  solved_at timestamptz not null,
  penalty text not null default 'none' check (penalty in ('none', '+2', 'DNF')),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.algorithm_favorites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  formula_id text not null check (formula_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(formula_id) <= 80),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, formula_id)
);

create table public.competition_bookmarks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  competition_id text not null check (competition_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(competition_id) <= 80),
  remind text not null default '1d' check (remind in ('none', '1h', '1d', '7d')),
  saved_at timestamptz not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, competition_id)
);

-- The server owns updated_at; clients cannot backdate or future-date edits.
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Per-user row caps, matching the client limits (10000 / 500 / 200).
-- Upserts fire BEFORE INSERT even when they end up updating, so an existing
-- key (tg_argv[1]) never counts as a new row.
create function public.enforce_row_cap() returns trigger
language plpgsql set search_path = '' as $$
declare
  cap integer := tg_argv[0]::integer;
  key_column text := tg_argv[1];
  existing boolean;
  n integer;
begin
  execute format('select exists (select 1 from %I.%I where user_id = $1 and %I = $2)',
    tg_table_schema, tg_table_name, key_column)
    into existing using new.user_id, to_jsonb(new) ->> key_column;
  if existing then
    return new;
  end if;
  execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
    into n using new.user_id;
  if n >= cap then
    raise exception 'row limit % reached for %', cap, tg_table_name using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger solves_touch before insert or update on public.solves
  for each row execute function public.touch_updated_at();
create trigger favorites_touch before insert or update on public.algorithm_favorites
  for each row execute function public.touch_updated_at();
create trigger bookmarks_touch before insert or update on public.competition_bookmarks
  for each row execute function public.touch_updated_at();
create trigger solves_cap before insert on public.solves
  for each row execute function public.enforce_row_cap(10000, 'id');
create trigger favorites_cap before insert on public.algorithm_favorites
  for each row execute function public.enforce_row_cap(500, 'formula_id');
create trigger bookmarks_cap before insert on public.competition_bookmarks
  for each row execute function public.enforce_row_cap(200, 'competition_id');

-- Row level security: a user sees and changes only their own rows.
alter table public.solves enable row level security;
alter table public.algorithm_favorites enable row level security;
alter table public.competition_bookmarks enable row level security;

revoke all on public.solves, public.algorithm_favorites, public.competition_bookmarks from anon, authenticated;
grant select, insert, update, delete on public.solves, public.algorithm_favorites, public.competition_bookmarks to authenticated;

create policy "solves: own rows" on public.solves for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "favorites: own rows" on public.algorithm_favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "bookmarks: own rows" on public.competition_bookmarks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
