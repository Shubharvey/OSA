"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Search, SlidersHorizontal, Sparkles, TrendingUp } from "lucide-react";
import { Sidebar } from "@/components/navigation/sidebar";
import { IntelligenceCard } from "@/components/cards/intelligence-card";
import { intelligenceItems as demoItems } from "@/lib/intelligence/mock-data";
import { supabase } from "@/lib/supabase/client";
import type { Category, IntelligenceItem } from "@/types/intelligence";

const categories: Category[] = ["All", "Markets", "Startups", "Technology", "Career", "Learning"];

type FeedRow = {
  id: string;
  category: Exclude<Category, "All">;
  eyebrow: string | null;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string | null;
  reading_time_minutes: number | null;
  signal_level: "high_signal" | "worth_watching" | "explainer";
  is_featured: boolean;
};

function mapFeedRow(row: FeedRow): IntelligenceItem {
  return {
    id: row.id,
    category: row.category,
    eyebrow: row.eyebrow ?? row.category.toUpperCase(),
    title: row.title,
    summary: row.summary,
    source: row.source_name,
    publishedAt: row.published_at
      ? new Date(row.published_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })
      : "Recently added",
    readTime: row.reading_time_minutes ? `${row.reading_time_minutes} min read` : "Brief",
    signal: row.signal_level === "high_signal" ? "High signal" : row.signal_level === "explainer" ? "Explainer" : "Worth watching",
    featured: row.is_featured,
    url: row.source_url,
  };
}

export default function HomePage() {
  const [active, setActive] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<IntelligenceItem[]>(supabase ? [] : demoItems);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [feedError, setFeedError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    async function loadFeed() {
      const { data, error } = await client
        .from("feed_entries")
        .select("id, category, eyebrow, title, summary, source_name, source_url, published_at, reading_time_minutes, signal_level, is_featured")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setFeedError(error.message);
      } else {
        setItems(((data ?? []) as FeedRow[]).map(mapFeedRow));
      }
      setLoading(false);
    }

    loadFeed();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesCategory = active === "All" || item.category === active;
    const haystack = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [active, query, items]);
  const featured = active === "All" && query.length === 0 ? filtered.find((item) => item.featured) : undefined;
  const remaining = featured ? filtered.filter((item) => item.id !== featured.id) : filtered;

  return (
    <div className="flex min-h-screen bg-[#090b10]">
      <Sidebar active={active} onSelect={setActive}/>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#090b10]/90 px-5 backdrop-blur-xl md:px-9">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c7f36b] font-black text-[#10150a]">O</div>
            <span className="font-bold tracking-[0.18em]">OSA</span>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">Global edition <span className="px-2 text-slate-700">/</span> One Step Ahead</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search intelligence..." className="h-10 w-64 rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#c7f36b]/40"/>
            </div>
            <button aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400"><Bell size={17}/></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222a35] text-xs font-semibold text-[#c7f36b]">U</div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-9 md:py-11">
          <section className="mb-9">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-[#c7f36b]"><Sparkles size={13}/> YOUR WORLD, IN FOCUS</div>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Stay one step ahead.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">The signals shaping markets, businesses and what comes next — brought into one place.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-[#c7f36b]"/> {supabase ? "Connected intelligence feed" : "Preview mode"}</div>
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><div className="text-xs text-slate-500">Intelligence areas</div><div className="mt-2 text-2xl font-semibold">05</div><div className="mt-1 text-[11px] text-slate-600">Markets to learning</div></div>
            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><div className="text-xs text-slate-500">Published signals</div><div className="mt-2 text-2xl font-semibold">{String(items.length).padStart(2, "0")}</div><div className="mt-1 text-[11px] text-slate-600">{supabase ? "Live database records" : "Illustrative preview content"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><div className="text-xs text-slate-500">Your daily edge</div><div className="mt-2 flex items-center gap-2 text-2xl font-semibold">01 <TrendingUp size={18} className="text-[#c7f36b]"/></div><div className="mt-1 text-[11px] text-slate-600">One step ahead, every day</div></div>
          </section>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><h2 className="text-lg font-semibold">The intelligence feed</h2><p className="mt-1 text-xs text-slate-500">A clear view of what matters.</p></div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><SlidersHorizontal size={14}/> Filter by focus</div>
            </div>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => <button key={category} onClick={() => setActive(category)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs transition ${active === category ? "border-[#c7f36b] bg-[#c7f36b] font-semibold text-[#10150a]" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"}`}>{category === "All" ? "For you" : category}</button>)}
            </div>
            {loading ? <div className="rounded-2xl border border-white/10 px-6 py-16 text-center text-sm text-slate-400">Loading your intelligence feed…</div> : null}
            {feedError ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/5 px-6 py-5 text-sm text-red-200">We couldn't load the live feed: {feedError}</div> : null}
            {!loading && !feedError && featured && <div className="mb-4"><IntelligenceCard item={featured} featured/></div>}
            {!loading && !feedError && remaining.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">{remaining.map((item) => <IntelligenceCard key={item.id} item={item}/>)}</div> : null}
            {!loading && !feedError && filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-slate-500">{supabase ? "Your feed is ready. No stories have been published yet." : "No intelligence found. Try another category or search term."}</div> : null}
            <p className="mt-8 text-center text-[11px] leading-5 text-slate-600">OSA displays published, source-linked intelligence. Always check original sources; content is informational, not investment advice.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
