-- OSA initial feed schema
-- Apply this in the Supabase SQL Editor when the project is created.

create extension if not exists pgcrypto;

create table if not exists public.feed_entries (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  category text not null check (category in ('Markets', 'Startups', 'Technology', 'Career', 'Learning')),
  eyebrow text,
  title text not null,
  summary text not null,
  source_name text not null,
  source_url text not null,
  published_at timestamptz,
  reading_time_minutes integer check (reading_time_minutes is null or reading_time_minutes > 0),
  signal_level text not null default 'worth_watching'
    check (signal_level in ('high_signal', 'worth_watching', 'explainer')),
  is_featured boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_entries_status_published_idx
  on public.feed_entries (status, published_at desc);

create index if not exists feed_entries_category_idx
  on public.feed_entries (category);

alter table public.feed_entries enable row level security;

-- Public users can read published intelligence only.
drop policy if exists "Public can read published feed entries" on public.feed_entries;
create policy "Public can read published feed entries"
  on public.feed_entries
  for select
  using (status = 'published');

-- No public insert/update/delete policies are created.
-- Publishing and editorial writes must be performed by trusted server-side code.
