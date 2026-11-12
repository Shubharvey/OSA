-- OSA Personal Intelligence — Phase 1 review workflow
-- Apply after supabase/personal-intelligence.sql.
-- Safe to re-run.

alter table public.personal_interest_signals
  add column if not exists status text not null default 'approved',
  add column if not exists source_entry_id uuid references public.personal_entries(id) on delete cascade,
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.personal_interest_signals
  drop constraint if exists personal_interest_signals_status_check;

alter table public.personal_interest_signals
  add constraint personal_interest_signals_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists personal_interest_signals_user_status_idx
  on public.personal_interest_signals (user_id, status, created_at desc);

create index if not exists personal_interest_signals_source_entry_idx
  on public.personal_interest_signals (source_entry_id);

-- Existing user-selected interests remain approved by default.
-- Future entry-derived suggestions must be inserted as 'pending'.
-- Only approved signals should be used by recommendation queries.
