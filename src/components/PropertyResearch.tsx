"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchPropertyPoint, fetchMapResult, permitSource, zillowSearchUrl, RESEARCH_SOURCES, type MapKind, type MapResult, type PropertyPoint } from "@/lib/property-research";
import type { CountyPropertyRecord } from "@/lib/property-record";

const card = "scroll-mt-4 rounded-lg border border-champagne/35 bg-paper p-4 sm:p-6";
const link = "inline-flex min-h-11 items-center rounded bg-navy px-4 py-2 font-semibold text-cream";
function External({ href, children, button = false }: { href: string; children: ReactNode; button?: boolean }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={button ? link : "inline-block py-2 font-semibold text-navy underline underline-offset-4"}>{children} ↗</a>;
}

export function PermitResearch({ record: r }: { record: CountyPropertyRecord }) {
  const source = permitSource(r.parcelNumber);
  const [copied, setCopied] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(r.parcelNumber); setCopied("Parcel number copied."); }
    catch { setCopied("Select and copy the parcel number above."); }
  }
  return <section id="permits" className={card}>
    <p className="text-xs font-semibold uppercase tracking-widest text-champagne-dark">Official permit lookup · Results open on source website</p>
    <h2 className="mt-1 font-serif text-3xl text-navy">Permits & inspections</h2>
    <p className="mt-2 font-semibold text-navy">{source.jurisdiction}</p>
    <p className="mt-1 text-base text-muted">Jurisdiction is based on the parcel prefix, not the mailing city. Confirm any annexation or older records with the permitting office.</p>
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded border border-navy/10 bg-cream/50 p-3">
      <p className="min-w-0 text-navy">Parcel / PCN <span className="block select-all break-all font-mono text-lg">{r.parcelNumber}</span></p>
      <button type="button" onClick={copy} className="min-h-11 rounded border border-navy/25 px-3 py-2 font-semibold text-navy">Copy parcel number</button>
      <span role="status" className="text-sm text-muted">{copied}</span>
    </div>
    <p className="my-3 text-base text-navy">{source.url
      ? r.parcelNumber.startsWith("00") ? "Open this parcel in county ePZB to review permit numbers, descriptions, status, contractors, and inspection records. Complete any verification requested by the county."
        : "Open Boca eHub from the city’s page, then search public records using this address or parcel number."
      : "This municipality’s permit search is not connected yet. Confirm the municipality on the Property Appraiser record and use its building department’s records portal."}</p>
    <External button href={source.url ?? `https://pbcpao.gov/Property/Details?parcelId=${r.parcelNumber}`}>{source.url ? `Open ${source.name}${r.parcelNumber.startsWith("00") ? " for this parcel" : ""}` : "Confirm municipality"}</External>
    <p className="mt-3 text-sm text-muted">Permit records have not been imported into this report. An empty search is not proof of no permits, no violations, or clear title.</p>
    <details className="mt-4 border-t border-champagne/25 pt-3 text-navy"><summary className="cursor-pointer py-1 font-semibold">What should I check in the permit record?</summary>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-base"><li>Match the address and parcel before reviewing any work.</li><li>Look for roof, windows, HVAC, electrical, plumbing, additions, and pool work.</li><li>Compare issued permits with final inspections and closure status. An issued permit alone does not confirm completed work.</li><li>Ask the permitting office about expired, open, older, or missing records. Code enforcement and financial liens require separate searches.</li></ul>
    </details>
  </section>;
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; result: MapResult };
const initial = (): Record<MapKind, State> => ({ flood: { status: "loading" }, evacuation: { status: "loading" }, zoning: { status: "loading" } });
const config: Record<MapKind, { title: string; empty: string; note: string }> = {
  flood: { title: "FEMA flood zone", empty: "No FEMA zone returned at the address point. Check the official map for coverage.", note: "Mapped flood hazard at one address point, not a determination for the entire parcel. Any zone can experience flooding; confirm insurance requirements with your lender or insurer." },
  evacuation: { title: "Hurricane evacuation zone", empty: "No mapped evacuation zone returned at the address point.", note: "This is a planning map, not a current evacuation order. Follow official instructions; mobile and manufactured homes may have separate evacuation guidance." },
  zoning: { title: "County zoning district", empty: "No county zoning district returned at the address point. Confirm jurisdiction with the planning office.", note: "Unincorporated county zoning only. A district label does not establish buildable area, setbacks, permitted work, or association restrictions." },
};

