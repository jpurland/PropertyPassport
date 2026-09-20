import { formatDate } from "@/lib/format";
import type { ConfidenceLevel, RecordMeta, RecordStatus } from "@/lib/types";

const STYLES: Record<RecordStatus, string> = {
  "Verified public record": "bg-sage-soft text-sage",
  "Uploaded document": "bg-slate-soft text-navy",
  "Professional verification": "bg-sage-soft text-sage",
  "Partial records retrieved": "bg-amber-soft text-amber-ink",
  "Direct municipal verification required": "bg-terracotta-soft text-terracotta",
  "No matching record located": "bg-cream-dark text-muted",
  "Official search ordered": "bg-slate-soft text-navy",
  "Official results received": "bg-sage-soft text-sage",
};

export function StatusChip({ status }: { status: RecordStatus }) {
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.05em] ${STYLES[status]}`}>
      {status}
    </span>
  );
}

export function SourceMeta({ meta }: { meta: RecordMeta }) {
  return (
    <div className="mt-3 border-t border-cream-dark/80 pt-3 text-[0.8rem] leading-snug text-muted">
      <StatusChip status={meta.status} />
      <p className="mt-2">
        <span className="font-semibold text-navy">Source.</span> {meta.source.name}
        {meta.source.type === "Prototype mock" ? " · sample fixture" : ` · ${meta.source.type}`}
      </p>
      <p>
        <span className="font-semibold text-navy">Retrieved.</span> {formatDate(meta.retrievedAt)}
      </p>
      <p>
        <span className="font-semibold text-navy">Confidence.</span> {meta.confidence}
      </p>
      {meta.source.note ? <p className="mt-1 italic">{meta.source.note}</p> : null}
    </div>
  );
}

export function ReportCard({
  id,
  title,
  kicker,
  children,
}: {
  id?: string;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-md border border-champagne/35 bg-paper p-4 sm:p-5">
      {kicker ? (
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-champagne-dark">{kicker}</p>
      ) : null}
      <h2 className="font-serif text-[1.7rem] font-semibold leading-tight text-navy">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-cream-dark/70 py-2 last:border-b-0">
      <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[1.08rem] text-navy">{value}</dd>
    </div>
  );
}

export function Callout({
  tone = "navy",
  children,
}: {
  tone?: "navy" | "warn" | "gold";
  children: React.ReactNode;
}) {
  const cls =
    tone === "warn"
      ? "border-terracotta/30 bg-terracotta-soft/60"
      : tone === "gold"
        ? "border-champagne/40 bg-cream"
        : "border-navy/15 bg-slate-soft/70";
  return <div className={`rounded-md border px-3 py-2.5 text-[0.98rem] leading-relaxed text-navy ${cls}`}>{children}</div>;
}

export function DemoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-champagne/50 bg-paper px-3 py-2.5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-champagne-dark">
        DEMO — SAMPLE DATA
      </p>
      <p className="mt-1 text-[0.98rem] leading-relaxed text-navy">{children}</p>
    </div>
  );
}

export function ConfidenceText({ level }: { level: ConfidenceLevel }) {
  return <span className="text-muted">{level}</span>;
}
