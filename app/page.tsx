"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Search, SlidersHorizontal, Sparkles, TrendingUp, ArrowUpRight, Bookmark, Home, Compass, GraduationCap, BriefcaseBusiness, ThumbsUp, ThumbsDown, Ban } from "lucide-react";
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
  const [selectedStory, setSelectedStory] = useState<IntelligenceItem | null>(null);
  const [storyFeedback, setStoryFeedback] = useState<Record<string, "like" | "dislike">>({});
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");

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
    const matchesCategory = (active === "All" || item.category === active) && !hiddenCategories.includes(item.category);
    const haystack = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [active, query, items, hiddenCategories]);
  function rateStory(item: IntelligenceItem, rating: "like" | "dislike") {
    const next = { ...storyFeedback, [item.id]: storyFeedback[item.id] === rating ? undefined : rating };
    if (next[item.id] === undefined) delete next[item.id];
    setStoryFeedback(next);
    try { localStorage.setItem("osa-story-feedback-v1", JSON.stringify(next)); } catch { /* Local preference storage may be unavailable. */ }
    setFeedbackMessage(rating === "like" ? "Thanks. We'll use this signal to improve your feed." : "Thanks. We'll show you fewer stories like this.");
  }

  function hideStoryCategory(item: IntelligenceItem) {
    const next = hiddenCategories.includes(item.category) ? hiddenCategories : [...hiddenCategories, item.category];
    setHiddenCategories(next);
    try { localStorage.setItem("osa-hidden-categories-v1", JSON.stringify(next)); } catch { /* Local preference storage may be unavailable. */ }
    setFeedbackMessage(`We'll hide ${item.category} stories on this device. You can change this later by clearing your OSA feed preferences.`);
    setSelectedStory(null);
  }

  const featured = active === "All" && query.length === 0 ? filtered.find((item) => item.featured) : undefined;
  const remaining = featured ? filtered.filter((item) => item.id !== featured.id) : filtered;

  return (
    <div className="flex min-h-screen flex-col bg-[#090b10] lg:flex-row">
      <Sidebar active={active} onSelect={setActive}/>
      <main className="min-w-0 flex-1">
        <section className="min-h-screen bg-[#f7f6f1] pb-24 text-[#24251f] lg:hidden">
          <header className="sticky top-0 z-30 border-b border-[#e9e7df] bg-[#f7f6f1]/95 px-4 pb-3 pt-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4e5044] text-base font-black text-white">O</div><span className="text-lg font-extrabold tracking-[0.18em]">OSA</span></div>
              <div className="relative w-[46%]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929087]"/><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search intelligence" placeholder="Search OSA" className="h-10 w-full rounded-full border border-[#e7e5dd] bg-white pl-9 pr-3 text-xs text-[#24251f] outline-none placeholder:text-[#aaa99f] focus:border-[#a3645c]"/></div>
              <Link href="/my-space" aria-label="My Space" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e8df] text-xs font-bold text-[#4e5044]">U</Link>
            </div>
            <nav aria-label="Categories" className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((category) => <button key={category} onClick={() => setActive(category)} className={"shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition "+(active===category?"bg-[#4e5044] text-white":"bg-white text-[#77766e] ring-1 ring-inset ring-[#e7e5dd]")}>{category==="All"?"For you":category}</button>)}
            </nav>
          </header>
          <div className="px-3 pt-4">
            <div className="mb-4 flex items-center justify-between px-1"><div><p className="text-[10px] font-bold tracking-[0.18em] text-[#a3645c]">ONE STEP AHEAD</p><h1 className="mt-1 text-xl font-semibold tracking-tight">{active==="All"?"Discover":active}</h1></div><span className="text-[11px] text-[#99988f]">{filtered.length} stories</span></div>
            {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#85847b]">Loading your intelligence…</div> : null}
            {feedError ? <div role="alert" className="rounded-2xl bg-white p-5 text-sm text-[#a3645c]">We couldn&apos;t load the live feed: {feedError}</div> : null}
            {!loading && !feedError && filtered.length>0 ? <div className="columns-2 gap-3 [column-fill:_balance]">
              {filtered.map((item,index) => {
                const palettes = [
                  {bg:"from-[#d9dfc8] to-[#aeb99a]",ink:"#384333",tag:"#53634a"},
                  {bg:"from-[#ead8ce] to-[#c28d7d]",ink:"#513a35",tag:"#8e574d"},
                  {bg:"from-[#d8e0e4] to-[#9eb2ba]",ink:"#30444b",tag:"#536d78"},
                  {bg:"from-[#e8dfc7] to-[#c8b88e]",ink:"#4c4432",tag:"#81714c"},
                  {bg:"from-[#ded7e8] to-[#b6a6ca]",ink:"#453c54",tag:"#75618e"}
                ];
                const palette=palettes[index%palettes.length];
                const heights=["h-36","h-48","h-40","h-32","h-52"];
                return <article key={item.id} className="mb-3 inline-block w-full break-inside-avoid overflow-hidden rounded-[19px] bg-white shadow-[0_3px_14px_rgba(40,40,30,0.07)]">
                  <button type="button" onClick={() => setSelectedStory(item)} className="block w-full text-left">
                    <div className={"relative "+heights[index%heights.length]+" overflow-hidden bg-gradient-to-br "+palette.bg}>
                      <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full border-[18px] border-white/20"/>
                      <div className="absolute -bottom-10 -left-7 h-32 w-32 rounded-full bg-white/20"/>
                      <div className="absolute inset-0 flex flex-col justify-between p-3" style={{color:palette.ink}}>
                        <span className="w-fit rounded-full bg-white/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]">{item.category}</span>
                        <div><span className="text-[9px] font-bold tracking-[0.16em] opacity-65">OSA / FIELD NOTES</span><div className="mt-1 text-xl font-black leading-[0.95] tracking-tight">{item.category==="Markets"?"MARKET\nPULSE":item.category==="Startups"?"NEXT\nWAVE":item.category==="Technology"?"TECH\nSHIFT":item.category==="Career"?"CAREER\nEDGE":"LEARN\nMORE"}</div></div>
                      </div>
                    </div>
                    <div className="p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-[#a3645c]">{item.source}</p><h2 className="mt-1.5 text-[13px] font-semibold leading-[1.35] text-[#292a24]">{item.title}</h2><p className="mt-2 line-clamp-3 text-[10px] leading-[1.5] text-[#85847b]">{item.summary}</p><div className="mt-3 flex items-center justify-between border-t border-[#f0eee8] pt-2"><span className="text-[9px] text-[#99988f]">{item.publishedAt}</span><span className="text-[9px] font-semibold" style={{color:palette.tag}}>{item.readTime}</span></div></div>
                  </button>
                </article>;
              })}
            </div> : null}
            {!loading && !feedError && filtered.length===0 ? <div className="rounded-2xl border border-dashed border-[#dedcd3] bg-white/70 px-5 py-12 text-center text-sm text-[#929087]">No stories here yet. Try another category or search.</div> : null}
            <p className="px-3 py-6 text-center text-[10px] leading-5 text-[#aaa99f]">Source-linked intelligence from OSA. Always check the original source.</p>
          </div>
          {selectedStory ? <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onClick={() => setSelectedStory(null)}>
            <section role="dialog" aria-modal="true" aria-labelledby="story-reader-title" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-[#f7f6f1] text-[#24251f] shadow-2xl sm:rounded-[28px]" onClick={(event) => event.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e9e7df] bg-[#f7f6f1]/95 px-5 py-4 backdrop-blur-xl"><span className="text-xs font-bold tracking-[0.18em] text-[#4e5044]">OSA STORY</span><button onClick={() => setSelectedStory(null)} aria-label="Close story" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e8df] text-lg text-[#4e5044]">×</button></div>
              <div className="px-5 pb-7 pt-5 sm:px-8">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a3645c]"><span>{selectedStory.category}</span><span>·</span><span>{selectedStory.publishedAt}</span></div>
                <h2 id="story-reader-title" className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{selectedStory.title}</h2>
                <div className="mt-4 flex items-center justify-between border-b border-[#e9e7df] pb-4"><div><p className="text-xs font-semibold text-[#4e5044]">{selectedStory.source}</p><p className="mt-1 text-[11px] text-[#929087]">{selectedStory.readTime} · {selectedStory.signal}</p></div><span className="rounded-full bg-[#e9e8df] px-3 py-1.5 text-[10px] font-semibold text-[#4e5044]">OSA brief</span></div>
                <div className="prose prose-sm mt-6 max-w-none whitespace-pre-line text-[14px] leading-7 text-[#55564e]">{selectedStory.summary}</div>
                <div className="mt-7 rounded-2xl border border-[#e6e3d9] bg-white p-4">
                  <p className="text-xs font-semibold text-[#4e5044]">Help us tune your feed</p>
                  <p className="mt-1 text-xs leading-5 text-[#85847b]">Was this useful? Your feedback helps shape what you see next.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => rateStory(selectedStory, "like")} aria-pressed={storyFeedback[selectedStory.id] === "like"} className={"flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold "+(storyFeedback[selectedStory.id] === "like" ? "border-[#71845c] bg-[#edf1e5] text-[#4e6841]" : "border-[#e7e5dd] text-[#77766e]")}><ThumbsUp size={15}/> Useful</button>
                    <button onClick={() => rateStory(selectedStory, "dislike")} aria-pressed={storyFeedback[selectedStory.id] === "dislike"} className={"flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold "+(storyFeedback[selectedStory.id] === "dislike" ? "border-[#a3645c] bg-[#f5eae6] text-[#8e574d]" : "border-[#e7e5dd] text-[#77766e]")}><ThumbsDown size={15}/> Not useful</button>
                  </div>
                  <button onClick={() => hideStoryCategory(selectedStory)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7e5dd] px-3 py-3 text-xs font-semibold text-[#8e574d]"><Ban size={15}/> Never show me {selectedStory.category} stories</button>
                  {feedbackMessage ? <p role="status" className="mt-3 text-[11px] leading-5 text-[#71845c]">{feedbackMessage}</p> : null}
                </div>
                <div className="mt-8 rounded-2xl border border-[#e6e3d9] bg-white p-4"><p className="text-xs font-semibold text-[#4e5044]">Want to read the original reporting?</p><p className="mt-1 text-xs leading-5 text-[#85847b]">Visit the publisher for the complete original article, additional context and updates.</p><a href={selectedStory.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#4e5044] px-5 py-3 text-xs font-semibold text-white">Continue to {selectedStory.source} <ArrowUpRight size={14}/></a></div>
                <p className="mt-5 text-[10px] leading-5 text-[#aaa99f]">OSA briefs are informational summaries based on the cited source. Check the original publisher for the full report and latest updates.</p>
              </div>
            </section>
          </div> : null}
          <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e9e7df] bg-[#f7f6f1]/95 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-lg items-center justify-around"><button onClick={() => setActive("All")} className={"flex flex-col items-center gap-1 py-1 text-[10px] "+(active==="All"?"text-[#4e5044]":"text-[#a09f95]")}><Home size={19}/><span>Home</span></button><button onClick={() => setActive("Markets")} className={"flex flex-col items-center gap-1 py-1 text-[10px] "+(active==="Markets"?"text-[#4e5044]":"text-[#a09f95]")}><TrendingUp size={19}/><span>Markets</span></button><button onClick={() => setActive("Startups")} className={"flex flex-col items-center gap-1 py-1 text-[10px] "+(active==="Startups"?"text-[#4e5044]":"text-[#a09f95]")}><Compass size={19}/><span>Explore</span></button><button onClick={() => setActive("Learning")} className={"flex flex-col items-center gap-1 py-1 text-[10px] "+(active==="Learning"?"text-[#4e5044]":"text-[#a09f95]")}><GraduationCap size={19}/><span>Learning</span></button><Link href="/my-space" className="flex flex-col items-center gap-1 py-1 text-[10px] text-[#a09f95]"><Bookmark size={19}/><span>My Space</span></Link></div></nav>
        </section>
        <div className="hidden lg:block">\n        <header className="sticky top-0 z-20 flex min-h-[64px] items-center justify-between gap-3 border-b border-white/10 bg-[#090b10]/95 px-4 py-3 backdrop-blur-xl sm:h-[72px] sm:px-5 md:px-9">
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
        </div>
      </main>
    </div>
  );
}
