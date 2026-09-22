"use client";

import { useEffect, useRef, useState } from "react";
import { IntentSelect, SearchLanding } from "@/components/FlowScreens";
import { LivePropertyReport } from "@/components/LivePropertyReport";
import { suggestAddresses, type AddressSuggestion } from "@/lib/address-autocomplete";
import { fetchPropertyRecord, type CountyPropertyRecord } from "@/lib/property-record";
import type { UserIntent } from "@/lib/types";

type Step = "search" | "intent" | "loading" | "report";

export function PassportApp() {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [choices, setChoices] = useState<AddressSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [intent, setIntent] = useState<UserIntent>("buying");
  const [record, setRecord] = useState<CountyPropertyRecord | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  function cancel() { request.current?.abort(); request.current = null; setBusy(false); }
  function edit(value: string) {
    cancel(); setQuery(value); setSelected(null); setChoices([]); setError(null); setRecord(null);
  }
  function choose(address: AddressSuggestion) {
    cancel(); setQuery(address.address); setSelected(address); setChoices([]); setError(null); setRecord(null);
  }
  async function search() {
    if (selected) { setError(null); setStep("intent"); return; }
    if (!query.trim()) { setError("Enter a house number and street to find your property."); return; }
    cancel();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(null); setChoices([]);
    try {
      const matches = await suggestAddresses(query, controller.signal);
      if (controller.signal.aborted) return;
      setChoices(matches);
      if (!matches.length) setError("No county address match was found. Check the house number, street direction, and unit, then try again. A report needs a matched parcel.");
    } catch {
      if (!controller.signal.aborted) setError("County address search is unavailable. Please try again shortly.");
    } finally { if (request.current === controller) { setBusy(false); request.current = null; } }
  }
  async function load(nextIntent: UserIntent) {
    if (!selected) return;
    cancel();
    const controller = new AbortController(); request.current = controller;
    setIntent(nextIntent); setError(null); setRecord(null); setStep("loading"); setBusy(true);
    try {
      const result = await fetchPropertyRecord(selected, controller.signal);
      if (controller.signal.aborted) return;
      setRecord(result); setStep("report");
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "The county lookup failed. Please retry.");
    } finally { if (request.current === controller) { setBusy(false); request.current = null; } }
  }
  function startOver() { cancel(); setStep("search"); setRecord(null); setError(null); setChoices([]); }

  return <>
    {step === "search" && <>
      <SearchLanding query={query} error={error} onQuery={edit} onSelectAddress={choose} onSearch={search} busy={busy}>
      {choices.length > 0 && <section className="mt-5 border-t border-champagne/30 pt-4" aria-label="Choose the matching property">
        <h2 className="mb-2 text-lg font-semibold text-navy">Confirm your property</h2>
        <p className="mb-3 text-muted">Select the matching address, including the correct unit.</p>
        <ul className="space-y-2">{choices.map((choice) => <li key={choice.id}>
          <button type="button" className="w-full rounded border border-navy/20 bg-paper p-3 text-left text-navy hover:bg-cream-dark" onClick={() => { choose(choice); setStep("intent"); }}>{choice.address}{choices.some((other) => other.id !== choice.id && other.address === choice.address) && choice.parcelNumber ? <span className="mt-1 block text-sm text-muted">Parcel {choice.parcelNumber}</span> : null}</button>
        </li>)}</ul>
      </section>}
      </SearchLanding>
    </>}
    {step === "intent" && <IntentSelect typedAddress={query} onBack={startOver} onSelect={load} />}
    {step === "loading" && <main className="mx-auto max-w-xl px-5 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-champagne-dark">County property lookup</p>
      <h1 className="mt-2 font-serif text-3xl text-navy">{selected?.address}</h1>
      {busy && <p role="status" className="mt-5 text-lg text-navy">Retrieving this parcel’s county record… This may take up to 20 seconds.</p>}
      {error && <div role="alert" className="mt-5 rounded border border-terracotta/30 bg-paper p-4 text-terracotta"><p>{error}</p><button type="button" className="mt-3 rounded bg-navy px-5 py-3 text-paper" onClick={() => load(intent)}>Retry lookup</button></div>}
      <button type="button" className="mt-5 font-semibold text-navy underline" onClick={startOver}>← Change address</button>
    </main>}
    {step === "report" && record && <LivePropertyReport record={record} intent={intent} onStartOver={startOver} />}
  </>;
}
