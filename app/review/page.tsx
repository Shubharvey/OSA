"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, Filter, LockKeyhole, LogOut, RefreshCw, Search, ShieldCheck, X } from "lucide-react";

type ReviewStatus = "new" | "reviewing" | "approved" | "rejected";
type ReviewItem = {
  id: string;
  source_id: string;
  title: string;
  description: string;
  canonical_url: string;
  author: string | null;
  category_candidates: string[];
  region_candidates: string[];
  source_published_at: string | null;
  discovered_at: string;
  review_status: ReviewStatus;
  raw_metadata: { trust_tier?: number };
  intelligence_sources: { name: string; trust_tier: number } | null;
};

const statusOptions: { value: "all" | ReviewStatus; label: string }[] = [
  { value: "all", label: "All items" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString("en", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ReviewPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"all" | ReviewStatus>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sourceId, setSourceId] = useState("all");
  const [sources, setSources] = useState<{ id: string; name: string; trust_tier: number }[]>([]);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ status, q: query, category, source: sourceId });
      const response = await fetch(`/api/review/items?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load the inbox.");
      setItems(result.items as ReviewItem[]);
      setSources(result.sources || []);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the inbox.");
      if (err instanceof Error && err.message.includes("sign in")) setAuthenticated(false);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [status, query, category, sourceId]);

  useEffect(() => {
    let active = true;
    fetch("/api/review/items?status=all", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (response.ok) {
          setAuthenticated(true);
          const result = await response.json();
          setItems(result.items as ReviewItem[]);
          setSources(result.sources || []);
        } else if (response.status !== 401) {
          const result = await response.json();
          setError(result.error || "Review service is not configured.");
        }
      })
      .catch(() => { if (active) setError("Could not connect to the review service."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authenticated) void loadItems();
  }, [authenticated, loadItems]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/review/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      setPassword("");
      setAuthenticated(true);
      setNotice("You're signed in to the private review centre.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  async function updateStatus(item: ReviewItem, nextStatus: ReviewStatus) {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/review/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update item.");
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, review_status: nextStatus } : entry));
      setNotice(`Moved to ${nextStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update item.");
    } finally {
      setBusyId(null);
    }
  }

  async function signOut() {
    await fetch("/api/review/auth", { method: "DELETE" });
    setAuthenticated(false);
    setItems([]);
    setNotice("You have signed out.");
  }

  function normalizedTitle(value: string) {
    return value.toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|a|an|to|of|in|on|for|with|and)\b/g, " ").replace(/\s+/g, " ").trim();
  }

  function similarity(left: string, right: string) {
    const a = new Set(normalizedTitle(left).split(" ").filter((word) => word.length > 2));
    const b = new Set(normalizedTitle(right).split(" ").filter((word) => word.length > 2));
    if (!a.size || !b.size) return 0;
    const intersection = [...a].filter((word) => b.has(word)).length;
    return intersection / (a.size + b.size - intersection);
  }

  function triageScore(item: ReviewItem) {
    const tier = item.intelligence_sources?.trust_tier ?? item.raw_metadata?.trust_tier ?? 3;
    const sourcePoints = tier === 1 ? 35 : tier === 2 ? 23 : 10;
    const published = item.source_published_at ? new Date(item.source_published_at).getTime() : 0;
    const ageHours = published ? Math.max(0, (Date.now() - published) / 3_600_000) : 24 * 30;
    const recencyPoints = published ? Math.max(0, 30 - Math.min(30, ageHours / 24)) : 0;
    const detailPoints = item.description?.trim().length > 240 ? 20 : item.description?.trim().length > 60 ? 12 : 4;
    const categoryPoints = item.category_candidates?.length ? 10 : 0;
    return Math.min(100, Math.round(sourcePoints + recencyPoints + detailPoints + categoryPoints));
  }

  const duplicateIds = useMemo(() => {
    const duplicates = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (similarity(items[i].title, items[j].title) >= 0.72) {
          duplicates.add(items[i].id);
          duplicates.add(items[j].id);
        }
      }
    }
    return duplicates;
  }, [items]);

  const counts = useMemo(() => ({
    all: items.length,
    fresh: items.filter((item) => item.review_status === "new").length,
    reviewing: items.filter((item) => item.review_status === "reviewing").length,
    approved: items.filter((item) => item.review_status === "approved").length,
    rejected: items.filter((item) => item.review_status === "rejected").length,
  }), [items]);

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-[#090b10] text-sm text-slate-400">Opening private review centre…</main>;
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b10] px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11151d] p-7 shadow-2xl">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white"><ArrowLeft size={14}/> Back to OSA</Link>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c7f36b]/10 text-[#c7f36b]"><LockKeyhole size={22}/></div>
          <p className="text-[10px] font-bold tracking-[0.22em] text-[#c7f36b]">PRIVATE WORKSPACE</p>
          <h1 className="mt-2 text-2xl font-semibold">Intelligence Review Centre</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to inspect and organise stories collected by OSA. This inbox is private and separate from the public feed.</p>
          <form onSubmit={signIn} className="mt-7 space-y-3">
            <label htmlFor="review-password" className="block text-xs font-medium text-slate-300">Review password</label>
            <input id="review-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#c7f36b]/50" placeholder="Enter your private review password"/>
            <button disabled={loading || !password} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#c7f36b] text-sm font-bold text-[#10150a] disabled:opacity-50">{loading ? "Signing in…" : "Unlock review centre"}</button>
          </form>
          {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-200">{error}</p>}
          <p className="mt-6 flex items-center gap-2 text-[11px] text-slate-600"><ShieldCheck size={14}/> Protected by a server-side password. Your database keys are never sent to the browser.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#090b10]/95 px-5 py-4 backdrop-blur-xl md:px-9">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <Link href="/" className="mb-2 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white"><ArrowLeft size={14}/> OSA dashboard</Link>
            <h1 className="text-xl font-semibold md:text-2xl">Intelligence Review Centre</h1>
            <p className="mt-1 text-xs text-slate-500">Private collection inbox · Nothing is published automatically</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void loadItems()} disabled={loading} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh</button>
            <button onClick={signOut} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5"><LogOut size={14}/> Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 md:px-9">
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[{ label: "Loaded items", value: counts.all }, { label: "New", value: counts.fresh }, { label: "Reviewing", value: counts.reviewing }, { label: "Approved", value: counts.approved }].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><p className="text-xs text-slate-500">{stat.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{stat.value}</p></div>
          ))}
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold"><Filter size={15} className="text-[#c7f36b]"/> Review inbox</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles…" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs outline-none sm:w-56"/></div>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#11151d] px-3 text-xs text-slate-300 outline-none"><option value="all">All categories</option>{["Markets","Startups","Technology","Career","Learning"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#11151d] px-3 text-xs text-slate-300 outline-none"><option value="all">All sources</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-xl border border-white/10 bg-[#11151d] px-3 text-xs text-slate-300 outline-none">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          </div>
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-200">{error}</div>}
        {notice && <div className="mb-4 rounded-xl border border-[#c7f36b]/20 bg-[#c7f36b]/5 p-3 text-xs text-[#d8f5a0]">{notice}</div>}

        {loading ? <div className="rounded-2xl border border-white/10 p-12 text-center text-sm text-slate-400">Loading collected intelligence…</div> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-slate-500">No items match this filter.</div> : (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-[#11151d] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-300">{item.review_status.toUpperCase()}</span>
                      <span className="rounded-full border border-[#c7f36b]/20 px-2.5 py-1 text-[#d8f5a0]">Triage {triageScore(item)}/100</span>
                      {duplicateIds.has(item.id) && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-amber-200">Possible duplicate</span>}
                      {(item.category_candidates || []).map((category) => <span key={category} className="rounded-full bg-[#c7f36b]/10 px-2.5 py-1 text-[#d8f5a0]">{category}</span>)}
                      {(item.region_candidates || []).slice(0, 2).map((region) => <span key={region} className="rounded-full bg-white/5 px-2.5 py-1 text-slate-500">{region}</span>)}
                    </div>
                    <h2 className="text-base font-semibold leading-6 text-white">{item.title}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{item.description || "No description was provided by the source."}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
                      <span>{item.intelligence_sources?.name || "Unknown source"}</span>
                      {item.intelligence_sources?.trust_tier && <span className="rounded-full border border-white/10 px-2 py-0.5">Source tier {item.intelligence_sources.trust_tier}</span>}
                      <span>Published: {formatDate(item.source_published_at)}</span>
                      <span>Collected: {formatDate(item.discovered_at)}</span>
                      {item.author && <span>By {item.author}</span>}
                    </div>
                    <a href={item.canonical_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[#c7f36b] hover:underline">Open original source <ExternalLink size={13}/></a>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-36 lg:flex-col">
                    <button disabled={busyId === item.id || item.review_status === "reviewing"} onClick={() => void updateStatus(item, "reviewing")} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40">Reviewing</button>
                    <button disabled={busyId === item.id || item.review_status === "approved"} onClick={() => void updateStatus(item, "approved")} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#c7f36b] px-3 text-xs font-semibold text-[#10150a] hover:bg-[#d7ff7d] disabled:opacity-40"><Check size={13}/> Approve</button>
                    <button disabled={busyId === item.id || item.review_status === "rejected"} onClick={() => void updateStatus(item, "rejected")} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-red-400/20 px-3 text-xs text-red-300 hover:bg-red-400/5 disabled:opacity-40"><X size={13}/> Reject</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-[11px] leading-5 text-slate-600">Triage score is a rule-based sorting aid using source tier, freshness and description completeness — not a measure of truth or real-world impact. Similar headlines are flagged as possible duplicates for human checking. Showing up to 200 records per view. Approved does not publish the item.</p>
      </div>
    </main>
  );
}
