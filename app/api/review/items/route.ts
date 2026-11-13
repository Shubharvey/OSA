import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "osa_review_access";
const COOKIE_VALUE = "authenticated";
const ALLOWED_STATUSES = ["new", "reviewing", "approved", "rejected"] as const;

function isAuthorized(request: NextRequest) {
  return request.cookies.get(COOKIE_NAME)?.value === COOKIE_VALUE && Boolean(process.env.OSA_REVIEW_SECRET);
}

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return {
    url,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Please sign in to the review centre." }, { status: 401 });
  const supabase = config();
  if (!supabase) return NextResponse.json({ error: "Review service is not configured." }, { status: 503 });

  const status = request.nextUrl.searchParams.get("status") || "all";
  const search = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 120);
  const params = new URLSearchParams({
    select: "id,title,description,canonical_url,author,category_candidates,region_candidates,source_published_at,discovered_at,review_status,raw_metadata,intelligence_sources(name,trust_tier)",
    order: "discovered_at.desc",
    limit: "200",
  });
  if (status !== "all" && ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    params.set("review_status", `eq.${status}`);
  }
  if (search) params.set("title", `ilike.*${search.replace(/[,*()]/g, " ")}*`);

  const response = await fetch(`${supabase.url}/rest/v1/raw_intelligence_items?${params.toString()}`, {
    headers: supabase.headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const details = await response.text();
    return NextResponse.json({ error: "Could not load the review inbox.", details: details.slice(0, 500) }, { status: 502 });
  }

  const items = await response.json();
  return NextResponse.json({ items });
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Please sign in to the review centre." }, { status: 401 });
  const supabase = config();
  if (!supabase) return NextResponse.json({ error: "Review service is not configured." }, { status: 503 });

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.id || !/^[0-9a-f-]{36}$/i.test(body.id) || !ALLOWED_STATUSES.includes(body.status as typeof ALLOWED_STATUSES[number])) {
    return NextResponse.json({ error: "A valid item and review status are required." }, { status: 400 });
  }

  const response = await fetch(`${supabase.url}/rest/v1/raw_intelligence_items?id=eq.${body.id}`, {
    method: "PATCH",
    headers: { ...supabase.headers, Prefer: "return=representation" },
    body: JSON.stringify({ review_status: body.status, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) {
    const details = await response.text();
    return NextResponse.json({ error: "Could not update this item.", details: details.slice(0, 500) }, { status: 502 });
  }
  const rows = await response.json();
  if (!rows.length) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  return NextResponse.json({ item: rows[0] });
}
