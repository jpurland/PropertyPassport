"use client";

import { useState } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { requestCopy } from "@/lib/routing";
import type {
  DocumentType,
  MunicipalFallback as Fallback,
  NextStep,
  ServiceCompany,
  ServiceRequest,
  ServiceRequestKind,
  UploadedDocument,
} from "@/lib/types";

export const SERVICE_REQUESTS: { kind: ServiceRequestKind; label: string; detail: string }[] = [
  { kind: "downloadable-report", label: "Downloadable report", detail: "A formatted copy — not generated in this preview." },
  { kind: "professional-review", label: "Professional property review", detail: "A practitioner walks the findings with you." },
  { kind: "municipal-records", label: "Official municipal-record retrieval", detail: "Order the city’s paid search." },
  { kind: "market-value-review", label: "Market-value review", detail: "Not an appraisal." },
  { kind: "renovation-potential", label: "Renovation-potential review", detail: "Setbacks, coverage, and permits." },
  { kind: "home-management-plan", label: "Home-management plan", detail: "Transfer the file into Home Command later." },
];

const DOC_TYPES: DocumentType[] = [
  "Seller disclosure",
  "Inspection report",
  "Survey",
  "Title commitment",
  "HOA/condo documents",
  "Association budget",
  "Reserve study",
  "Milestone inspection",
  "Elevation certificate",
  "Wind-mitigation report",
  "Warranties and receipts",
];

export function MunicipalFallbackCard({
  fallback,
  onObtain,
}: {
  fallback: Fallback;
  onObtain: (kind: ServiceRequestKind) => void;
}) {
  const [copied, setCopied] = useState(false);
  const m = fallback.municipality;
  const letter = requestCopy(fallback.propertyAddress, fallback.pcn, m.name, m.department);

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div id="municipal-fallback" className="scroll-mt-28 rounded-md border border-terracotta/35 bg-terracotta-soft/40 p-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-terracotta">Municipal fallback</p>
      <p className="mt-2 text-[1.02rem] leading-relaxed text-navy">{fallback.message}</p>
      <dl className="mt-3 space-y-2 text-[1rem]">
        <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Municipality</dt><dd className="text-navy">{m.name}</dd></div>
        <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Department</dt><dd className="text-navy">{m.department}</dd></div>
        <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Phone</dt><dd className="text-navy">{m.phone}</dd></div>
        <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Email</dt><dd className="break-all text-navy">{m.email}</dd></div>
        <div>
          <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Official website</dt>
          <dd>
            <a className="text-navy underline decoration-champagne underline-offset-2" href={m.website}>{m.website.replace("https://", "")}</a>
            <span className="block text-muted">{m.portalName}</span>
          </dd>
        </div>
        <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Known fee</dt><dd className="text-navy">{m.knownFee}</dd></div>
        <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Property address</dt><dd className="text-navy">{fallback.propertyAddress}</dd></div>
        <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted">Parcel / PCN</dt><dd className="font-mono text-[0.95rem] text-navy">{fallback.pcn}</dd></div>
      </dl>
      <p className="mt-2 text-[0.9rem] text-muted">{m.notes}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a className="rounded-sm bg-navy px-3 py-2.5 text-center text-[0.9rem] font-semibold text-cream" href={`tel:${m.phone.replace(/\D/g, "")}`}>Call</a>
        <a className="rounded-sm border border-navy/20 bg-paper px-3 py-2.5 text-center text-[0.9rem] font-semibold text-navy" href={`mailto:${m.email}?subject=${encodeURIComponent("Records request " + fallback.pcn)}&body=${encodeURIComponent(letter)}`}>Email</a>
        <button type="button" className="rounded-sm border border-navy/20 bg-paper px-3 py-2.5 text-[0.9rem] font-semibold text-navy" onClick={copy}>{copied ? "Copied" : "Copy request"}</button>
        <button type="button" className="rounded-sm bg-champagne-dark px-3 py-2.5 text-[0.9rem] font-semibold text-cream" onClick={() => onObtain("municipal-records")}>Have us obtain the records</button>
      </div>
    </div>
  );
}

