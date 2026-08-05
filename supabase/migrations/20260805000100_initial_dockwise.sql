-- Dockwise local/production-compatible initial schema.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null,
  attempts integer not null default 0 check (attempts >= 0),
  completed boolean not null default false,
  best_result jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null,
  client_attempt_id text not null,
  status text not null check (status in ('completed', 'failed', 'abandoned')),
  collision_count integer not null default 0 check (collision_count >= 0),
  peak_line_load numeric not null default 0 check (peak_line_load >= 0),
  distance numeric,
  heading_error numeric,
  elapsed numeric,
  created_at timestamptz not null default now(),
  unique (user_id, client_attempt_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists lesson_progress_set_updated_at on public.lesson_progress;
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_attempts enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists progress_select_own on public.lesson_progress;
create policy progress_select_own on public.lesson_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists progress_insert_own on public.lesson_progress;
create policy progress_insert_own on public.lesson_progress for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists progress_update_own on public.lesson_progress;
create policy progress_update_own on public.lesson_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists attempts_select_own on public.lesson_attempts;
create policy attempts_select_own on public.lesson_attempts for select to authenticated using (auth.uid() = user_id);
drop policy if exists attempts_insert_own on public.lesson_attempts;
create policy attempts_insert_own on public.lesson_attempts for insert to authenticated with check (auth.uid() = user_id);

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
grant select, insert on public.lesson_attempts to authenticated;
