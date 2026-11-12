"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Brain, Check, LockKeyhole, LogOut, NotebookPen, Plus, Send, ShieldCheck, Trash2, X, XCircle } from "lucide-react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type InterestSignal = {\n  id: string;\n  topic: string;\n  source: "user_selected" | "user_approved_entry" | "saved_content";\n  confidence: number;\n  status: "pending" | "approved" | "rejected";\n  created_at: string;\n};\n\ntype Entry = {
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
  const [entryPendingDelete, setEntryPendingDelete] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);\n  const [interestSignals, setInterestSignals] = useState<InterestSignal[]>([]);\n  const [newInterest, setNewInterest] = useState("");\n  const [savingInterest, setSavingInterest] = useState(false);

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

  useEffect(() => {
    if (!supabase || !session?.user) { setInterestSignals([]); return; }
    let active = true;
    supabase.from("personal_interest_signals").select("id, topic, source, confidence, status, created_at").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setMessage(error.message);
        else setInterestSignals((data ?? []) as InterestSignal[]);
      });
    return () => { active = false; };
  }, [session]);

  async function addInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user || !newInterest.trim()) return;
    setSavingInterest(true); setMessage("");
    const topic = newInterest.trim().replace(/\s+/g, " ");
    const { data, error } = await supabase.from("personal_interest_signals").insert({
      user_id: session.user.id, topic, source: "user_selected", status: "approved",
      confidence: 1, reviewed_at: new Date().toISOString(),
    }).select("id, topic, source, confidence, status, created_at").single();
    if (error) setMessage(error.code === "23505" ? "That interest is already on your list." : error.message);
    else if (data) { setInterestSignals((current) => [data as InterestSignal, ...current]); setNewInterest(""); setMessage("Interest added to your personalisation settings."); }
    setSavingInterest(false);
  }

  async function reviewInterest(id: string, status: "approved" | "rejected") {
    if (!supabase) return;
    const { data, error } = await supabase.from("personal_interest_signals").update({
      status, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", id).select("id, topic, source, confidence, status, created_at").single();
    if (error) setMessage(error.message);
    else if (data) setInterestSignals((current) => current.map((signal) => signal.id === id ? data as InterestSignal : signal));
  }

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

  async function deleteEntry() {
    if (!supabase || !entryPendingDelete || deleting) return;
    setDeleting(true);
    setMessage("");
    const { error } = await supabase.from("personal_entries").delete().eq("id", entryPendingDelete.id);
    if (error) setMessage(error.message);
    else {
      setEntries((current) => current.filter((entry) => entry.id !== entryPendingDelete.id));
      setMessage("Your entry has been permanently deleted.");
    }
    setDeleting(false);
    setEntryPendingDelete(null);
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
                <div className="mb-4 flex items-center gap-2"><Brain size={17} className="text-[#c7f36b]" /><h2 className="font-semibold">Your interests</h2></div>
                <p className="mb-4 text-xs leading-5 text-slate-500">Add topics you want OSA to prioritise. Interests you add yourself are approved immediately. Diary-based suggestions will appear here for your review before they affect recommendations.</p>
                <form onSubmit={addInterest} className="mb-4 flex gap-2">
                  <input value={newInterest} onChange={(event) => setNewInterest(event.target.value)} maxLength={80} placeholder="e.g. Investment operations" aria-label="Add an interest" className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#090b10] px-3 text-xs outline-none focus:border-[#c7f36b]/40" />
                  <button disabled={savingInterest || !newInterest.trim()} className="flex h-10 items-center gap-1 rounded-xl bg-[#c7f36b] px-3 text-xs font-semibold text-[#10150a] disabled:opacity-50"><Plus size={14} /> Add</button>
                </form>
                {interestSignals.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs leading-5 text-slate-500">No interests added yet. Your approved interests will be kept here.</p> : (
                  <div className="space-y-2">{interestSignals.map((signal) => (
                    <div key={signal.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                      <div className="min-w-0"><p className="truncate text-sm text-slate-200">{signal.topic}</p><p className="mt-1 text-[10px] text-slate-500">{signal.source === "user_selected" ? "Added by you" : signal.source === "user_approved_entry" ? "Suggested from your diary" : "From saved content"} · {signal.status === "pending" ? "Awaiting your review" : signal.status === "approved" ? "Approved" : "Not approved"}</p></div>
                      {signal.status === "pending" ? <div className="flex shrink-0 gap-1"><button type="button" onClick={() => reviewInterest(signal.id, "approved")} aria-label={`Approve ${signal.topic}`} className="rounded-lg p-2 text-[#c7f36b] hover:bg-[#c7f36b]/10"><Check size={16}/></button><button type="button" onClick={() => reviewInterest(signal.id, "rejected")} aria-label={`Reject ${signal.topic}`} className="rounded-lg p-2 text-red-300 hover:bg-red-400/10"><XCircle size={16}/></button></div> : <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${signal.status === "approved" ? "bg-[#c7f36b]/10 text-[#d8f5a0]" : "bg-white/5 text-slate-500"}`}>{signal.status === "approved" ? "Approved" : "Rejected"}</span>}
                    </div>
                  ))}</div>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11151d] p-5">
                <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Your entries</h2><span className="text-xs text-slate-500">{entries.length}</span></div>
                {entries.length === 0 ? <p className="text-sm leading-6 text-slate-500">Your space is ready. Your saved thoughts will appear here.</p> : <div className="space-y-3">{entries.map((entry) => <article key={entry.id} className="rounded-xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-[#c7f36b]">{entryTypes.find((type) => type.value === entry.entry_type)?.label ?? entry.entry_type}</p><h3 className="mt-1 font-medium">{entry.title || "Untitled entry"}</h3></div><button type="button" onClick={() => setEntryPendingDelete(entry)} aria-label={`Delete ${entry.title || "untitled entry"}`} className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-red-400/10 hover:text-red-300">Delete</button></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">{entry.body}</p><p className="mt-3 text-[10px] text-slate-600">{new Date(entry.created_at).toLocaleString()} · {entry.ai_analysis_consent ? "Analysis allowed" : "Private — not for analysis"}</p></article>)}</div>}
              </div>
              <div className="rounded-2xl border border-white/10 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold"><Brain size={16} className="text-[#c7f36b]"/> Personal intelligence, coming next</div>
                <p className="mt-2 text-xs leading-5 text-slate-500">With your permission, OSA will identify topics and goals from selected entries, let you review those insights, and use approved interests to shape your feed.</p>
              </div>
            </aside>
          </div>
        )}
      </div>

      {entryPendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setEntryPendingDelete(null);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-entry-title"
            aria-describedby="delete-entry-description"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141923] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                <Trash2 size={20} />
              </div>
              <button
                type="button"
                onClick={() => setEntryPendingDelete(null)}
                disabled={deleting}
                aria-label="Close confirmation"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="delete-entry-title" className="text-lg font-semibold text-white">Delete this entry?</h2>
            <p id="delete-entry-description" className="mt-2 text-sm leading-6 text-slate-400">
              You are about to permanently delete <span className="font-medium text-slate-200">“{entryPendingDelete.title || "Untitled entry"}”</span>. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEntryPendingDelete(null)}
                disabled={deleting}
                className="h-11 rounded-xl border border-white/10 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteEntry}
                disabled={deleting}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
