"use client";

import { useEffect, useState } from "react";
import { fetchPropertyPoint, fetchSchools, SCHOOL_DISTRICT, SCHOOL_FINDER, type SchoolResult } from "@/lib/property-research";
import { AskDaniela } from "@/components/AskDaniela";

type State = { status: "loading" } | { status: "ready"; result: SchoolResult } | { status: "error"; message: string };

export function PropertySchools({ parcel }: { parcel: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const point = await fetchPropertyPoint(parcel, controller.signal);
        const result = await fetchSchools(point, controller.signal);
        if (!controller.signal.aborted) setState({ status: "ready", result });
      } catch (error) {
        if (!controller.signal.aborted) setState({ status: "error", message: error instanceof Error ? error.message : "The school lookup is unavailable. Please retry." });
      }
    }
    void load();
    return () => controller.abort();
  }, [parcel, attempt]);
  return <section id="schools" className="scroll-mt-4 rounded-lg border border-champagne/35 bg-paper p-4 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-widest text-champagne-dark">Public school attendance zones</p>
    <h2 className="mt-1 font-serif text-3xl text-navy">Schools for this property</h2>
    <p className="mt-2 text-lg font-semibold text-navy">District: <a href="https://www.palmbeachschools.org/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{SCHOOL_DISTRICT}</a></p>
    <div aria-live="polite">
      {state.status === "loading" && <p className="mt-4 text-base text-muted">Checking elementary, middle, and high school attendance zones…</p>}
      {state.status === "error" && <div className="mt-4 rounded border border-terracotta/30 p-3"><p className="font-semibold text-terracotta">School assignment not confirmed</p><p className="mt-1 text-base text-navy">{state.message}</p><button type="button" onClick={() => { setState({ status: "loading" }); setAttempt((n) => n + 1); }} className="mt-2 min-h-11 font-semibold text-navy underline">Retry school lookup</button></div>}
      {state.status === "ready" && <>
        <p className="mt-2 text-sm text-muted">Boundary school year: {state.result.schoolYear ?? "not supplied by source"}{state.result.sourceUpdated ? ` · Layer updated ${state.result.sourceUpdated}` : ""}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">{state.result.schools.map((school) => <article key={school.level} className="min-w-0 rounded border border-navy/10 bg-cream/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{school.level}</h3>
          <p className="mt-2 break-words text-xl font-semibold text-navy">{school.name ?? "Not supplied — confirm with district"}</p>
          {school.address && <p className="mt-2 text-base text-muted">{school.address}</p>}
          {school.website && <a href={school.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-navy underline underline-offset-4">School website ↗</a>}
        </article>)}</div>
        {state.result.note && <p className="mt-3 whitespace-pre-line rounded border border-champagne/35 p-3 text-base text-navy"><strong>District assignment note: </strong>{state.result.note}</p>}
        {state.result.directoryUnavailable && <p className="mt-3 text-sm text-muted">School names loaded; campus addresses and website links are temporarily unavailable.</p>}
        <p className="mt-3 text-xs text-muted">Retrieved {new Date(state.result.retrievedAt).toLocaleString("en-US")} · <a href={state.result.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">View district attendance record ↗</a>{state.result.directoryUrl && <> · <a href={state.result.directoryUrl} target="_blank" rel="noopener noreferrer" className="underline">View school directory source ↗</a></>}</p>
      </>}
    </div>
    <p className="mt-4 text-sm text-muted">Matched to the county address point for this parcel. Boundaries, grade-specific assignments, choice programs, and transfers can affect enrollment. Confirm the address and school year with the district before enrolling or making a property decision.</p>
    <a href={SCHOOL_FINDER} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded bg-navy px-4 py-2 font-semibold text-cream">Confirm with Find My School ↗</a>
    <AskDaniela placement="schools" prompt="How do these schools fit your home search?" />
  </section>;
}
