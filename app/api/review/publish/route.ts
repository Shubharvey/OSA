import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const secret = process.env.OSA_REVIEW_SECRET;
  const supplied = request.cookies.get("osa_review_access")?.value || "";
  if (!secret || !supplied) return false;
  const expected = createHmac("sha256", secret).update("osa-review-session-v1").digest("hex");
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } };
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Please sign in to the review centre." }, { status: 401 });
  const db = config();
  if (!db) return NextResponse.json({ error: "Publishing service is not configured." }, { status: 503 });

  let body: { item_id?: string; category?: string; title?: string; summary?: string; why_it_matters?: string; who_should_care?: string; signal_level?: string; action?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const categories = ["Markets", "Startups", "Technology", "Career", "Learning"];
  const signals = ["high_signal", "worth_watching", "explainer"];
  if (!body.item_id || !/^[0-9a-f-]{36}$/i.test(body.item_id) ||
      !categories.includes(body.category || "") || !signals.includes(body.signal_level || "") ||
      !["draft", "publish"].includes(body.action || "") ||
      !body.title?.trim() || body.title.trim().length > 180 ||
      !body.summary?.trim() || !body.why_it_matters?.trim() || !body.who_should_care?.trim()) {
    return NextResponse.json({ error: "Complete every field and choose a valid category and publishing action." }, { status: 400 });
  }

  // The validation above guarantees this is one of the allowed category strings.
  const category = body.category!;
  const sourceResponse = await fetch(`${db.url}/rest/v1/raw_intelligence_items?id=eq.${body.item_id}&select=id,title,canonical_url,source_published_at,review_status,intelligence_sources(name)`, { headers: db.headers, cache: "no-store" });
  if (!sourceResponse.ok) return NextResponse.json({ error: "Could not verify the source item." }, { status: 502 });
  const sources = await sourceResponse.json();
  const item = sources[0];
  if (!item) return NextResponse.json({ error: "Source item not found." }, { status: 404 });
  if (item.review_status !== "approved") return NextResponse.json({ error: "Only approved source items can be turned into OSA briefs." }, { status: 409 });

  const status = body.action === "publish" ? "published" : "draft";
  const slug = body.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) + "-" + body.item_id.slice(0, 8);
  const summary = `${body.summary.trim()}\n\nWhy it matters\n${body.why_it_matters.trim()}\n\nWho should care\n${body.who_should_care.trim()}`;
  const payload = {
    slug, category, eyebrow: category.toUpperCase(), title: body.title.trim(),
    summary, source_name: item.intelligence_sources?.name || "Original source",
    source_url: item.canonical_url, published_at: item.source_published_at || new Date().toISOString(),
    reading_time_minutes: Math.max(1, Math.ceil(summary.split(/\\s+/).length / 200)),
    signal_level: body.signal_level, is_featured: false, status,
  };
  const insert = await fetch(`${db.url}/rest/v1/feed_entries?on_conflict=slug`, {
    method: "POST", headers: { ...db.headers, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(payload),
  });
  if (!insert.ok) {
    const details = await insert.text();
    return NextResponse.json({ error: "Could not save the OSA brief.", details: details.slice(0, 500) }, { status: 502 });
  }
  if (status === "published") {
    const update = await fetch(`${db.url}/rest/v1/raw_intelligence_items?id=eq.${body.item_id}`, {
      method: "PATCH", headers: { ...db.headers, Prefer: "return=minimal" },
      body: JSON.stringify({ review_status: "published", updated_at: new Date().toISOString() }),
    });
    if (!update.ok) return NextResponse.json({ error: "The brief was published, but its inbox status could not be updated. Please refresh and check the public feed." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, status, entry: (await insert.json())[0] });
}
