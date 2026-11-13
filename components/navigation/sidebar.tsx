"use client";

import { Activity, BriefcaseBusiness, Cpu, GraduationCap, LayoutDashboard, NotebookPen, Rocket, Settings2, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import type { Category } from "@/types/intelligence";

const links: { label: Category; icon: typeof LayoutDashboard }[] = [
  { label: "All", icon: LayoutDashboard },
  { label: "Markets", icon: Activity },
  { label: "Startups", icon: Rocket },
  { label: "Technology", icon: Cpu },
  { label: "Career", icon: BriefcaseBusiness },
  { label: "Learning", icon: GraduationCap },
];

export function Sidebar({ active, onSelect }: { active: Category; onSelect: (category: Category) => void }) {
  return (
    <>
      <nav aria-label="Mobile navigation" className="flex w-full items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#0c0f15] px-4 py-3 lg:hidden">
        {links.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => onSelect(label)} aria-current={active === label ? "page" : undefined} className={"flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs transition " + (active === label ? "border-[#c7f36b] bg-[#c7f36b] font-semibold text-[#10150a]" : "border-white/10 text-slate-400")}>
            <Icon size={14}/>{label === "All" ? "For you" : label}
          </button>
        ))}
        <Link href="/my-space" className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-400"><NotebookPen size={14}/> My Space</Link>
        <Link href="/review" className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-400"><ClipboardCheck size={14}/> Review</Link>
      </nav>
      <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-[#0c0f15] px-5 py-7 lg:flex lg:flex-col">
        <div className="mb-12 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c7f36b] text-sm font-black text-[#10150a]">O</div>
          <div><div className="text-lg font-bold tracking-[0.2em]">OSA</div><div className="text-[9px] tracking-[0.22em] text-slate-500">ONE STEP AHEAD</div></div>
        </div>
        <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-600">YOUR INTELLIGENCE</p>
        <nav className="space-y-1">
          {links.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => onSelect(label)} className={"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition " + (active === label ? "bg-[#c7f36b]/10 text-[#c7f36b]" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
              <Icon size={17}/>{label === "All" ? "Overview" : label}
              {active === label && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c7f36b]"/>}
            </button>
          ))}
        </nav>
        <p className="mb-3 mt-9 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-600">YOUR PERSONAL SPACE</p>
        <Link href="/my-space" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"><NotebookPen size={17}/> My Space</Link>
        <Link href="/review" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"><ClipboardCheck size={17}/> Review Centre</Link>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300"><Settings2 size={14}/> Personalisation</div>
          <p className="text-xs leading-5 text-slate-500">Your signal, your world. Personalised intelligence is coming soon.</p>
        </div>
      </aside>
    </>
  );
}
