import type { ReactNode } from "react";

type Placement = "search" | "report_header" | "permits" | "schools" | "values" | "next_steps";

export function DanielaLink({ placement, children = "Ask Daniela", className = "" }: { placement: Placement; children?: ReactNode; className?: string }) {
  // Fixed referral labels only. Never append a searched address, parcel, or owner.
  const url = `https://premierestatesfl.com/?utm_source=property_passport&utm_medium=referral&utm_campaign=property_questions&utm_content=${placement}#contact`;
  return <a href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded px-4 py-2 font-semibold ${className}`}>{children} <span aria-hidden="true">↗</span><span className="sr-only"> at Premier Estates (opens in a new tab)</span></a>;
}

export function AskDaniela({ placement, prompt, className = "mt-4" }: { placement: Placement; prompt: string; className?: string }) {
  return <aside aria-label="Ask Daniela at Premier Estates" className={`flex flex-col gap-3 border-t border-champagne/30 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-x-6 ${className}`}>
    <div className="min-w-0"><p className="text-base leading-snug text-navy">{prompt}</p><p className="mt-0.5 text-sm text-muted">Daniela Amoroso · Premier Estates</p></div>
    <DanielaLink placement={placement} className="w-full shrink-0 justify-center bg-navy text-cream sm:w-auto" />
  </aside>;
}
