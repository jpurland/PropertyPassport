"use client";

import { useEffect, useRef, useState } from "react";
import { IntentSelect, SearchLanding } from "@/components/FlowScreens";
import { LivePropertyReport } from "@/components/LivePropertyReport";
import type { AddressSuggestion } from "@/lib/address-autocomplete";
import { fetchPropertyRecord, type CountyPropertyRecord } from "@/lib/property-record";
import type { UserIntent } from "@/lib/types";

type Step = "search" | "intent" | "loading" | "report";

export function PassportApp() {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [intent, setIntent] = useState<UserIntent>("buying");
  const [record, setRecord] = useState<CountyPropertyRecord | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  function cancel() {
    request.current?.abort();
    request.current = null;
    setBusy(false);
  }

  function edit(value: string) {
    cancel();
    setQuery(value);
    setSelected(null);
    setError(null);
    setRecord(null);
  }

  function choose(address: AddressSuggestion) {
    if (address.kind !== "parcel" || !address.parcelNumber) return;
    cancel();
    setQuery(address.address);
    setSelected(address);
    setError(null);
    setRecord(null);
  }

  function search() {
    if (selected?.parcelNumber) {
      setError(null);
      setStep("intent");
      return;
    }
    if (!query.trim()) {
      setError("Enter a house number and street, or a street name, then choose a matching county address.");
      return;
    }
    setError("Choose a matching address from the suggestions so we can open the correct parcel report.");
  }

  async function load(nextIntent: UserIntent) {
    if (!selected?.parcelNumber) return;
    cancel();
    const controller = new AbortController();
    request.current = controller;
    setIntent(nextIntent);
    setError(null);
    setRecord(null);
    setStep("loading");
    setBusy(true);
    try {
      const result = await fetchPropertyRecord(selected, controller.signal);
      if (controller.signal.aborted) return;
      setRecord(result);
      setStep("report");
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "The county lookup failed. Please retry.");
      }
    } finally {
      if (request.current === controller) {
        setBusy(false);
        request.current = null;
      }
    }
  }

  function startOver() {
    cancel();
    setStep("search");
    setQuery("");
    setSelected(null);
    setRecord(null);
    setError(null);
  }

  return (
    <>
      {step === "search" && (
        <SearchLanding
          query={query}
          error={error}
          onQuery={edit}
          onSelectAddress={choose}
          onSearch={search}
          busy={busy}
        />
      )}
      {step === "intent" && (
        <IntentSelect typedAddress={query} onBack={startOver} onSelect={load} />
      )}
      {step === "loading" && (
        <main className="mx-auto max-w-xl px-5 py-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-champagne-dark">County property lookup</p>
          <h1 className="mt-2 font-serif text-3xl text-navy">{selected?.address}</h1>
          {selected?.parcelNumber ? (
            <p className="mt-2 font-mono text-sm text-muted">Parcel / PCN {selected.parcelNumber}</p>
          ) : null}
          {busy && (
            <p role="status" className="mt-5 text-lg text-navy">
              Retrieving this parcel’s county record… This may take up to 20 seconds.
            </p>
          )}
          {error && (
            <div role="alert" className="mt-5 rounded border border-terracotta/30 bg-paper p-4 text-terracotta">
              <p>{error}</p>
              <button type="button" className="mt-3 rounded bg-navy px-5 py-3 text-paper" onClick={() => load(intent)}>
                Retry lookup
              </button>
            </div>
          )}
          <button type="button" className="mt-5 font-semibold text-navy underline" onClick={startOver}>
            ← Change address
          </button>
        </main>
      )}
      {step === "report" && record && (
        <LivePropertyReport record={record} intent={intent} onStartOver={startOver} />
      )}
    </>
  );
}
