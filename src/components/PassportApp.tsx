"use client";

import { useEffect, useMemo, useState } from "react";
import { RequestConfirmation, ServiceRequestModal } from "@/components/Actions";
import { IntentSelect, ResolveScreen, SearchLanding } from "@/components/FlowScreens";
import { PassportReport } from "@/components/PassportReport";
import { demoPassport } from "@/data/demo-property";
import { fullAddress } from "@/lib/format";
import { companyForRequest, nextStepsFor, questionsFor } from "@/lib/routing";
import type { ServiceRequest, ServiceRequestKind, UploadedDocument, UserIntent } from "@/lib/types";

type Step = "search" | "intent" | "resolve" | "report";

export function PassportApp() {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<UserIntent | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [requestKind, setRequestKind] = useState<ServiceRequestKind | null>(null);
  const [localDraft, setLocalDraft] = useState<ServiceRequest | null>(null);

  const sampleAddress = fullAddress(
    demoPassport.overview.address.line1,
    demoPassport.overview.address.city,
    demoPassport.overview.address.state,
    demoPassport.overview.address.zip,
  );

  const questions = useMemo(() => (intent ? questionsFor(intent) : []), [intent]);
  const nextSteps = useMemo(() => (intent ? nextStepsFor(intent, demoPassport) : []), [intent]);

  useEffect(() => {
    if (step !== "resolve") return;
    const t = window.setTimeout(() => setStep("report"), 1200);
    return () => window.clearTimeout(t);
  }, [step]);

  function search() {
    if (!query.trim()) {
      setError("Enter an address to continue. This preview still opens the sample Boca Raton report.");
      return;
    }
    setError(null);
    setStep("intent");
  }

  function startOver() {
    setStep("search");
    setIntent(null);
    setDocuments([]);
    setRequestKind(null);
    setLocalDraft(null);
  }

  return (
    <>
      {step === "search" ? (
        <SearchLanding
          query={query}
          error={error}
          onQuery={(value) => {
            setQuery(value);
            setError(null);
          }}
          onSearch={search}
        />
      ) : null}
      {step === "intent" ? (
        <IntentSelect
          typedAddress={query.trim()}
          onBack={() => setStep("search")}
          onSelect={(next) => {
            setIntent(next);
            setStep("resolve");
          }}
        />
      ) : null}
      {step === "resolve" ? (
        <ResolveScreen
          address={sampleAddress}
          pcn={demoPassport.overview.pcn}
          municipality={demoPassport.overview.municipality}
        />
      ) : null}
      {step === "report" && intent ? (
        <PassportReport
          passport={demoPassport}
          intent={intent}
          typedAddress={query.trim()}
          questions={questions}
          nextSteps={nextSteps}
          documents={documents}
          onUpload={(doc) => setDocuments((prev) => [...prev, doc])}
          onRequest={setRequestKind}
          onStartOver={startOver}
        />
      ) : null}

      {requestKind && intent ? (
        <ServiceRequestModal
          kind={requestKind}
          company={companyForRequest(requestKind, intent)}
          onClose={() => setRequestKind(null)}
          onSaveLocal={(req) => {
            setRequestKind(null);
            setLocalDraft(req);
          }}
        />
      ) : null}
      {localDraft ? (
        <RequestConfirmation request={localDraft} onClose={() => setLocalDraft(null)} />
      ) : null}
    </>
  );
}
