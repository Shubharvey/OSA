# OSA — One Step Ahead

A personal intelligence companion that combines trustworthy global information with a user's own interests, goals and experiences.

## Product direction

OSA helps people understand what is happening in the world and connect it to what they are trying to learn, build and become. The product combines a source-attributed intelligence feed, a private personal space, user-approved personalisation and short-form explainers.

See [docs/product-architecture.md](docs/product-architecture.md) for the product principles, privacy boundaries and roadmap.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase Auth + Postgres + Row Level Security
- GitHub
- Vercel

## Current product

- Responsive intelligence dashboard across Markets, Startups, Technology, Career and Learning.
- Search and category filtering over published feed entries.
- Source-attributed intelligence stored in Supabase.
- My Space private diary with email magic-link sign-in.
- Per-entry, opt-in consent field for future AI analysis (analysis is not active yet).
- Private diary records protected by Supabase Row Level Security.
- Foundation schema for goals, user-approved interest signals and hybrid OSA Shorts.
- English-only launch; localisation is planned as a later milestone.

## Database setup

The original feed schema is in `supabase/schema.sql`. The first curated feed is in `supabase/seed-edition-001.sql`.

For the personal intelligence foundation, run `supabase/personal-intelligence.sql` in the Supabase SQL Editor after the original schema.

## Run locally

1. Install Node.js (LTS).
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the Supabase publishable key is accepted here)
4. Start the development server: `npm run dev`.
5. Open http://localhost:3000.

## Supabase Auth configuration

Enable Email authentication in Supabase. Set the Site URL to the deployed OSA domain and add that domain plus `/my-space` to the allowed Redirect URLs. For local development, also allow `http://localhost:3000/**`.

Never commit database passwords, Supabase secret keys or service-role keys. Privileged operations must remain server-side.

## Privacy and development principles

- Personal entries are private to their owner under Row Level Security.
- Diary analysis is opt-in per entry and defaults to off.
- The current app only records consent; it does not yet send diary content to an AI service.
- Derived personal interests must be user-reviewable and deletable before they affect recommendations.
- Public feed and Shorts content must retain source attribution and rights clearance.
- GitHub is the source of truth. Keep changes small, reviewable and documented.
