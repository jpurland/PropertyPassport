"use client";

import { PRODUCT_CREDIT, PRODUCT_NAME } from "@/lib/brand";
import type { AddressSuggestion } from "@/lib/address-autocomplete";
import { INTENT_OPTIONS } from "@/lib/routing";
import type { UserIntent } from "@/lib/types";

import Image from "next/image";
import type { ReactNode } from "react";

import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { AskDaniela, DanielaLink } from "@/components/AskDaniela";

export function SearchLanding({
  query,
  error,
  onQuery,
  onSearch,
  onSelectAddress,
  busy = false,
  children,
}: {
  query: string;
  error: string | null;
  onQuery: (value: string) => void;
  onSearch: () => void;
  onSelectAddress: (suggestion: AddressSuggestion) => void;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-8">
          <header className="min-w-0 lg:col-start-1 lg:row-start-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne-dark">{PRODUCT_CREDIT}</p>
            <h1 className="mt-2 font-serif text-[2.6rem] font-semibold leading-tight text-navy sm:text-5xl">{PRODUCT_NAME}</h1>
            <p className="mt-2 text-xl text-navy/85 sm:text-2xl">Enter an address. See the property behind the listing.</p>
          </header>
        <section aria-labelledby="search-heading" className="min-w-0 rounded-lg border border-champagne/40 bg-paper p-5 sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dark">Palm Beach County · Start with a property</p>
          <h2 id="search-heading" className="mt-2 font-serif text-3xl font-semibold text-navy">What would you like to know?</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Find the county record, explore local sources, and bring your questions to Daniela.
          </p>
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
          >
            <label htmlFor="property-address" className="text-sm font-semibold uppercase tracking-[0.07em] text-navy">
              Property address
            </label>
            <div className="mt-2">
              <AddressAutocomplete value={query} onChange={onQuery} onSelect={onSelectAddress} error={error} />
            </div>
            <button type="submit" disabled={busy} className="mt-4 min-h-12 w-full rounded bg-navy px-3 py-3 text-lg font-semibold text-cream transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60">
              {busy ? "Finding matching addresses…" : "Open property report"}
            </button>
          </form>
          {children}
          <AskDaniela className="mt-5" placement="search" prompt="Have a question before you start?" />
        </section>
          <aside aria-label="Daniela Amoroso at Premier Real Estate" className="min-w-0 rounded-lg border border-champagne/40 bg-paper p-4 sm:p-5 lg:col-start-1 lg:row-start-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dark">Brought to you by:</p>
            <div className="mt-3 grid items-center gap-4 sm:grid-cols-[1.5fr_1fr]">
              <a href="https://premierestatesfl.com" target="_blank" rel="noopener noreferrer" className="block rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
                <Image src="/assets/danielela-amoroso-business-card.png" alt="Daniela Amoroso, Realtor, Premier Real Estate LLC" width={1658} height={949} priority className="h-auto w-full rounded border border-champagne/40" />
                <span className="sr-only">(opens Premier Real Estate in a new tab)</span>
              </a>
              <div>
                <h2 className="font-serif text-2xl font-semibold leading-tight text-navy">Your property. Your questions.</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">Talk with Daniela about buying, selling, or your next move.</p>
                <DanielaLink placement="search" className="mt-3 w-full bg-navy text-cream">Ask Daniela</DanielaLink>
                <a href="https://premierestatesfl.com/?utm_source=property_passport&utm_medium=referral&utm_campaign=property_questions&utm_content=search_explore" target="_blank" rel="noopener noreferrer" className="mt-1 flex min-h-11 items-center gap-1 text-sm font-semibold text-navy underline underline-offset-4">
                  Explore Premier Real Estate <span aria-hidden="true">↗</span><span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </div>
          </aside>

      </div>

        <section aria-labelledby="coverage-heading" className="mt-6 border-t border-champagne/40 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dark">Inside your report</p>
          <h2 id="coverage-heading" className="mt-2 font-serif text-3xl font-semibold text-navy">One address. More context.</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["01", "Ownership & values", "County ownership, assessed values, and recorded sales."],
              ["02", "Permits & improvements", "The official permit portal for the property’s jurisdiction."],
              ["03", "Public schools", "District attendance areas for elementary, middle, and high school."],
              ["04", "Flood, evacuation & zoning", "Available map information and official sources to verify."],
              ["05", "Zillow & Realtor.com", "Links to explore the selected address on both sites."],
              ["06", "Your next questions", "A place to start a property conversation with Daniela."],
            ].map(([number, title, description]) => (
              <li key={number} className="flex gap-3 rounded-lg border border-champagne/35 bg-paper p-4">
                <span aria-hidden="true" className="mt-0.5 text-xs font-semibold text-champagne-dark">{number}</span>
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-semibold text-navy">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

      <p className="mt-5 border-t border-champagne/40 pt-4 text-sm leading-relaxed text-muted">
        Informational preview — not a listing ad and not an official government record. Availability varies by property and source. Permit and listing links open external sites; verify records and school assignments with the responsible agency.
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
