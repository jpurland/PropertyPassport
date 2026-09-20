"use client";

import type { ReactNode } from "react";
import type { CountyPropertyRecord } from "@/lib/property-record";
import type { UserIntent } from "@/lib/types";

const missing = "Not available from this source";
const money = (value: number | null) => value === null ? missing : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const intentNames: Record<UserIntent, string> = { buying: "Considering buying", selling: "Considering selling", owner: "Current owner", renovation: "Considering renovation" };
const questions: Record<UserIntent, string[]> = {
  buying: ["Ask for seller disclosures, recent inspections, and any association assessments.", "Confirm permit history, insurance quotes, and estimated taxes after purchase."],
  selling: ["Gather permits, improvement receipts, warranties, and association documents.", "Ask a real estate professional to review comparable sales and pricing."],
  owner: ["Check the county record for errors and confirm exemptions with the Property Appraiser.", "Keep inspections, maintenance records, and insurance documents together."],
  renovation: ["Confirm the permitting jurisdiction, zoning, setbacks, and association restrictions.", "Have a licensed professional assess the structure and proposed scope before estimating work."],
};
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0 border-b border-champagne/25 py-3"><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 break-words text-lg leading-snug text-navy">{children}</dd></div>;
}
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-4 rounded-lg border border-champagne/35 bg-paper p-4 sm:p-6"><h2 className="mb-2 font-serif text-3xl text-navy">{title}</h2>{children}</section>;
}
export function LivePropertyReport({ record: r, intent, onStartOver }: { record: CountyPropertyRecord; intent: UserIntent; onStartOver: () => void }) {
  const pcn = r.parcelNumber.replace(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})(\d{4})$/, "$1-$2-$3-$4-$5-$6-$7");
  return <>
    <header className="bg-navy text-cream"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-champagne">County records · {intentNames[intent]}</p><p className="font-serif text-2xl">Property Passport</p></div><button type="button" onClick={onStartOver} className="shrink-0 py-2 font-semibold text-champagne">New search</button></div></header>
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6">
      <nav aria-label="Report sections" className="flex flex-wrap gap-x-5 gap-y-2 border-b border-champagne/30 pb-3 text-base font-semibold text-navy">{[["overview", "Overview"], ["value", "County values"], ["sale", "Recorded sale"], ["research", "Still to research"], ["next", "Next steps"]].map(([id, title]) => <a key={id} href={`#${id}`} className="py-1 underline-offset-4 hover:underline">{title}</a>)}</nav>
      <div>
        <h1 className="font-serif text-3xl leading-tight text-navy sm:text-4xl">{r.address}</h1>
        <p className="mt-2 text-sm text-muted">Matched by parcel number · Retrieved {new Date(r.retrievedAt).toLocaleString("en-US")}</p>
        <p className="mt-2 text-base text-muted">A partial property report from county public data. Source update date and valuation year are not supplied; records may lag recent changes.</p>
        <a className="mt-2 inline-block font-semibold text-navy underline" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">View the county source record ↗</a>
      </div>
      <Section id="overview" title="Property overview">
        <dl className="grid gap-x-8 sm:grid-cols-2">
          <Field label="Parcel / PCN">{pcn}</Field>
          <Field label="Recorded owner name(s)">{r.ownerWithheld ? "Not displayed — source confidentiality status" : r.owners.length ? r.owners.join(" ") : missing}</Field>
          <Field label="Property use">{r.propertyUse ?? missing}</Field>
          <Field label="Subdivision">{r.subdivision ?? missing}</Field>
          <Field label="Address locality in county data">{r.locality}</Field>
          <Field label="Parcel area reported by county">{r.acres === null ? missing : `${r.acres.toLocaleString("en-US", { maximumFractionDigits: 4 })} acres`}</Field>
          <Field label="Year built / living area / beds / baths">{missing}</Field>
          <Field label="Permitting jurisdiction">{r.parcelNumber.startsWith("00") ? "Unincorporated Palm Beach County (PCN prefix 00)" : "Confirm with the county or municipality"}</Field>
        </dl>
        <p className="mt-3 text-sm text-muted">Recorded names are county entries, not a title determination. The address locality may differ from the permitting jurisdiction. Parcel area may include shared land for condominiums.</p>
      </Section>
      <Section id="value" title="County values">
        <dl className="grid gap-x-8 sm:grid-cols-3"><Field label="County market value">{money(r.countyMarketValue)}</Field><Field label="Assessed value">{money(r.assessedValue)}</Field><Field label="Taxable value">{money(r.taxableValue)}</Field></dl>
        <p className="mt-3 text-base text-muted">These are county assessment figures, not a current sale-price estimate or appraisal. Taxable value is not the tax bill. The source does not identify the valuation year.</p>
      </Section>
      <Section id="sale" title="Latest sale entry in this source">
        <dl className="grid gap-x-8 sm:grid-cols-2"><Field label="Recorded sale date">{r.saleDate ?? missing}</Field><Field label="Recorded sale price">{money(r.salePrice)}</Field><Field label="Recording book / page">{r.book && r.page ? `${r.book} / ${r.page}` : missing}</Field><Field label="Instrument code (as supplied)">{r.instrument ?? missing}</Field></dl>
        <p className="mt-3 text-sm text-muted">This is one county sale entry, not a complete ownership history. A transfer amount does not establish current market value.</p>
      </Section>
      <Section id="research" title="Still to research">
        <div className="grid gap-3 sm:grid-cols-2">{[
          ["Permits, violations, and liens", "Not connected. No conclusion can be drawn about open permits, violations, or clear title."],
          ["Flood, evacuation, and insurance", "Not connected. Flood zones, roof condition, and insurance costs have not been checked."],
          ["Tax bills and association costs", "Not connected. Tax payments, exemptions, HOA dues, and assessments have not been verified."],
          ["Building details and renovation potential", "Not connected. Living area, age, zoning, setbacks, and renovation feasibility require additional records."],
        ].map(([title, detail]) => <div key={title} className="rounded border border-navy/10 bg-cream/50 p-3"><h3 className="font-semibold text-navy">{title}</h3><p className="mt-1 text-base text-muted">{detail}</p></div>)}</div>
      </Section>
      <Section id="next" title="Useful next steps">
        <ul className="list-disc space-y-2 pl-5 text-lg text-navy">{questions[intent].map((question) => <li key={question}>{question}</li>)}</ul>
        <a href="https://pbcpao.gov/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded bg-navy px-4 py-3 font-semibold text-cream">Open Property Appraiser website ↗</a>
      </Section>
      <footer className="py-2 text-sm text-muted">By Premier Estates · Informational public-record summary. Not an official government record, title search, appraisal, or inspection.</footer>
    </main>
  </>;
}
