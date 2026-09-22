import type { ReactNode } from "react";

type Placement = "search" | "report_header" | "permits" | "schools" | "values" | "next_steps";

const DANIELA_PHONE = "tel:+19544614002";

export function DanielaLink({ placement, children = "Ask Daniela", className = "" }: { placement: Placement; children?: ReactNode; className?: string }) {
  void placement;
  return (
    <a href={DANIELA_PHONE} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded px-4 py-2 font-semibold ${className}`}>
      {children}
      <span className="sr-only"> at Premier Real Estate (calls 954-461-4002)</span>
    </a>
  );
}

export function AskDaniela({ placement, prompt, className = "mt-4" }: { placement: Placement; prompt: string; className?: string }) {
  return (
    <aside aria-label="Ask Daniela at Premier Real Estate" className={`flex flex-col gap-3 border-t border-champagne/30 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-x-6 ${className}`}>
      <div className="min-w-0">
        <p className="text-base leading-snug text-navy">{prompt}</p>
        <p className="mt-0.5 text-sm text-muted">Daniela Amoroso · Premier Real Estate</p>
      </div>
      <DanielaLink placement={placement} className="w-full shrink-0 justify-center bg-navy text-cream sm:w-auto" />
    </aside>
  );
}
