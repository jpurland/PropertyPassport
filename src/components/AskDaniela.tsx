import type { ReactNode } from "react";

type Placement = "search" | "report_header" | "permits" | "schools" | "values" | "next_steps";

export function DanielaLink({ placement, children = "Ask Daniela", className = "" }: { placement: Placement; children?: ReactNode; className?: string }) {
  // Fixed referral labels only. Never append a searched address, parcel, or owner.
  const url = `https://premierestatesfl.com/?utm_source=property_passport&utm_medium=referral&utm_campaign=property_questions&utm_content=${placement}#contact`;
  return <a href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded px-4 py-2 font-semibold ${className}`}>{children} <span aria-hidden="true">↗</span><span className="sr-only"> at Premier Estates (opens in a new tab)</span></a>;
}

export function AskDaniela({ placement, prompt }: { placement: Placement; prompt: string }) {
  return <aside aria-label="Ask Daniela at Premier Estates" className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-champagne/30 pt-3">
    <div className="min-w-0"><p className="text-base text-navy">{prompt}</p><p className="text-sm text-muted">Daniela Amoroso · Premier Estates</p></div>
    <DanielaLink placement={placement} className="shrink-0 bg-navy text-cream" />
  </aside>;
}
