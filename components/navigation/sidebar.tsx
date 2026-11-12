"use client";

import { Activity, BriefcaseBusiness, Cpu, GraduationCap, LayoutDashboard, Rocket, Settings2 } from "lucide-react";
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
    <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-[#0c0f15] px-5 py-7 lg:flex lg:flex-col">
      <div className="mb-12 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c7f36b] text-sm font-black text-[#10150a]">O</div>
        <div>
          <div className="text-lg font-bold tracking-[0.2em]">OSA</div>
          <div className="text-[9px] tracking-[0.22em] text-slate-500">ONE STEP AHEAD</div>
        </div>
      </div>
      <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-600">YOUR INTELLIGENCE</p>
      <nav className="space-y-1">
        {links.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => onSelect(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active === label ? "bg-[#c7f36b]/10 text-[#c7f36b]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            <Icon size={17} />{label === "All" ? "Overview" : label}
            {active === label && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c7f36b]" />}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300"><Settings2 size={14}/> Personalisation</div>
        <p className="text-xs leading-5 text-slate-500">Your signal, your world. Personalised intelligence is coming soon.</p>
      </div>
    </aside>
  );
}
