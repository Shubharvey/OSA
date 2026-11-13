import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Source = {
  id: string;
  name: string;
  feed_url: string;
  categories: string[];
  regions: string[];
  trust_tier: number;
};

type FeedItem = {
  title: string;
  link: string;
  description: string;
  id: string;
  author: string;
  publishedAt: string | null;
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)));
}

function tagValue(xml: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^{}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp("<(?:[\\w.-]+:)?" + escaped + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?" + escaped + "\\s*>", "i"));
  return match ? decodeXml(match[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
}

function parseFeed(xml: string): FeedItem[] {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)];
  return blocks.map((match) => {
    const block = match[2];
    const linkTag = block.match(/<link\b([^>]*)>([\s\S]*?)<\/link>/i);
    const linkAttr = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
    const link = (linkAttr?.[1] || (linkTag ? decodeXml(linkTag[2]).trim() : "")).trim();
    const published = tagValue(block, "pubDate") || tagValue(block, "published") || tagValue(block, "updated") || tagValue(block, "date");
    const parsedDate = published && !Number.isNaN(Date.parse(published)) ? new Date(published).toISOString() : null;
    return {
      title: tagValue(block, "title"),
      link,
      description: (tagValue(block, "description") || tagValue(block, "summary") || tagValue(block, "content")).slice(0, 5000),
      id: tagValue(block, "guid") || tagValue(block, "id") || link,
      author: tagValue(block, "creator") || tagValue(block, "author"),
      publishedAt: parsedDate,
    };
  }).filter((item) => item.title && item.link);
}


function classifyCategories(title: string, description: string, source: Source): string[] {
  const text = ` ${title} ${description} `.toLowerCase();
  const has = (pattern: RegExp) => pattern.test(text);
  const categories: string[] = [];

  // A source may suggest the eligible topics, but never assigns them automatically.
  const eligible = new Set(source.categories || []);

  const markets = has(/\b(stock market|equity|equities|bond market|bonds|fixed income|forex|foreign exchange|currency|currencies|central bank|interest rate|monetary policy|inflation|cpi|gdp|economic growth|recession|ipo|listing|securities|exchange traded|etf|fund flows|asset management|banking|bank|financial services|credit|debt|yield|treasury|commodit|oil price|gold price|regulat(?:ion|ory|or)|sebi|federal reserve|ecb|fomc|rate cut|rate hike|capital markets)\b/);
  const startups = has(/\b(startup|start-ups|venture capital|vc funding|funding round|series [a-f]|seed round|unicorn|acquisition|merger|m&a|ipo|founder|valuation|private equity|accelerator|incubator)\b/);
  const technology = has(/\b(artificial intelligence|\bai\b|machine learning|generative ai|llm|semiconductor|chipmaker|chip|software|cybersecurity|cloud computing|robotics|quantum computing|data centre|data center|technology|tech company|open source|model release|autonomous vehicle|electric vehicle|battery technology|space technology|satellite|biotechnology)\b/);
  const career = has(/\b(hiring|job market|jobs report|employment|unemployment|workforce|layoff|layoffs|recruitment|salary|wages|skills gap|careers|workplace|labour market|labor market|internship|professional development)\b/);
  const learning = has(/\b(course|courses|certification|certificate|curriculum|university|education|research paper|study finds|academic|scholarship|training programme|training program|learning resource|open access|nptel|mooc)\b/);

  if (eligible.has("Markets") && markets) categories.push("Markets");
  if (eligible.has("Startups") && startups) categories.push("Startups");
  if (eligible.has("Technology") && technology) categories.push("Technology");
  if (eligible.has("Career") && career) categories.push("Career");
  if (eligible.has("Learning") && learning) categories.push("Learning");

  // Only tightly relevant articles enter the OSA review queue.
  return categories;
}

type AutoPublishDecision = { score: number; eligible: boolean; reasons: string[] };

function assessForAutoPublish(item: FeedItem, source: Source, categories: string[]): AutoPublishDecision {
  const tier = source.trust_tier;
  const published = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
  const ageHours = published ? (Date.now() - published) / 3_600_000 : Number.POSITIVE_INFINITY;
  const detail = item.description.trim().length;
  const trusted = tier <= 2;
  const fresh = ageHours >= -6 && ageHours <= 72;
  const enoughDetail = detail >= 120;
  const hasCategory = categories.length > 0;
  const secureLink = (() => { try { return new URL(item.link).protocol === "https:"; } catch { return false; } })();
  const uncertain = /\b(unconfirmed|unverified|rumou?r|alleged(?:ly)?|developing story)\b/i.test(`${item.title} ${item.description}`);
  const tierPoints = tier === 1 ? 35 : tier === 2 ? 27 : 12;
  const freshnessPoints = ageHours >= -6 && ageHours <= 24 ? 25 : fresh ? 18 : ageHours <= 168 ? 10 : 0;
  const detailPoints = detail >= 500 ? 20 : detail >= 200 ? 16 : detail >= 120 ? 10 : 0;
  const score = Math.min(100, tierPoints + freshnessPoints + detailPoints + (hasCategory ? 20 : 0));
  const reasons: string[] = [];
  if (!trusted) reasons.push("Source trust tier is not eligible.");
  if (!fresh) reasons.push("Publication date is missing, too old, or in the future.");
  if (!enoughDetail) reasons.push("Source description is too short.");
  if (!hasCategory) reasons.push("No eligible OSA category matched.");
  if (!secureLink) reasons.push("Original source link is not HTTPS.");
  if (uncertain) reasons.push("Uncertainty or unverified-language indicator found.");
  if (score <= 72) reasons.push("Score is 72 or below.");
  return { score, eligible: score > 72 && trusted && fresh && enoughDetail && hasCategory && secureLink && !uncertain, reasons };
}

function buildAutomaticBrief(item: FeedItem, source: Source, category: string, score: number, rawItemId: string) {
  const description = item.description.trim().replace(/\s+/g, " ").slice(0, 1800);
  const audiences: Record<string, string> = {
    Markets: "Investors, financial-market professionals, analysts and businesses exposed to market movements.",
    Startups: "Founders, startup operators, venture investors and people tracking private-market activity.",
    Technology: "Technology leaders, builders, researchers and businesses assessing technology adoption.",
    Career: "Job seekers, professionals, employers and people tracking workforce and skills trends.",
    Learning: "Students, researchers and professionals looking for credible learning and research resources.",
  };
  const why: Record<string, string> = {
    Markets: "This development may affect market conditions, financial institutions, asset prices or the wider economy. Follow the linked source for the underlying announcement and subsequent updates.",
    Startups: "This development may influence startup competition, company strategy, funding or the wider innovation ecosystem.",
    Technology: "This development may influence technology adoption, product capabilities, infrastructure or competitive positioning.",
    Career: "This development may affect hiring demand, workplace priorities or the skills employers value.",
    Learning: "This resource or research may offer useful knowledge, evidence or learning opportunities. Consult the original source for full details.",
  };
  const analysis = /\b(forecast|outlook|expects?|predicts?|analysis|opinion|could|may|might|likely|potential)\b/i.test(`${item.title} ${description}`);
  const summary = `${description}\n\nWhy it matters\n${why[category]}\n\nWho should care\n${audiences[category]}\n\nEditorial note\nAutomatically prepared from the source description (automated quality score: ${score}/100). This is a source-based brief, not independent verification or investment advice.`;
  const title = item.title.trim().slice(0, 180);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) + "-" + rawItemId.slice(0, 8);
  return { slug, category, eyebrow: analysis ? `${category.toUpperCase()} · ANALYSIS` : category.toUpperCase(), title, summary, source_name: source.name, source_url: item.link, published_at: item.publishedAt || new Date().toISOString(), reading_time_minutes: Math.max(1, Math.ceil(summary.split(/\s+/).length / 200)), signal_level: analysis ? "explainer" : score >= 88 ? "high_signal" : "worth_watching", is_featured: false, status: "published" };
}

