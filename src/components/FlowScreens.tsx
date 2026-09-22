"use client";

import { PRODUCT_CREDIT, PRODUCT_NAME } from "@/lib/brand";
import type { AddressSuggestion } from "@/lib/address-autocomplete";
import { INTENT_OPTIONS } from "@/lib/routing";
import type { UserIntent } from "@/lib/types";

import Image from "next/image";

import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { AskDaniela } from "@/components/AskDaniela";

export function SearchLanding({
  query,
  error,
  onQuery,
  onSearch,
  onSelectAddress,
  busy = false,
}: {
  query: string;
  error: string | null;
  onQuery: (value: string) => void;
  onSearch: () => void;
  onSelectAddress: (suggestion: AddressSuggestion) => void;
  busy?: boolean;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <header className="order-last min-w-0 flex-1 sm:order-first">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-champagne-dark">
            {PRODUCT_CREDIT}
          </p>
          <h1 className="mt-1 font-serif text-[2.35rem] font-semibold leading-[1.05] text-navy sm:text-[2.5rem]">
            {PRODUCT_NAME}
          </h1>
          <p className="mt-1.5 text-xl leading-snug text-navy/85">
            Enter an address. See the property behind the listing.
          </p>
          <p className="mt-1 text-[1.02rem] leading-relaxed text-muted">
            Informational preview — not a listing ad and not an official government record.
          </p>
        </header>
        <aside className="mx-auto w-full max-w-[16.5rem] shrink-0 sm:mx-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-champagne-dark">
            Brought to you by:
          </p>
          <a
            href="https://premierestatesfl.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            <Image
              src="/assets/danielela-amoroso-business-card.png"
              alt="Daniela Amoroso, Realtor, Premier Real Estate LLC"
              width={1658}
              height={949}
              priority
              className="h-auto w-full rounded-sm border border-champagne/40 bg-paper shadow-[0_8px_24px_rgba(21,34,56,0.08)]"
            />
            <span className="sr-only">(opens Premier Estates in a new tab)</span>
          </a>
        </aside>
      </div>

      <section className="mt-5 w-full rounded-md border border-champagne/35 bg-paper p-4 sm:p-5">
        <p className="text-[0.98rem] leading-relaxed text-navy">
          Find county ownership, values, and sale records, then check flood and evacuation maps, county zoning, zoned public schools, and the right permit portal. Explore the selected address on Zillow and Realtor.com.
        </p>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
        >
          <label htmlFor="property-address" className="text-[0.82rem] font-semibold uppercase tracking-[0.07em] text-navy">
            Property address
          </label>
          <div className="mt-1.5">
            <AddressAutocomplete value={query} onChange={onQuery} onSelect={onSelectAddress} error={error} />
          </div>
          <button type="submit" disabled={busy} className="disabled:opacity-60 mt-3.5 w-full rounded-sm bg-navy py-3.5 text-lg font-semibold text-cream">
            {busy ? "Finding matching addresses…" : "Open property report"}
          </button>
        </form>
      </section>

      <AskDaniela className="mt-5" placement="search" prompt="Have a property question before you start?" />
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
        COUNTY PROPERTY RECORD
      </p>
      <h1 className="mt-2 font-serif text-[2.2rem] font-semibold leading-tight text-navy">
        What brings you here?
      </h1>
      <p className="mt-2 text-[1.02rem] text-muted">
        Your property: {typedAddress}. We’ll retrieve its county record and highlight useful next questions.
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