export function DocumentUpload({
  documents,
  onUpload,
}: {
  documents: UploadedDocument[];
  onUpload: (doc: UploadedDocument) => void;
}) {
  function add(type: DocumentType) {
    const now = new Date().toISOString();
    onUpload({
      id: `${type}-${now}`,
      type,
      fileName: `${type.replace(/\s+/g, "-").toLowerCase()}-sample.pdf`,
      uploadedAt: now,
      status: "Uploaded document",
      summary: "No file is stored on a server. AI processing is not enabled. This only shows how an upload would appear on the timeline.",
      timelineNote: `${type} added in this browser session. Summary pending — no automated extraction.`,
    });
  }

  return (
    <div>
      <p className="text-[1rem] leading-relaxed text-ink/90">
        Simulated vault. Files stay in this browser tab only. They are not uploaded, emailed, or read by AI.
      </p>
      <ul className="mt-3 space-y-2">
        {DOC_TYPES.map((type) => {
          const existing = documents.filter((d) => d.type === type);
          return (
            <li key={type} className="flex items-center justify-between gap-3 rounded-sm border border-cream-dark bg-cream/40 px-3 py-2">
              <div>
                <p className="font-medium text-navy">{type}</p>
                <p className="text-[0.8rem] text-muted">{existing.length ? `${existing.length} in this session` : "Not in vault"}</p>
              </div>
              <button type="button" className="shrink-0 rounded-sm border border-navy/20 bg-paper px-3 py-1.5 text-[0.85rem] font-semibold text-navy" onClick={() => add(type)}>
                Add sample
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function NextSteps({
  steps,
  onRequest,
}: {
  steps: NextStep[];
  onRequest: (kind: ServiceRequestKind) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[1rem] leading-relaxed">
        Professional next-step resources based on this sample — not advertisements through the file.
        Request buttons open a form only. Nothing is emailed from this preview.
      </p>
      {steps.map((step) => (
        <article key={`${step.company}-${step.requestKind}`} className="rounded-md border border-navy/10 bg-cream/50 p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-champagne-dark">Recommended resource</p>
          <h3 className="mt-1 font-serif text-2xl font-semibold text-navy">{step.company}</h3>
          <p className="mt-2 text-[1rem] leading-relaxed">{step.why}</p>
          <button type="button" className="mt-3 rounded-sm bg-navy px-4 py-2 text-[0.9rem] font-semibold text-cream" onClick={() => onRequest(step.requestKind)}>
            Request {SERVICE_REQUESTS.find((r) => r.kind === step.requestKind)?.label.toLowerCase()}
          </button>
        </article>
      ))}
      <div className="grid gap-2">
        {SERVICE_REQUESTS.map((req) => (
          <button key={req.kind} type="button" className="rounded-sm border border-champagne/40 bg-paper px-4 py-3 text-left" onClick={() => onRequest(req.kind)}>
            <span className="block font-semibold text-navy">{req.label}</span>
            <span className="text-[0.9rem] text-muted">{req.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ServiceRequestModal({
  kind,
  company,
  onClose,
  onSaveLocal,
}: {
  kind: ServiceRequestKind;
  company: ServiceCompany;
  onClose: () => void;
  onSaveLocal: (request: ServiceRequest) => void;
}) {
  const meta = SERVICE_REQUESTS.find((r) => r.kind === kind);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setErrors("Enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors("Enter a valid email address.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setErrors("Enter a 10-digit phone number.");
      return;
    }
    setErrors(null);
    onSaveLocal({
      kind,
      company,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 sm:items-center sm:p-6">
      <div role="dialog" aria-labelledby="request-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-paper p-5 sm:rounded-md">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-champagne-dark">Not connected</p>
        <h2 id="request-title" className="font-serif text-3xl font-semibold text-navy">{meta?.label}</h2>
        <p className="mt-2 text-[1rem] text-muted">
          Would route to {company} after launch. {PRODUCT_NAME} preview cannot send email, save a CRM
          record, or generate a download. Completing this form only shows the local confirmation.
        </p>
        <form className="mt-4 space-y-3" onSubmit={submit} noValidate>
          <label className="block">
            <span className="text-[0.85rem] font-semibold text-navy">Name</span>
            <input required className="mt-1 w-full rounded-sm border border-cream-dark bg-cream px-3 py-2.5 text-[1.05rem]" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[0.85rem] font-semibold text-navy">Email</span>
            <input required type="email" className="mt-1 w-full rounded-sm border border-cream-dark bg-cream px-3 py-2.5 text-[1.05rem]" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[0.85rem] font-semibold text-navy">Phone</span>
            <input required type="tel" className="mt-1 w-full rounded-sm border border-cream-dark bg-cream px-3 py-2.5 text-[1.05rem]" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[0.85rem] font-semibold text-navy">Notes (optional)</span>
            <textarea className="mt-1 min-h-20 w-full rounded-sm border border-cream-dark bg-cream px-3 py-2.5 text-[1.05rem]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {errors ? <p className="text-[0.95rem] text-terracotta">{errors}</p> : null}
          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 rounded-sm bg-navy py-3 font-semibold text-cream">Save locally only</button>
            <button type="button" className="flex-1 rounded-sm border border-navy/20 py-3 font-semibold text-navy" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RequestConfirmation({ request, onClose }: { request: ServiceRequest; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 sm:items-center sm:p-6">
      <div className="w-full max-w-lg rounded-t-lg bg-paper p-6 sm:rounded-md">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-terracotta">Not sent</p>
        <h2 className="font-serif text-3xl font-semibold text-navy">Nothing was submitted</h2>
        <p className="mt-3 text-[1.05rem] leading-relaxed">
          {request.name}, this preview has no mail server and no CRM. Your {SERVICE_REQUESTS.find((r) => r.kind === request.kind)?.label.toLowerCase()} was not emailed to {request.company} or anyone else. The form values stayed in this browser tab only.
        </p>
        <button type="button" className="mt-5 w-full rounded-sm bg-navy py-3 font-semibold text-cream" onClick={onClose}>
          Return to the report
        </button>
      </div>
    </div>
  );
}
