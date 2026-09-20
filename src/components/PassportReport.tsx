"use client";

import { DocumentUpload, MunicipalFallbackCard, NextSteps } from "@/components/Actions";
import { Callout, DemoBanner, Fact, ReportCard, SourceMeta, StatusChip } from "@/components/ui";
import { PRODUCT_CREDIT, PRODUCT_NAME } from "@/lib/brand";
import { formatDate, fullAddress, money } from "@/lib/format";
import { INTENT_OPTIONS } from "@/lib/routing";
import type {
  GeneratedQuestion,
  NextStep,
  PropertyPassport,
  ServiceRequestKind,
  UploadedDocument,
  UserIntent,
} from "@/lib/types";

const INTENT_LABEL = Object.fromEntries(INTENT_OPTIONS.map((o) => [o.id, o.label])) as Record<UserIntent, string>;

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "value", label: "Value" },
  { id: "timeline", label: "Timeline" },
  { id: "permits", label: "Permits" },
  { id: "records", label: "Records" },
  { id: "taxes", label: "Taxes" },
  { id: "storm", label: "Storm" },
  { id: "costs", label: "Costs" },
  { id: "nearby", label: "Nearby" },
  { id: "potential", label: "Potential" },
  { id: "questions", label: "Questions" },
  { id: "next", label: "Next" },
];

