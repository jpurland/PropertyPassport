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
      <header className="border-b border-champagne/40 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne-dark">
            {PRODUCT_CREDIT}
          </p>
          <p className="text-sm text-muted">Palm Beach County, Florida</p>
        </div>
        <h1 className="mt-2 font-serif text-[2.6rem] font-semibold leading-tight text-navy sm:text-5xl">
          {PRODUCT_NAME}
        </h1>
        <p className="mt-1 text-xl text-navy/85 sm:text-2xl">
          Enter an address. See the property behind the listing.
        </p>
      </header>

      <div className="mt-6 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-[1.25fr_1fr_0.9fr] xl:gap-6">
        <section aria-labelledby="search-heading" className="min-w-0 rounded-lg border border-champagne/40 bg-paper p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dark">Start with a property</p>
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

        <section aria-labelledby="coverage-heading" className="min-w-0 rounded-lg border border-champagne/40 bg-paper p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dark">Inside your report</p>
          <h2 id="coverage-heading" className="mt-2 font-serif text-3xl font-semibold text-navy">One address. More context.</h2>
          <ul className="mt-4 divide-y divide-champagne/30">
            {[
              ["01", "Ownership & values", "County ownership, assessed values, and recorded sales."],
              ["02", "Permits & improvements", "The official permit portal for the property’s jurisdiction."],
              ["03", "Public schools", "District attendance areas for elementary, middle, and high school."],
              ["04", "Flood, evacuation & zoning", "Available map information and official sources to verify."],
              ["05", "Zillow & Realtor.com", "Links to explore the selected address on both sites."],
              ["06", "Your next questions", "A place to start a property conversation with Daniela."],
            ].map(([number, title, description]) => (
              <li key={number} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span aria-hidden="true" className="mt-0.5 text-xs font-semibold text-champagne-dark">{number}</span>
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-semibold text-navy">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside aria-labelledby="daniela-heading" className="min-w-0 rounded-lg border border-champagne/40 bg-paper p-5 sm:p-6 md:col-span-2 xl:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dark">Brought to you by</p>
          <div className="mt-3 grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <a
              href="https://premierestatesfl.com/?utm_source=property_passport&utm_medium=referral&utm_campaign=property_questions&utm_content=search_card"
              target="_blank"
              rel="noopener noreferrer"
              className="block self-start rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              <Image
                src="/assets/danielela-amoroso-business-card.png"
                alt="Daniela Amoroso, Realtor, Premier Real Estate LLC"
                width={1658}
                height={949}
                priority
                className="h-auto w-full rounded border border-champagne/40"
              />
              <span className="sr-only">(opens Premier Estates in a new tab)</span>
            </a>
            <div>
              <h2 id="daniela-heading" className="font-serif text-3xl font-semibold leading-tight text-navy">Questions about a property?</h2>
              <p className="mt-3 text-base leading-relaxed text-muted">Buying, selling, or planning your next move? Talk with Daniela Amoroso at Premier Estates about what matters to you.</p>
              <DanielaLink placement="search" className="mt-4 w-full bg-navy text-cream">Ask Daniela a question</DanielaLink>
              <a href="https://premierestatesfl.com/?utm_source=property_passport&utm_medium=referral&utm_campaign=property_questions&utm_content=search_explore" target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-11 items-center justify-center gap-2 text-center text-sm font-semibold text-navy underline underline-offset-4">
                Explore Premier Estates <span aria-hidden="true">↗</span><span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
        </aside>
      </div>
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
