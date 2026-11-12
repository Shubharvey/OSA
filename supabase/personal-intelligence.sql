-- OSA personal intelligence foundation
-- Apply after supabase/schema.sql. Safe to re-run.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en')),
  personalization_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  body text not null,
  entry_type text not null default 'reflection'
    check (entry_type in ('reflection', 'idea', 'plan', 'learning_goal', 'experience')),
  ai_analysis_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_entries_body_length check (char_length(body) between 1 and 20000)
);

create index if not exists personal_entries_user_created_idx
  on public.personal_entries (user_id, created_at desc);

create table if not exists public.personal_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  goal_type text not null default 'skill'
    check (goal_type in ('career', 'skill', 'project', 'personal', 'business')),
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_goals_user_status_idx
  on public.personal_goals (user_id, status);

create table if not exists public.personal_interest_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  source text not null default 'user_selected'
    check (source in ('user_selected', 'user_approved_entry', 'saved_content')),
  confidence numeric(4,3) not null default 1.000 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (user_id, topic, source)
);

create table if not exists public.osa_shorts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category text not null check (category in ('Markets', 'Startups', 'Technology', 'Career', 'Learning')),
  title text not null,
  description text not null,
  media_type text not null check (media_type in ('original', 'curated')),
  video_url text not null,
  thumbnail_url text,
  source_name text not null,
  source_url text not null,
  duration_seconds integer check (duration_seconds between 1 and 600),
  language text not null default 'en' check (language in ('en')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists osa_shorts_published_idx
  on public.osa_shorts (status, published_at desc);

alter table public.user_profiles enable row level security;
alter table public.personal_entries enable row level security;
alter table public.personal_goals enable row level security;
alter table public.personal_interest_signals enable row level security;
alter table public.osa_shorts enable row level security;

drop policy if exists "Users manage their own profile" on public.user_profiles;
create policy "Users manage their own profile"
  on public.user_profiles for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users manage their own personal entries" on public.personal_entries;
create policy "Users manage their own personal entries"
  on public.personal_entries for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own personal goals" on public.personal_goals;
create policy "Users manage their own personal goals"
  on public.personal_goals for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own interest signals" on public.personal_interest_signals;
create policy "Users manage their own interest signals"
  on public.personal_interest_signals for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public can read published OSA Shorts" on public.osa_shorts;
create policy "Public can read published OSA Shorts"
  on public.osa_shorts for select
  using (status = 'published');

-- No public insert/update/delete policy exists for OSA Shorts.
-- Diary analysis is opt-in per entry. No AI analysis is performed by this schema.
