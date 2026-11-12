"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Brain, LockKeyhole, LogOut, NotebookPen, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type Entry = {
  id: string;
  title: string;
  body: string;
  entry_type: string;
  ai_analysis_consent: boolean;
  created_at: string;
};

const entryTypes = [
  { value: "reflection", label: "Thought / reflection" },
  { value: "idea", label: "Idea" },
  { value: "plan", label: "Plan" },
  { value: "learning_goal", label: "Skill to develop" },
  { value: "experience", label: "Experience" },
];

export default function MySpacePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [entryType, setEntryType] = useState("reflection");
  const [analysisConsent, setAnalysisConsent] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setEntries([]);
      return;
    }
    let active = true;
    supabase.from("personal_entries")
      .select("id, title, body, entry_type, ai_analysis_consent, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setMessage(error.message);
        else setEntries((data ?? []) as Entry[]);
      });
    return () => { active = false; };
  }, [session]);

  async function requestSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/my-space` },
    });
    if (error) setMessage(error.message);
    else setEmailSent(true);
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user || !body.trim()) return;
    setSaving(true);
    setMessage("");
    const { data, error } = await supabase.from("personal_entries").insert({
      user_id: session.user.id,
      title: title.trim(),
      body: body.trim(),
      entry_type: entryType,
      ai_analysis_consent: analysisConsent,
    }).select("id, title, body, entry_type, ai_analysis_consent, created_at").single();

    if (error) setMessage(error.message);
    else if (data) {
      setEntries((current) => [data as Entry, ...current]);
      setTitle("");
      setBody("");
      setEntryType("reflection");
      setAnalysisConsent(false);
      setMessage("Your private note has been saved.");
    }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("personal_entries").delete().eq("id", id);
    if (error) setMessage(error.message);
    else setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-slate-100">
      <header className="border-b border-white/10 bg-[#0c0f15]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back to OSA</Link>
          {session && <button onClick={() => supabase?.auth.signOut()} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"><LogOut size={15}/> Sign out</button>}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 md:py-14">
        <div className="mb-9 max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-[#c7f36b]"><NotebookPen size={14}/> YOUR PERSONAL SPACE</div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">A space for your thinking.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Capture thoughts, experiences, plans and skills you want to develop. Your entries are private to your account.</p>
        </div>

        {!supabase && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-200">Supabase is not configured. Add the project environment variables to enable My Space.</div>}
        {checking && <div className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">Checking your sign-in…</div>}

        {!checking && supabase && !session && (
          <section className="max-w-lg rounded-2xl border border-white/10 bg-[#11151d] p-6 md:p-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#c7f36b]/10 text-[#c7f36b]"><LockKeyhole size={20}/></div>
            <h2 className="text-xl font-semibold">Sign in to your private space</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">We'll email you a secure sign-in link. No password needed.</p>
            {emailSent ? (
              <div className="mt-6 rounded-xl border border-[#c7f36b]/20 bg-[#c7f36b]/5 p-4 text-sm text-[#d8f5a0]">Check your inbox for the sign-in link. Open it on this device to continue to My Space.</div>
            ) : (
              <form onSubmit={requestSignIn} className="mt-6 space-y-3">
                <label className="block text-xs text-slate-400" htmlFor="email">Email address</label>
                <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none focus:border-[#c7f36b]/50"/>
                <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c7f36b] text-sm font-semibold text-[#10150a] hover:bg-[#d4fa82]"><Send size={15}/> Email me a sign-in link</button>
              </form>
            )}
          </section>
        )}

        {!checking && session && (
          <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-2xl border border-white/10 bg-[#11151d] p-5 md:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c7f36b]/10 text-[#c7f36b]"><BookOpen size={19}/></div>
                <div><h2 className="font-semibold">New entry</h2><p className="mt-1 text-xs text-slate-500">Write freely. You decide what gets analysed.</p></div>
              </div>
              <form onSubmit={saveEntry} className="space-y-4">
                <div>
                  <label htmlFor="entry-type" className="mb-2 block text-xs text-slate-400">What is this about?</label>
                  <select id="entry-type" value={entryType} onChange={(event) => setEntryType(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#090b10] px-3 text-sm outline-none"><option value="reflection">Thought / reflection</option><option value="idea">Idea</option><option value="plan">Plan</option><option value="learning_goal">Skill to develop</option><option value="experience">Experience</option></select>
                </div>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this note a title (optional)" className="h-11 w-full rounded-xl border border-white/10 bg-[#090b10] px-3 text-sm outline-none focus:border-[#c7f36b]/40"/>
                <textarea required minLength={1} maxLength={20000} rows={9} value={body} onChange={(event) => setBody(event.target.value)} placeholder="What's on your mind? Write about an idea, a plan, something you experienced, or a skill you want to build…" className="w-full resize-y rounded-xl border border-white/10 bg-[#090b10] p-4 text-sm leading-6 outline-none placeholder:text-slate-600 focus:border-[#c7f36b]/40"/>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-4">
                  <input type="checkbox" checked={analysisConsent} onChange={(event) => setAnalysisConsent(event.target.checked)} className="mt-1 accent-[#c7f36b]"/>
                  <span><span className="block text-sm font-medium text-slate-200">Allow OSA to analyse this entry</span><span className="mt-1 block text-xs leading-5 text-slate-500">Optional. If enabled, OSA may use this entry to identify interests and improve your recommendations when the analysis feature is introduced. This does not publish your entry.</span></span>
                </label>
                <button disabled={saving || !body.trim()} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c7f36b] text-sm font-semibold text-[#10150a] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save private entry"} <Send size={15}/></button>
              </form>
              {message && <p role="status" className="mt-4 text-xs text-slate-400">{message}</p>}
            </section>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-[#c7f36b]/15 bg-[#c7f36b]/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#d8f5a0]"><ShieldCheck size={17}/> Private by design</div>
                <p className="mt-2 text-xs leading-5 text-slate-400">Your notes are protected by Supabase Row Level Security. Only your signed-in account can read, change or delete them. AI analysis is opt-in per entry and is not active yet.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11151d] p-5">
                <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Your entries</h2><span className="text-xs text-slate-500">{entries.length}</span></div>
                {entries.length === 0 ? <p className="text-sm leading-6 text-slate-500">Your space is ready. Your saved thoughts will appear here.</p> : <div className="space-y-3">{entries.map((entry) => <article key={entry.id} className="rounded-xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-[#c7f36b]">{entryTypes.find((type) => type.value === entry.entry_type)?.label ?? entry.entry_type}</p><h3 className="mt-1 font-medium">{entry.title || "Untitled entry"}</h3></div><button onClick={() => deleteEntry(entry.id)} className="text-xs text-slate-500 hover:text-red-300">Delete</button></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">{entry.body}</p><p className="mt-3 text-[10px] text-slate-600">{new Date(entry.created_at).toLocaleString()} · {entry.ai_analysis_consent ? "Analysis allowed" : "Private — not for analysis"}</p></article>)}</div>}
              </div>
              <div className="rounded-2xl border border-white/10 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold"><Brain size={16} className="text-[#c7f36b]"/> Personal intelligence, coming next</div>
                <p className="mt-2 text-xs leading-5 text-slate-500">With your permission, OSA will identify topics and goals from selected entries, let you review those insights, and use approved interests to shape your feed.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
