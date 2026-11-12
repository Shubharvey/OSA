import { ArrowUpRight, Clock3 } from "lucide-react";
import type { IntelligenceItem } from "@/types/intelligence";

export function IntelligenceCard({ item, featured = false }: { item: IntelligenceItem; featured?: boolean }) {
  return (
    <article className={`group flex h-full flex-col rounded-2xl border border-white/10 bg-[#11151d] p-5 transition hover:border-[#c7f36b]/40 hover:bg-[#141a22] ${featured ? "md:p-7" : ""}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold tracking-[0.17em] text-[#c7f36b]">{item.eyebrow}</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-400">{item.signal}</span>
      </div>
      <div className="mb-2 text-xs text-slate-500">{item.category} <span className="px-1.5 text-slate-700">/</span> {item.publishedAt}</div>
      <h3 className={`max-w-2xl font-semibold leading-snug tracking-tight text-slate-100 group-hover:text-white ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}>{item.title}</h3>
      <p className="mt-3 max-w-2xl flex-1 text-sm leading-6 text-slate-400">{item.summary}</p>
      <div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-4">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-slate-300">{item.source}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600"><Clock3 size={12}/>{item.readTime}</div>
        </div>
        <a href={item.url} aria-label={`Read ${item.title}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition group-hover:border-[#c7f36b]/40 group-hover:text-[#c7f36b]"><ArrowUpRight size={17}/></a>
      </div>
    </article>
  );
}