export function PassportReport({
  passport,
  intent,
  typedAddress,
  questions,
  nextSteps,
  documents,
  onUpload,
  onRequest,
  onStartOver,
}: {
  passport: PropertyPassport;
  intent: UserIntent;
  typedAddress: string;
  questions: GeneratedQuestion[];
  nextSteps: NextStep[];
  documents: UploadedDocument[];
  onUpload: (doc: UploadedDocument) => void;
  onRequest: (kind: ServiceRequestKind) => void;
  onStartOver: () => void;
}) {
  const o = passport.overview;
  const address = fullAddress(o.address.line1, o.address.city, o.address.state, o.address.zip);
  const v = passport.valueAndSales;
  const timeline = [
    ...passport.timeline,
    ...documents.map((doc) => ({
      id: `upload-${doc.id}`,
      kind: "Uploaded document" as const,
      date: doc.uploadedAt.slice(0, 10),
      title: doc.type,
      detail: doc.timelineNote,
      source: { name: "Browser session vault", type: "User upload" as const },
      retrievedAt: doc.uploadedAt.slice(0, 10),
      status: "Uploaded document" as const,
      confidence: "Unverified — user upload" as const,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="w-full">
      <header className="sticky top-0 z-30 border-b border-champagne/30 bg-navy py-2 text-cream">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-champagne">
              DEMO — SAMPLE DATA · {INTENT_LABEL[intent]}
            </p>
            <p className="truncate font-serif text-lg font-semibold leading-tight">{PRODUCT_NAME}</p>
          </div>
          <button type="button" className="shrink-0 text-[0.85rem] font-semibold text-champagne" onClick={onStartOver}>
            New search
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-16">
        <nav aria-label="Report sections" className="sticky top-[3.25rem] z-20 -mx-4 overflow-x-auto border-b border-champagne/30 bg-cream/95 px-4 py-1.5 backdrop-blur">
          <ul className="flex flex-wrap gap-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-sm px-2 py-1 text-[0.78rem] font-semibold text-navy hover:bg-paper">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-4 space-y-4">
          <DemoBanner>
            You typed “{typedAddress}”. This preview did not research that address. Every figure below
            is sample data for {address}. {PRODUCT_CREDIT}.
          </DemoBanner>

          <ReportCard id="overview" kicker="Section 1" title="Property overview">
            <dl>
              <Fact label="Address" value={address} />
              <Fact label="Parcel / PCN" value={<span className="font-mono">{o.pcn}</span>} />
              <Fact label="Municipality" value={`${o.municipality} (code ${o.municipalityCode})`} />
              <Fact label="Property type" value={o.propertyType} />
              <Fact label="Year built" value={o.yearBuilt} />
              <Fact label="Living area" value={`${o.livingAreaSqFt.toLocaleString()} sq ft`} />
              <Fact label="Lot size" value={`${o.lotSizeSqFt.toLocaleString()} sq ft`} />
              <Fact label="Bedrooms / bathrooms" value={`${o.bedrooms} / ${o.bathrooms}`} />
              <Fact label="Construction type" value={o.constructionType} />
              <Fact label="Zoning" value={o.zoning} />
            </dl>
            <SourceMeta meta={o} />
          </ReportCard>

          <ReportCard id="value" kicker="Section 2" title="Value and sales">
            <Callout tone="gold"><strong>These are different numbers.</strong> {v.valueDistinction}</Callout>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <ValueTile label="Assessed value" amount={v.assessedValue.value} note="Used for taxation; may be capped" />
              <ValueTile label="PAO market value" amount={v.paoMarketValue.value} note="Just value on the tax roll — not an appraisal" />
              <ValueTile label="Sample estimated range" amount={null} note={`${money(v.estimatedMarketRange.value.low)} – ${money(v.estimatedMarketRange.value.high)}`} />
            </div>
            <SourceMeta meta={v.assessedValue} />
            <h3 className="font-serif text-xl font-semibold text-navy">Prior sales</h3>
            <ul>
              {v.priorSales.map((sale) => (
                <li key={sale.date} className="border-b border-cream-dark py-2">
                  <p className="font-medium text-navy">{formatDate(sale.date)} · {sale.price ? money(sale.price) : "Price not on file"}</p>
                  <p className="text-[0.9rem] text-muted">{sale.instrument}{sale.bookPage ? ` · ${sale.bookPage}` : ""}</p>
                  <StatusChip status={sale.status} />
                </li>
              ))}
            </ul>
            <h3 className="font-serif text-xl font-semibold text-navy">Nearby comparable sales</h3>
            <p className="text-muted">Sample public-record sales — not MLS listings, not a CMA, not an appraisal.</p>
            {v.comparables.map((c) => (
              <div key={c.address} className="rounded-sm border border-cream-dark p-3">
                <p className="font-medium text-navy">{c.address}</p>
                <p>{formatDate(c.saleDate)} · {money(c.salePrice)}</p>
                <p className="text-[0.9rem] text-muted">{c.livingAreaSqFt.toLocaleString()} sq ft · built {c.yearBuilt} · {c.distanceMiles} mi</p>
                <StatusChip status={c.status} />
              </div>
            ))}
          </ReportCard>

          <ReportCard id="timeline" kicker="Section 3" title="Property timeline">
            <ol className="relative ml-2 border-l border-champagne/50 pl-5">
              {timeline.map((event) => (
                <li key={event.id} className="mb-5 last:mb-0">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-champagne-dark" />
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-champagne-dark">{formatDate(event.date)} · {event.kind}</p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-navy">{event.title}</h3>
                  <p className="mt-1">{event.detail}</p>
                  <div className="mt-2"><StatusChip status={event.status} /></div>
                </li>
              ))}
            </ol>
          </ReportCard>

          <ReportCard id="permits" kicker="Section 4" title="Permits and improvements">
            {passport.permits.map((p) => (
              <div key={p.id} className="rounded-sm border border-cream-dark p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-serif text-xl font-semibold text-navy">{p.category}</p>
                  <span className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-champagne-dark">{p.lifecycle}</span>
                </div>
                <p className="mt-1">{p.description}</p>
                <p className="text-[0.9rem] text-muted">{p.number ?? "No permit number on file"}{p.filed ? ` · Filed ${formatDate(p.filed)}` : ""}{p.closed ? ` · Closed ${formatDate(p.closed)}` : ""}</p>
                <SourceMeta meta={p} />
              </div>
            ))}
          </ReportCard>

          <ReportCard id="records" kicker="Section 5" title="Violations, liens and official records">
            <Callout tone="warn">This section is not a title search. Boca Raton’s standard permit/code search does not include financial liens.</Callout>
            {passport.officialRecords.map((r) => (
              <div key={r.id} className="rounded-sm border border-cream-dark p-3">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">{r.kind}{r.resolved ? " · resolved" : ""}</p>
                <p className="font-serif text-xl font-semibold text-navy">{r.title}</p>
                <p className="mt-1">{r.detail}</p>
                {r.amount ? <p className="text-navy">{money(r.amount)}</p> : null}
                <SourceMeta meta={r} />
              </div>
            ))}
            <MunicipalFallbackCard fallback={passport.municipalFallback} onObtain={onRequest} />
          </ReportCard>

          <ReportCard id="taxes" kicker="Section 6" title="Taxes and assessments">
            <Callout tone="warn">{passport.taxes.buyerTaxWarning}</Callout>
            <Fact label="Current tax bill" value={`${passport.taxes.currentBill.value.year} · ${money(passport.taxes.currentBill.value.amount)} · ${passport.taxes.currentBill.value.status}`} />
            <SourceMeta meta={passport.taxes.currentBill} />
            <ul>
              {passport.taxes.history.map((y) => (
                <li key={y.year} className="flex justify-between border-b border-cream-dark py-2">
                  <span>{y.year} · {y.paid ? "Paid" : "Status unknown"}</span>
                  <span className="font-medium text-navy">{money(y.billed)}</span>
                </li>
              ))}
            </ul>
            <Fact label="Exemptions" value={passport.taxes.exemptions.value.join("; ")} />
            {passport.taxes.hoa.value ? (
              <Fact label="HOA / association" value={`${passport.taxes.hoa.value.name} · ${money(passport.taxes.hoa.value.monthly)} / month`} />
            ) : null}
          </ReportCard>

          <ReportCard id="storm" kicker="Section 7" title="Flood, storm and insurance readiness">
            <Callout>{passport.floodStorm.insuranceLossDisclaimer}</Callout>
            <Fact label="FEMA flood zone" value={passport.floodStorm.femaFloodZone.value} />
            <Fact label="Hurricane evacuation zone" value={passport.floodStorm.evacuationZone.value} />
            <Fact label="Roof age" value={`${passport.floodStorm.roofAge.value.year} permit · about ${passport.floodStorm.roofAge.value.ageYears} years`} />
            <Fact label="Impact protection" value={passport.floodStorm.impactProtection.value} />
            <Fact label="Wind-mitigation document" value={passport.floodStorm.windMitigation.value} />
            <Fact label="Elevation certificate" value={passport.floodStorm.elevationCertificate.value} />
            <Fact label="Generator" value={passport.floodStorm.generator.value} />
            <ul className="list-disc space-y-1 pl-5">
              {passport.floodStorm.systemConcerns.value.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </ReportCard>

          <ReportCard id="costs" kicker="Section 8" title="Estimated ownership costs">
            <Callout tone="gold">{passport.ownershipCosts.estimateDisclaimer}</Callout>
            {([
              passport.ownershipCosts.afterPurchaseTaxes,
              passport.ownershipCosts.hoa,
              passport.ownershipCosts.insurance,
              passport.ownershipCosts.poolLandscape,
              passport.ownershipCosts.majorReplacements,
            ] as const).map((line) => (
              <div key={line.label} className="rounded-sm border border-cream-dark p-3">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-champagne-dark">Estimate</p>
                <p className="font-serif text-xl font-semibold text-navy">{line.label}</p>
                <p className="text-lg">{money(line.annualLow)}{line.annualLow !== line.annualHigh ? ` – ${money(line.annualHigh)}` : ""} / year</p>
                <p className="text-[0.9rem] text-muted">{line.notes}</p>
              </div>
            ))}
            <h3 className="font-serif text-xl font-semibold text-navy">Five-year preliminary forecast</h3>
            <p className="text-lg text-navy">{money(passport.ownershipCosts.fiveYearForecast.low)} – {money(passport.ownershipCosts.fiveYearForecast.high)} <span className="text-[0.75rem] font-semibold uppercase text-champagne-dark">estimate</span></p>
            {passport.ownershipCosts.fiveYearForecast.years.map((y) => (
              <div key={y.year} className="border-b border-cream-dark py-2">
                <p className="font-medium text-navy">{y.year} · {money(y.low)} – {money(y.high)}</p>
                <p className="text-[0.9rem] text-muted">{y.drivers}</p>
              </div>
            ))}
          </ReportCard>

          <ReportCard id="nearby" kicker="Section 9" title="Neighborhood and nearby activity">
            <Callout>{passport.neighborhood.neighborhoodRatingDisclaimer}</Callout>
            {passport.neighborhood.places.map((p) => (
              <div key={p.name} className="flex justify-between gap-3 border-b border-cream-dark py-2">
                <span>
                  <span className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">{p.kind}</span>
                  <span className="mt-0.5 block text-navy">{p.name}</span>
                </span>
                <span className="shrink-0 text-muted">{p.distanceMiles} mi</span>
              </div>
            ))}
            <h3 className="font-serif text-xl font-semibold text-navy">Assigned public schools</h3>
            {passport.neighborhood.schools.map((s) => (
              <div key={s.level} className="rounded-sm border border-cream-dark p-3">
                <p className="text-[0.75rem] font-semibold uppercase text-muted">{s.level}</p>
                <p className="text-navy">{s.name}</p>
                <p className="text-[0.9rem] text-muted">{s.notes}</p>
                <SourceMeta meta={s} />
              </div>
            ))}
            {passport.neighborhood.nearbyActivity.map((a) => (
              <div key={a.title} className="rounded-sm border border-cream-dark p-3">
                <p className="text-[0.75rem] font-semibold uppercase text-muted">{a.kind} · {a.distanceMiles} mi</p>
                <p className="font-medium text-navy">{a.title}</p>
                <p>{a.detail}</p>
              </div>
            ))}
          </ReportCard>

          <ReportCard id="potential" kicker="Section 10" title="Property potential">
            <ul className="list-disc space-y-1 pl-5">{passport.potential.renovation.map((item) => <li key={item}>{item}</li>)}</ul>
            <Fact label="Setbacks and lot coverage" value={passport.potential.setbacksAndCoverage.value} />
            <SourceMeta meta={passport.potential.setbacksAndCoverage} />
            <Fact label="Possible unpermitted improvements" value={passport.potential.possibleUnpermitted.value} />
            <ul className="list-disc space-y-1 pl-5">{passport.potential.verificationRequired.map((item) => <li key={item}>{item}</li>)}</ul>
          </ReportCard>

          <ReportCard id="questions" kicker="Section 11" title="Property-specific questions">
            {questions.map((q, i) => (
              <div key={`${q.askOf}-${i}`} className="rounded-sm border border-cream-dark p-3">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-champagne-dark">Ask the {q.askOf}</p>
                <p className="mt-1 text-navy">{q.ask}</p>
                <p className="mt-1 text-[0.9rem] text-muted">{q.why}</p>
              </div>
            ))}
          </ReportCard>

          <ReportCard id="next" kicker="Section 12" title="Recommended next steps">
            <NextSteps steps={nextSteps} onRequest={onRequest} />
          </ReportCard>

          <ReportCard id="documents" kicker="Private vault" title="Document upload">
            <DocumentUpload documents={documents} onUpload={onUpload} />
          </ReportCard>

          <section className="rounded-md border border-navy/15 bg-navy px-4 py-5 text-cream">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-champagne">Please read</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold">{PRODUCT_NAME} is informational</h2>
            <p className="mt-2 text-[1rem] text-cream/90">This review demo is not a title search, appraisal, survey, inspection, engineering report, insurance quotation, legal advice, or a guarantee that all records have been located. “Could not retrieve” is never the same as “no records exist.”</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ValueTile({ label, amount, note }: { label: string; amount: number | null; note: string }) {
  return (
    <div className="rounded-sm bg-cream px-3 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-muted">{label}</p>
      <p className="font-serif text-2xl font-semibold text-navy">{amount !== null ? money(amount) : note}</p>
      {amount !== null ? <p className="text-[0.82rem] text-muted">{note}</p> : null}
    </div>
  );
}
