"use client";

import { useMemo, useState } from "react";
import { Bell, Search, SlidersHorizontal, Sparkles, TrendingUp, Menu } from "lucide-react";
import { Sidebar } from "@/components/navigation/sidebar";
import { IntelligenceCard } from "@/components/cards/intelligence-card";
import { intelligenceItems } from "@/lib/intelligence/mock-data";
import type { Category } from "@/types/intelligence";

const categories: Category[] = ["All", "Markets", "Startups", "Technology", "Career", "Learning"];

export default function HomePage() {
  const [active, setActive] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => intelligenceItems.filter((item) => {
    const matchesCategory = active === "All" || item.category === active;
    const haystack = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [active, query]);
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
          <div className="hidden text-sm text-slate-500 lg:block">Friday, November 13, 2026 <span className="px-2 text-slate-700">/</span> Global edition</div>
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
              <div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-[#c7f36b]"/> Intelligence workspace <span className="text-slate-700">·</span> Preview</div>
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><div className="text-xs text-slate-500">Intelligence areas</div><div className="mt-2 text-2xl font-semibold">05</div><div className="mt-1 text-[11px] text-slate-600">Markets to learning</div></div>
            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><div className="text-xs text-slate-500">Curated signals</div><div className="mt-2 text-2xl font-semibold">{String(intelligenceItems.length).padStart(2, "0")}</div><div className="mt-1 text-[11px] text-slate-600">Prototype content only</div></div>
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
            {featured && <div className="mb-4"><IntelligenceCard item={featured} featured/></div>}
            {remaining.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">{remaining.map((item) => <IntelligenceCard key={item.id} item={item}/>)}</div> : !featured ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-slate-500">No intelligence found. Try another category or search term.</div> : null}
            <p className="mt-8 text-center text-[11px] leading-5 text-slate-600">Prototype content is illustrative, not live market news or investment advice. Source-linked intelligence will be connected in the next milestone.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
