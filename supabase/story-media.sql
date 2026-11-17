-- Add openly licensed editorial images and attribution to OSA stories.
alter table public.feed_entries
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists image_credit text,
  add column if not exists image_source_url text,
  add column if not exists image_license text,
  add column if not exists image_license_url text;
