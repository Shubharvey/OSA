"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Search, SlidersHorizontal, Sparkles, TrendingUp, ArrowUpRight, Bookmark, Home, Compass, GraduationCap, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
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

    const loadFeed = async (supabaseClient: NonNullable<typeof supabase>) => {
      const { data, error } = await supabaseClient
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
    };

    void loadFeed(client);
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
    <div className="flex min-h-screen flex-col bg-[#090b10] lg:flex-row">
      <Sidebar active={active} onSelect={setActive}/>
      <main className="min-w-0 flex-1">
        <section className="min-h-screen bg-[#F8F7F3] pb-28 text-[#24251f] lg:hidden">\n          <div className="px-5 pt-7">\n            <div className="flex items-center justify-between">\n              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4E5044] text-lg font-black text-white">O</div><div><div className="text-lg font-extrabold tracking-[0.2em] text-[#24251f]">OSA</div><div className="text-[9px] font-semibold tracking-[0.22em] text-[#8d8c83]">ONE STEP AHEAD</div></div></div>\n              <button aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#4E5044] shadow-sm"><Bell size={18}/></button>\n            </div>\n            <div className="mt-8"><p className="text-xs font-semibold tracking-wide text-[#929087]">FRIDAY, 13 NOVEMBER</p><h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight">Your world, <span className="text-[#A3645C]">in focus.</span></h1><p className="mt-2 max-w-xs text-sm leading-6 text-[#85847b]">A little clarity on what is moving the world today.</p></div>\n            <div className="mt-6 flex gap-2"><div className="relative min-w-0 flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#96958b]"/><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search intelligence" placeholder="Search stories, topics..." className="h-12 w-full rounded-2xl border border-[#e9e7df] bg-white pl-11 pr-3 text-sm text-[#24251f] outline-none placeholder:text-[#aaa99f] focus:border-[#A3645C]"/></div><button onClick={() => setActive("All")} aria-label="Clear category filter" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4E5044] text-white"><SlidersHorizontal size={17}/></button></div>\n            <div className="mt-6 rounded-[26px] bg-[#4E5044] p-5 text-white shadow-sm"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#e3e4d9]"><Sparkles size={14}/> YOUR DAILY EDGE</span><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] text-[#f1f1e9]">GLOBAL EDITION</span></div><div className="mt-5 flex items-end justify-between"><div><div className="text-3xl font-semibold tracking-tight">{items.length.toString().padStart(2,"0")} <span className="text-base font-normal text-[#d0d1c6]">signals</span></div><p className="mt-1 text-xs text-[#d0d1c6]">Across five areas of intelligence</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dce7a6] text-[#4E5044]"><TrendingUp size={22}/></div></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-3/4 rounded-full bg-[#dce7a6]"/></div><p className="mt-2 text-[10px] text-[#d0d1c6]">{supabase ? "Live intelligence feed" : "Preview edition"} · Updated as stories are published</p></div>\n            <div className="mt-8 flex items-center justify-between"><h2 className="text-base font-semibold">Explore your interests</h2><span className="text-xs text-[#A3645C]">05 topics</span></div>\n            <div className="mt-4 grid grid-cols-5 gap-2">{[{name:"Markets",icon:TrendingUp},{name:"Startups",icon:Sparkles},{name:"Technology",icon:Compass},{name:"Career",icon:BriefcaseBusiness},{name:"Learning",icon:GraduationCap}].map(({name,icon:Icon}) => <button key={name} onClick={() => setActive(name as Category)} className={"flex min-w-0 flex-col items-center gap-2 rounded-2xl px-1 py-3 text-center transition "+(active===name?"bg-[#e7e8d9] text-[#4E5044]":"bg-white text-[#77766e]")}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F0E9]"><Icon size={17}/></span><span className="text-[10px] font-medium">{name}</span></button>)}</div>\n            <div className="mt-8 flex items-center justify-between"><div><h2 className="text-base font-semibold">Today&apos;s intelligence</h2><p className="mt-1 text-xs text-[#929087]">The signals worth your attention</p></div><span className="text-xs text-[#929087]">{filtered.length} stories</span></div>\n            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{categories.map((category) => <button key={category} onClick={() => setActive(category)} className={"shrink-0 rounded-full px-4 py-2 text-xs font-medium "+(active===category?"bg-[#4E5044] text-white":"border border-[#e7e5dd] bg-white text-[#77766e]")}>{category==="All"?"For you":category}</button>)}</div>\n            {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#85847b]">Loading your intelligence…</div> : null}\n            {feedError ? <div role="alert" className="rounded-2xl bg-white p-5 text-sm text-[#A3645C]">We couldn&apos;t load the live feed: {feedError}</div> : null}\n            {!loading && !feedError && filtered.length>0 ? <div className="mt-2 space-y-3">{filtered.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-[22px] border border-[#eeece5] bg-white p-4 shadow-[0_5px_20px_rgba(40,40,30,0.035)] transition active:scale-[0.99]"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[#f2f1e9] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#77766e]">{item.category}</span><span className="text-[10px] text-[#aaa99f]">{item.publishedAt}</span></div><h3 className="mt-3 text-[15px] font-semibold leading-6 text-[#292a24]">{item.title}</h3><p className="mt-2 line-clamp-3 text-xs leading-5 text-[#85847b]">{item.summary}</p><div className="mt-4 flex items-center justify-between border-t border-[#f0eee8] pt-3"><span className="text-[10px] font-medium text-[#A3645C]">{item.source}</span><span className="flex items-center gap-1 text-[10px] text-[#8c8b81]">{item.readTime}<ArrowUpRight size={13}/></span></div></a>)}</div> : null}\n            {!loading && !feedError && filtered.length===0 ? <div className="rounded-2xl border border-dashed border-[#dedcd3] bg-white/60 px-5 py-12 text-center text-sm text-[#929087]">No stories here yet. Try another topic or search.</div> : null}\n            <p className="mt-6 px-3 text-center text-[10px] leading-5 text-[#aaa99f]">OSA links every story to its original source. Information only, not investment advice.</p>\n          </div>\n          <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e9e7df] bg-[#F8F7F3]/95 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl"><div className="mx-auto flex max-w-lg items-center justify-around"><button onClick={() => setActive("All")} className={"flex flex-col items-center gap-1 text-[10px] "+(active==="All"?"text-[#4E5044]":"text-[#a09f95]")}><Home size={19}/><span>Home</span></button><button onClick={() => setActive("Markets")} className={"flex flex-col items-center gap-1 text-[10px] "+(active==="Markets"?"text-[#4E5044]":"text-[#a09f95]")}><TrendingUp size={19}/><span>Markets</span></button><button onClick={() => setActive("Startups")} className={"flex flex-col items-center gap-1 text-[10px] "+(active==="Startups"?"text-[#4E5044]":"text-[#a09f95]")}><Compass size={19}/><span>Explore</span></button><button onClick={() => setActive("Learning")} className={"flex flex-col items-center gap-1 text-[10px] "+(active==="Learning"?"text-[#4E5044]":"text-[#a09f95]")}><GraduationCap size={19}/><span>Learning</span></button><Link href="/my-space" className="flex flex-col items-center gap-1 text-[10px] text-[#a09f95]"><Bookmark size={19}/><span>My Space</span></Link></div></nav>\n        </section>\n        <div className="hidden lg:block">\n        <header className="sticky top-0 z-20 flex min-h-[64px] items-center justify-between gap-3 border-b border-white/10 bg-[#090b10]/95 px-4 py-3 backdrop-blur-xl sm:h-[72px] sm:px-5 md:px-9">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c7f36b] font-black text-[#10150a]">O</div>
            <span className="font-bold tracking-[0.18em]">OSA</span>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">Global edition <span className="px-2 text-slate-700">/</span> One Step Ahead</div>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="relative w-28 min-w-0 sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search intelligence" placeholder="Search..." className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#c7f36b]/40 sm:pr-3"/>
            </div>
            <button aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400"><Bell size={17}/></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222a35] text-xs font-semibold text-[#c7f36b]">U</div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-5 md:px-9 md:py-11">
          <section className="mb-9">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-[#c7f36b]"><Sparkles size={13}/> YOUR WORLD, IN FOCUS</div>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h1 className="text-[clamp(1.8rem,5vw,2.5rem)] font-semibold tracking-tight text-white">Stay one step ahead.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">The signals shaping markets, businesses and what comes next — brought into one place.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-[#c7f36b]"/> {supabase ? "Connected intelligence feed" : "Preview mode"}</div>
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><div className="text-xs text-slate-500">Intelligence areas</div><div className="mt-2 text-2xl font-semibold">05</div><div className="mt-1 text-[11px] text-slate-600">Markets to learning</div></div>
            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><div className="text-xs text-slate-500">Published signals</div><div className="mt-2 text-2xl font-semibold">{String(items.length).padStart(2, "0")}</div><div className="mt-1 text-[11px] text-slate-600">{supabase ? "Live database records" : "Illustrative preview content"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4 min-[420px]:col-span-2 lg:col-span-1"><div className="text-xs text-slate-500">Your daily edge</div><div className="mt-2 flex items-center gap-2 text-2xl font-semibold">01 <TrendingUp size={18} className="text-[#c7f36b]"/></div><div className="mt-1 text-[11px] text-slate-600">One step ahead, every day</div></div>
          </section>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><h2 className="text-lg font-semibold">The intelligence feed</h2><p className="mt-1 text-xs text-slate-500">A clear view of what matters.</p></div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><SlidersHorizontal size={14}/> Filter by focus</div>
            </div>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((category) => <button key={category} onClick={() => setActive(category)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs transition ${active === category ? "border-[#c7f36b] bg-[#c7f36b] font-semibold text-[#10150a]" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"}`}>{category === "All" ? "For you" : category}</button>)}
            </div>
            {loading ? <div className="rounded-2xl border border-white/10 px-6 py-16 text-center text-sm text-slate-400">Loading your intelligence feed…</div> : null}
            {feedError ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/5 px-6 py-5 text-sm text-red-200">We couldn't load the live feed: {feedError}</div> : null}
            {!loading && !feedError && featured && <div className="mb-4"><IntelligenceCard item={featured} featured/></div>}
            {!loading && !feedError && remaining.length > 0 ? <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">{remaining.map((item) => <IntelligenceCard key={item.id} item={item}/>)}</div> : null}
            {!loading && !feedError && filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-slate-500">{supabase ? "Your feed is ready. No stories have been published yet." : "No intelligence found. Try another category or search term."}</div> : null}
            <p className="mt-8 text-center text-[11px] leading-5 text-slate-600">OSA displays published, source-linked intelligence. Always check original sources; content is informational, not investment advice.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