function canonicalize(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString().slice(0, 2000);
  } catch {
    return null;
  }
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: NextRequest) {
  const secret = process.env.INGEST_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = request.headers.get("authorization") || "";

  if (!secret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Collector is not configured." }, { status: 503 });
  }
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const restHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const sourcesResponse = await fetch(
    `${supabaseUrl}/rest/v1/intelligence_sources?is_active=eq.true&select=id,name,feed_url,categories,regions,trust_tier,last_fetched_at,fetch_interval_minutes`,
    { headers: restHeaders, cache: "no-store" },
  );
  if (!sourcesResponse.ok) {
    const supabaseError = await sourcesResponse.text();
    return NextResponse.json({
      error: "Supabase rejected the source registry request.",
      status: sourcesResponse.status,
      details: supabaseError.slice(0, 1200),
      hint: "Check the intelligence_sources table, service-role key, and Supabase API schema cache.",
    }, { status: 500 });
  }

  const sources = await sourcesResponse.json() as Array<Source & { last_fetched_at: string | null; fetch_interval_minutes: number }>;
  const now = Date.now();
  const dueSources = sources.filter((source) => !source.last_fetched_at ||
    now - new Date(source.last_fetched_at).getTime() >= source.fetch_interval_minutes * 60_000);

  let fetched = 0;
  let inserted = 0;
  let duplicates = 0;
  let autoPublished = 0;
  let heldForReview = 0;
  const failures: Array<{ source: string; error: string }> = [];

  for (const source of dueSources.slice(0, 12)) {
    try {
      const response = await fetch(source.feed_url, {
        headers: { "User-Agent": "OSA-IntelligenceBot/0.1 (+https://osa-woad.vercel.app)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(12_000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Feed returned HTTP ${response.status}`);
      const xml = (await response.text()).slice(0, 2_000_000);
      const items = parseFeed(xml).slice(0, 40);
      let sourceInserted = 0;

      for (const item of items) {
        const canonicalUrl = canonicalize(item.link);
        if (!canonicalUrl) continue;
        const categories = classifyCategories(item.title, item.description, source);
        if (categories.length === 0) continue;
        const title = item.title.replace(/\s+/g, " ").slice(0, 500);
        const description = item.description.replace(/\s+/g, " ").slice(0, 5000);
        const contentHash = await sha256(`${title.toLowerCase()}|${description.toLowerCase()}`);
        const payload = {
          source_id: source.id,
          external_id: item.id.slice(0, 1000),
          canonical_url: canonicalUrl,
          title,
          description,
          author: item.author.slice(0, 300),
          category_candidates: categories,
          region_candidates: source.regions,
          source_published_at: item.publishedAt,
          content_hash: contentHash,
          raw_metadata: { trust_tier: source.trust_tier, collector: "rss_atom_v1" },
        };

        const saveResponse = await fetch(`${supabaseUrl}/rest/v1/raw_intelligence_items?on_conflict=canonical_url`, {
          method: "POST",
          headers: { ...restHeaders, Prefer: "resolution=ignore-duplicates,return=representation" },
          body: JSON.stringify(payload),
        });
        if (!saveResponse.ok) throw new Error("Could not save a collected item.");
        const savedRows = await saveResponse.json() as Array<{ id: string }>;
        if (savedRows.length > 0) {
          sourceInserted += savedRows.length;
        }
      }

      // Re-evaluate pending inbox items, including stories collected before auto-publishing was added.
      const pendingResponse = await fetch(
        `${supabaseUrl}/rest/v1/raw_intelligence_items?source_id=eq.${source.id}&review_status=eq.new&select=id,title,canonical_url,description,source_published_at,category_candidates&order=source_published_at.desc.nullslast&limit=100`,
        { headers: restHeaders, cache: "no-store" },
      );
      if (!pendingResponse.ok) throw new Error("Could not load pending inbox items for automatic publishing.");
      const pendingItems = await pendingResponse.json() as Array<{
        id: string;
        title: string;
        canonical_url: string;
        description: string | null;
        source_published_at: string | null;
        category_candidates: string[] | null;
      }>;

      for (const pending of pendingItems) {
        const item: FeedItem = {
          title: pending.title,
          link: pending.canonical_url,
          description: pending.description || "",
          id: pending.id,
          author: "",
          publishedAt: pending.source_published_at,
        };
        const categories = (pending.category_candidates || []).filter((category) =>
          ["Markets", "Startups", "Technology", "Career", "Learning"].includes(category)
        );
        const decision = assessForAutoPublish(item, source, categories);
        if (!decision.eligible) {
          heldForReview += 1;
          continue;
        }

        const brief = buildAutomaticBrief(item, source, categories[0], decision.score, pending.id);
        const publishResponse = await fetch(`${supabaseUrl}/rest/v1/feed_entries?on_conflict=slug`, {
          method: "POST",
          headers: { ...restHeaders, Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify(brief),
        });
        if (!publishResponse.ok) throw new Error("A pending item qualified, but automatic publishing failed.");

        const statusResponse = await fetch(`${supabaseUrl}/rest/v1/raw_intelligence_items?id=eq.${pending.id}&review_status=eq.new`, {
          method: "PATCH",
          headers: { ...restHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ review_status: "published", updated_at: new Date().toISOString() }),
        });
        if (!statusResponse.ok) throw new Error("An item was published, but its inbox status could not be updated.");
        autoPublished += 1;
      }

      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/intelligence_sources?id=eq.${source.id}`, {
        method: "PATCH",
        headers: { ...restHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ last_fetched_at: new Date().toISOString(), last_success_at: new Date().toISOString(), last_error: null }),
      });
      if (!updateResponse.ok) throw new Error("Feed succeeded but source status could not be updated.");
      fetched += 1;
      inserted += sourceInserted;
      duplicates += Math.max(0, items.length - sourceInserted);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown feed error";
      failures.push({ source: source.name, error: message });
      await fetch(`${supabaseUrl}/rest/v1/intelligence_sources?id=eq.${source.id}`, {
        method: "PATCH",
        headers: { ...restHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ last_fetched_at: new Date().toISOString(), last_error: message.slice(0, 500) }),
      }).catch(() => undefined);
    }
  }

  return NextResponse.json({
    ok: failures.length === 0,
    sources_checked: dueSources.length,
    sources_fetched: fetched,
    items_seen: inserted + duplicates,
    items_inserted: inserted,
    duplicates_or_existing: duplicates,
    failures,
    auto_published: autoPublished,
    held_for_review: heldForReview,
    publishing_policy: "Automatically publish pending and newly collected items scoring above 72/100 that also pass source trust, freshness, detail, category, HTTPS-link and uncertainty safeguards. Other items remain private for review.",
  });
}
