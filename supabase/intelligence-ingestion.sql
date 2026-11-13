-- OSA Intelligence Engine: source registry and raw collection inbox
-- Apply after the existing OSA schema in the Supabase SQL Editor.
-- Safe to re-run. Raw items are never exposed through public policies.

create table if not exists public.intelligence_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  homepage_url text not null,
  source_type text not null default 'rss' check (source_type in ('rss', 'atom')),
  categories text[] not null default '{}',
  regions text[] not null default '{Global}',
  trust_tier smallint not null default 2 check (trust_tier between 1 and 3),
  is_active boolean not null default true,
  fetch_interval_minutes integer not null default 360 check (fetch_interval_minutes between 15 and 10080),
  last_fetched_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_sources_categories_check check (
    categories <@ array['Markets','Startups','Technology','Career','Learning']::text[]
  )
);

create table if not exists public.raw_intelligence_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.intelligence_sources(id) on delete cascade,
  external_id text,
  canonical_url text not null unique,
  title text not null,
  description text not null default '',
  author text,
  category_candidates text[] not null default '{}',
  region_candidates text[] not null default '{Global}',
  source_published_at timestamptz,
  discovered_at timestamptz not null default now(),
  content_hash text not null,
  review_status text not null default 'new'
    check (review_status in ('new','reviewing','approved','rejected','published')),
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raw_intelligence_title_length check (char_length(title) between 1 and 500),
  constraint raw_intelligence_description_length check (char_length(description) <= 5000)
);

create index if not exists intelligence_sources_active_idx
  on public.intelligence_sources (is_active, last_fetched_at);
create index if not exists raw_intelligence_review_idx
  on public.raw_intelligence_items (review_status, discovered_at desc);
create index if not exists raw_intelligence_source_idx
  on public.raw_intelligence_items (source_id, source_published_at desc);
create index if not exists raw_intelligence_categories_idx
  on public.raw_intelligence_items using gin (category_candidates);

alter table public.intelligence_sources enable row level security;
alter table public.raw_intelligence_items enable row level security;

-- No anon/authenticated policies: these tables are accessed only by trusted server-side code.
revoke all on public.intelligence_sources from anon, authenticated;
revoke all on public.raw_intelligence_items from anon, authenticated;
grant all on public.intelligence_sources to service_role;
grant all on public.raw_intelligence_items to service_role;

insert into public.intelligence_sources
  (name, feed_url, homepage_url, source_type, categories, regions, trust_tier, fetch_interval_minutes)
values
  ('Federal Reserve - Press Releases',
   'https://www.federalreserve.gov/feeds/press_all.xml',
   'https://www.federalreserve.gov/feeds/feeds.htm',
   'rss', array['Markets'], array['Global','United States'], 1, 180),
  ('European Central Bank - Press Releases',
   'https://www.ecb.europa.eu/rss/press.html',
   'https://www.ecb.europa.eu/home/html/rss.en.html',
   'rss', array['Markets'], array['Global','Europe'], 1, 180),
  ('SEBI - Updates',
   'https://www.sebi.gov.in/sebirss.xml',
   'https://www.sebi.gov.in/',
   'rss', array['Markets'], array['India'], 1, 360),
  ('TechCrunch',
   'https://techcrunch.com/feed/',
   'https://techcrunch.com/',
   'rss', array['Startups','Technology'], array['Global'], 2, 180),
  ('arXiv - Artificial Intelligence',
   'https://export.arxiv.org/rss/cs.AI',
   'https://arxiv.org/list/cs.AI/recent',
   'rss', array['Technology','Learning'], array['Global'], 1, 360),
  ('BBC News - World',
   'https://feeds.bbci.co.uk/news/world/rss.xml',
   'https://www.bbc.com/news/world',
   'rss', array['Markets','Technology','Career'], array['Global'], 2, 180)
on conflict (feed_url) do update set
  name = excluded.name,
  homepage_url = excluded.homepage_url,
  categories = excluded.categories,
  regions = excluded.regions,
  trust_tier = excluded.trust_tier,
  fetch_interval_minutes = excluded.fetch_interval_minutes,
  updated_at = now();
