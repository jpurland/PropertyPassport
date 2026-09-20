"use client";

import { PRODUCT_CREDIT, PRODUCT_NAME } from "@/lib/brand";
import { DEMO_QUERY_HINT } from "@/data/demo-property";
import { INTENT_OPTIONS } from "@/lib/routing";
import type { UserIntent } from "@/lib/types";
import { DemoBanner } from "@/components/ui";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

export function SearchLanding({
  query,
  error,
  onQuery,
  onSearch,
}: {
  query: string;
  error: string | null;
  onQuery: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col px-5 pb-10 pt-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-champagne-dark">
        {PRODUCT_CREDIT}
      </p>
      <h1 className="mt-2 font-serif text-[2.5rem] font-semibold leading-[1.05] text-navy">
        {PRODUCT_NAME}
      </h1>
      <p className="mt-3 text-xl leading-snug text-navy/85">
        Enter an address. See the property behind the listing.
      </p>
      <p className="mt-2 text-[1.02rem] leading-relaxed text-muted">
        Informational preview — not a listing ad and not an official government record.
      </p>

      <DemoBanner>
        Address suggestions use live county address data. Reports still show one sample Boca Raton
        property. Selecting an address does not retrieve its ownership, permits, value, or other property records.
      </DemoBanner>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <label htmlFor="property-address" className="text-[0.82rem] font-semibold uppercase tracking-[0.07em] text-navy">
          Property address
        </label>
        <div className="mt-2">
          <AddressAutocomplete value={query} onChange={onQuery} error={error} />
        </div>
        <button type="submit" className="mt-3 w-full rounded-sm bg-navy py-3.5 text-lg font-semibold text-cream">
          Open sample report
        </button>
      </form>

      <p className="mt-4 text-[0.98rem] text-muted">
        Sample property: {DEMO_QUERY_HINT}, FL 33432
      </p>
    </main>
  );
}

export function IntentSelect({
  typedAddress,
  onSelect,
  onBack,
}: {
  typedAddress: string;
  onSelect: (intent: UserIntent) => void;
  onBack: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col px-5 pb-10 pt-6">
      <button type="button" className="text-left text-[0.95rem] font-semibold text-navy" onClick={onBack}>
        ← Address
      </button>
      <p className="mt-5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-champagne-dark">
        DEMO — SAMPLE DATA
      </p>
      <h1 className="mt-2 font-serif text-[2.2rem] font-semibold leading-tight text-navy">
        How should we frame this sample?
      </h1>
      <p className="mt-2 text-[1.02rem] text-muted">
        You entered “{typedAddress}”. This preview does not research that property. The next screen
        opens the sample Boca Raton file.
      </p>
      <div className="mt-5 space-y-3">
        {INTENT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="w-full rounded-md border border-navy/15 bg-paper px-4 py-3.5 text-left"
            onClick={() => onSelect(option.id)}
          >
            <span className="block font-serif text-2xl font-semibold text-navy">{option.label}</span>
            <span className="mt-1 block text-[1rem] text-muted">{option.description}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

export function ResolveScreen({ address, pcn, municipality }: { address: string; pcn: string; municipality: string }) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-5 py-16">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-champagne-dark">
        DEMO — SAMPLE DATA
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-navy">
        Opening the sample file
      </h1>
      <dl className="mt-6 space-y-3">
        <div>
          <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Sample address</dt>
          <dd className="text-xl text-navy">{address}</dd>
        </div>
        <div>
          <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Parcel / PCN</dt>
          <dd className="font-mono text-lg text-navy">{pcn}</dd>
        </div>
        <div>
          <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Municipality</dt>
          <dd className="text-xl text-navy">{municipality}</dd>
        </div>
      </dl>
      <p className="mt-6 text-muted">PCN prefix 06 would route a live file to the City of Boca Raton. This preview does not query the Property Appraiser.</p>
    </main>
  );
}
