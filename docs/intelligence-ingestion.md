# OSA Intelligence Ingestion

## What this adds

- A private source registry for RSS/Atom feeds.
- A private raw intelligence inbox for discovered items.
- A protected server-side collector at `POST /api/ingest`.
- A GitHub Actions schedule that triggers collection every three hours.
- URL-based deduplication and source-level fetch intervals.
- No paid AI calls. Qualifying items can be automatically published using deterministic rules; low-scoring items are automatically rejected while their records are retained.

The collector stores feed headlines, descriptions, source links, authors and publication timestamps. It does not crawl full articles.

## 1. Apply the database migration

In Supabase, open **SQL Editor**, create a new query, paste the complete contents of `supabase/intelligence-ingestion.sql`, and run it.

This creates `intelligence_sources` and `raw_intelligence_items`, then registers a small initial set of global and India-relevant feeds. The tables have RLS enabled and no client-facing access policies. Only the server-side service role can access them.

## 2. Add server-only Vercel environment variables

In Vercel → OSA project → Settings → Environment Variables, add:

- `SUPABASE_SERVICE_ROLE_KEY`: the Supabase service-role secret. Keep this server-side; never prefix it with `NEXT_PUBLIC_`.
- `INGEST_SECRET`: a long random secret used only to protect the collector endpoint.

Use the same `INGEST_SECRET` value in GitHub repository Actions secrets. Do not put either value in source code or commit them to GitHub.

The collector also uses the existing `NEXT_PUBLIC_SUPABASE_URL` value already configured for the app.

After saving environment variables, redeploy the Vercel project so the server runtime receives them.

## 3. Configure GitHub Actions secrets

In GitHub → repository **Shubharvey/OSA** → Settings → Secrets and variables → Actions, create:

- `OSA_INGEST_URL` = `https://osa-woad.vercel.app/api/ingest`
- `INGEST_SECRET` = exactly the same value as the Vercel `INGEST_SECRET`

The workflow runs every three hours and can also be started manually from the Actions tab.

## 4. First-run verification

After the migration, Vercel environment variables and GitHub secrets are in place:

1. Open GitHub → Actions → **OSA Intelligence Collection**.
2. Select **Run workflow**.
3. Open the run and check that the collector completed.
4. In Supabase Table Editor, inspect `intelligence_sources` for `last_success_at`.
5. Inspect `raw_intelligence_items` for collected headlines and source links.

## Important safeguards

- New records start with `review_status = 'new'`.
- The collector writes to `feed_entries` only for items scoring above 72/100 that also pass all publishing safeguards.
- Items scoring below 60/100 are marked `rejected` and retained for audit and URL-based deduplication, so they are not repeatedly reprocessed.
- Items scoring 60–72/100, and higher-scoring items that fail a safeguard, remain private for review.
- Only trusted server-side code uses the service-role key.
- Feed descriptions are limited to 5,000 characters.
- The initial source list is a starting point; source health, licensing and relevance should be reviewed before expanding it.

## Cost

This design uses the existing free-tier services and public feeds. GitHub Actions and Vercel/Supabase free tiers have usage limits and can change; monitor usage. There are no paid AI API calls in this collection stage.
