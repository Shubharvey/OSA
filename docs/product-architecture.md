# OSA product architecture

## Product promise

OSA is a personal intelligence companion: it combines trustworthy global information with a user's own interests, goals and lived experience to make discovery more relevant.

## Product decisions (November 2026)

- Diary analysis is consent-based. Each personal entry stores an explicit `ai_analysis_consent` choice, defaulting to false.
- Launch language is English. The data model keeps language explicit so localisation can be added later without translating or mutating source records.
- OSA Shorts will use a hybrid model: original OSA explainers plus curated, properly attributed publisher/creator videos. Only licensed, owned, or otherwise authorised media may be hosted or embedded.
- Raw personal entries are private. They must never be included in public feeds or exposed to other users.
- Users must be able to review, correct and delete derived personal-interest signals before they influence recommendations.

## Product areas

### Discover
- For You
- Markets
- Startups
- Technology
- Career
- Learning
- OSA Shorts

### Your personal space
- My Space: private diary, ideas, experiences, plans and learning intentions.
- My Goals: career, skill, project, personal and business goals.
- Saved Intelligence: user's private reading and research library.
- Settings: language, personalisation and privacy controls.

## Data boundaries

- `feed_entries`: public, source-attributed intelligence; only published rows are readable publicly.
- `personal_entries`: private user-authored diary entries; row-level security restricts every operation to `auth.uid() = user_id`.
- `personal_goals`, `personal_interest_signals`, `user_profiles`: private account-scoped data.
- `osa_shorts`: public read access only for published items; editorial writes stay server-side.

## Consent and AI analysis

The current My Space implementation saves entries and the user's per-entry analysis preference. It does not yet send diary content to an AI model or create inferred interests. The future analysis pipeline must:
1. Process only entries where the user opted in.
2. Explain what will be extracted before analysis.
3. Show proposed interests/goals for user approval.
4. Store approved signals separately from raw entries.
5. Allow users to edit/delete signals, revoke consent and disable personalisation.
6. Never use sensitive or intimate diary content for advertising or public content.

## OSA Shorts

Each short has a category, title, description, media type (`original` or `curated`), video and thumbnail references, duration, language, source attribution and publication status. A vertical swipe feed is a later UI milestone; the initial schema establishes content governance and attribution.

## Delivery roadmap

1. Private My Space and consent-aware diary storage.
2. Goals and explicit user-selected interests.
3. User-approved analysis of opted-in entries and personalised feed ranking.
4. English launch polish; add Hindi when translation quality and terminology review are ready.
5. Hybrid OSA Shorts ingestion/editorial workflow and vertical player.
6. Multilingual content delivery, more languages and advanced personalisation.
