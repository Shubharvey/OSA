# OSA — One Step Ahead

A personalised global intelligence platform that simplifies markets, emerging technologies, startups and career opportunities.

## Product direction

OSA brings useful global signals into one focused, source-attributed intelligence feed. The first milestone is a responsive dashboard with category navigation, search and intelligence cards. The intelligence pipeline and personalisation layer will follow once the product experience is established.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (client foundation added; credentials not yet configured)
- GitHub
- Vercel (deployment not yet configured)

## Current MVP

- Responsive dark-mode intelligence dashboard
- Navigation across Markets, Startups, Technology, Career and Learning
- Category filtering and client-side search
- Reusable intelligence cards with source attribution fields
- Typed intelligence model and clearly labelled prototype sample content
- Supabase browser-client foundation and environment-variable example

> The current feed contains illustrative prototype entries, not live news. Each sample is explicitly labelled as an OSA Research Preview. Do not treat it as current market information or investment advice.

## Run locally

1. Install Node.js (LTS).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key when Supabase is configured.
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

## Project structure

```text
app/                  Next.js routes and global styles
components/cards/     Reusable intelligence cards
components/navigation/Navigation components
lib/intelligence/     Feed data and intelligence logic
lib/supabase/         Supabase client
types/                Shared TypeScript models
public/               Static assets
```

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit secrets or service-role keys. Keep privileged Supabase operations server-side.

## Next milestones

1. Connect Supabase and define the feed-entry schema.
2. Replace prototype entries with verified, source-linked records.
3. Add saved items and personalisation.
4. Add ingestion and editorial review workflows.
5. Deploy the MVP to Vercel.

## Development principles

GitHub is the source of truth. Keep changes small, reviewable and documented. Prioritise trustworthy sourcing, useful context and a calm product experience.
