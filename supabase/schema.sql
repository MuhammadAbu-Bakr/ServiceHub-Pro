-- ============================================================
-- ServiceHub Pro — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- ── 1. Profiles table ──────────────────────────────────────
create table if not exists public.profiles (
  id          uuid        references auth.users on delete cascade not null primary key,
  email       text        not null,
  full_name   text,
  avatar_url  text,
  role        text        not null default 'client'
                check (role in ('client', 'freelancer')),
  bio         text,
  location    text,
  website     text,
  is_onboarded boolean    default false,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- ── 2. Row Level Security ──────────────────────────────────
alter table public.profiles enable row level security;

-- Anyone can read any profile (public marketplace)
create policy "Profiles are publicly viewable"
  on public.profiles for select
  using (true);

-- Users can only insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── 3. Auto-create profile on signup via trigger ───────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

-- Drop trigger if it already exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 4. Auto-update updated_at ─────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