export function PropertyMaps({ parcel }: { parcel: string }) {
  const [states, setStates] = useState(initial);
  const [point, setPoint] = useState<PropertyPoint | null>(null);
  const [attempt, setAttempt] = useState(0);
  const kinds: MapKind[] = parcel.startsWith("00") ? ["flood", "evacuation", "zoning"] : ["flood", "evacuation"];
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      let location: PropertyPoint;
      try { location = await fetchPropertyPoint(parcel, controller.signal); }
      catch (error) {
        if (!controller.signal.aborted) {
          const failure: State = { status: "error", message: error instanceof Error ? error.message : "The parcel location could not be checked." };
          setStates({ flood: failure, evacuation: failure, zoning: failure });
        }
        return;
      }
      if (controller.signal.aborted) return;
      setPoint(location);
      const requested: MapKind[] = parcel.startsWith("00") ? ["flood", "evacuation", "zoning"] : ["flood", "evacuation"];
      await Promise.all(requested.map(async (kind) => {
        try {
          const result = await fetchMapResult(kind, location, parcel, controller.signal);
          if (!controller.signal.aborted) setStates((previous) => ({ ...previous, [kind]: { status: "ready", result } }));
        } catch (error) {
          if (!controller.signal.aborted) setStates((previous) => ({ ...previous, [kind]: { status: "error", message: error instanceof Error ? error.message : "This source could not be checked." } }));
        }
      }));
    }
    void load();
    return () => controller.abort();
  }, [parcel, attempt]);
  const loading = kinds.some((kind) => states[kind].status === "loading");
  return <section id="maps" className={card}>
    <h2 className="font-serif text-3xl text-navy">Flood, evacuation & zoning</h2>
    <p className="mt-2 text-base text-muted">Official map layers checked at the county address point matched to your parcel. Boundaries can cross a property; these results do not cover its full footprint.</p>
    <div className="mt-4 grid gap-3 md:grid-cols-3">{(["flood", "evacuation", "zoning"] as const).map((kind) => {
      const state = states[kind], c = config[kind];
      const unsupported = kind === "zoning" && !parcel.startsWith("00");
      return <article key={kind} className="min-w-0 rounded border border-navy/10 bg-cream/40 p-4">
        <h3 className="text-lg font-semibold text-navy">{c.title}</h3>
        <div aria-live="polite" className="mt-3 text-navy">
          {unsupported ? <p>Municipal zoning is not connected. Check your city’s planning department.</p>
            : state.status === "loading" ? <p>Checking official source…</p>
            : state.status === "error" ? <><p className="font-semibold text-terracotta">Not checked</p><p className="mt-1 text-base text-muted">{state.message}</p></>
            : <>{state.result.rows.length ? <ul className="space-y-3">{state.result.rows.map((row, i) => <li key={i}><p className="text-xl font-semibold">{row.heading}</p>{row.detail && <p className="mt-1 text-sm">{row.detail}</p>}</li>)}</ul> : <p>{c.empty}</p>}
              <p className="mt-3 text-xs text-muted">Retrieved {new Date(state.result.retrievedAt).toLocaleString("en-US")}</p></>}
        </div>
        <p className="mt-3 text-sm text-muted">{c.note}</p>
        {!unsupported && <External href={state.status === "ready" ? state.result.sourceUrl : RESEARCH_SOURCES[kind]}>View source {state.status === "ready" ? "result" : "layer"}</External>}
      </article>;
    })}</div>
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
      <External href="https://msc.fema.gov/portal/home">Open FEMA map search</External>
      {point && <External href={point.sourceUrl}>View matched county location</External>}
      {!loading && kinds.some((kind) => states[kind].status === "error") && <button type="button" onClick={() => { setStates(initial()); setPoint(null); setAttempt((v) => v + 1); }} className="min-h-11 font-semibold text-navy underline">Retry map lookups</button>}
    </div>
  </section>;
}

export function ZillowCard({ address }: { address: string }) {
  return <section id="zillow" className={card}>
    <p className="text-xs font-semibold uppercase tracking-widest text-champagne-dark">External property search</p>
    <h2 className="mt-1 font-serif text-3xl text-navy">Explore this address on Zillow</h2>
    <p className="mt-2 break-words text-lg text-navy">{address}</p>
    <p className="mb-4 mt-2 text-base text-muted">Look for photos, listing history, and any estimate Zillow provides. Confirm the address and unit on Zillow before using the result.</p>
    <External button href={zillowSearchUrl(address)}>Search this address on Zillow</External>
    <p className="mt-3 text-sm text-muted">Opens Zillow in a new tab. Zillow data and Zestimates are not imported into this report. This is an address search link, not an official Zillow widget.</p>
  </section>;
}

export function AdditionalSources({ record: r }: { record: CountyPropertyRecord }) {
  return <section id="sources" className={card}>
    <h2 className="font-serif text-3xl text-navy">More official records</h2>
    <p className="mt-2 text-base text-muted">These links open official websites for further research. Their records have not been imported or verified in this report.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <article className="rounded border border-navy/10 p-4"><h3 className="text-lg font-semibold text-navy">Building details & exemptions</h3><p className="mt-2 text-base text-muted">Review the full Property Appraiser record for this parcel, including available building information and exemptions.</p><External href={`https://pbcpao.gov/Property/Details?parcelId=${r.parcelNumber}`}>Open this parcel’s Property Appraiser page</External></article>
      <article className="rounded border border-navy/10 p-4"><h3 className="text-lg font-semibold text-navy">Tax bills & payment history</h3><p className="mt-2 text-base text-muted">Use the Tax Collector’s property tax resources and payment portal. Match the parcel number before reviewing a bill or balance.</p><External href="https://www.pbctax.gov/taxes/property-tax/">Open Tax Collector property tax resources</External></article>
    </div>
  </section>;
}
