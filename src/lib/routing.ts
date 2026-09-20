import type {
  GeneratedQuestion,
  NextStep,
  PropertyPassport,
  ServiceCompany,
  ServiceRequestKind,
  UserIntent,
} from "@/lib/types";

export const INTENT_OPTIONS: { id: UserIntent; label: string; description: string }[] = [
  {
    id: "buying",
    label: "Considering buying",
    description: "Review the county record and prepare questions before buying.",
  },
  {
    id: "selling",
    label: "Considering selling",
    description: "Understand what a buyer, inspector, or insurer is likely to ask.",
  },
  {
    id: "owner",
    label: "Current owner",
    description: "Review the county record and prepare maintenance and ownership questions.",
  },
  {
    id: "renovation",
    label: "Considering renovation",
    description: "Review the property record and identify research still needed for your plans.",
  },
];

export function questionsFor(intent: UserIntent): GeneratedQuestion[] {
  const shared: GeneratedQuestion[] = [
    {
      ask: "Was the 2023 electrical panel work completed, abandoned, or finished under a different permit?",
      askOf: "Seller",
      why: "Permit ELE-23-7741 expired without a recorded final.",
    },
    {
      ask: "Please confirm the status of expired electrical permit ELE-23-7741.",
      askOf: "Municipality",
      why: "Open, expired, or unknown electrical work affects insurance and resale.",
    },
    {
      ask: "Is there a current wind-mitigation inspection, four-point, or roof certification?",
      askOf: "Seller",
      why: "No matching wind-mitigation document is in this sample file.",
    },
    {
      ask: "Document remaining opening protection, including the garage door.",
      askOf: "Inspector",
      why: "The 2017 impact permit does not list the garage door.",
    },
    {
      ask: "Is the rear covered patio / enclosure permitted?",
      askOf: "Municipality",
      why: "No matching addition permit was located in this sample set.",
    },
    {
      ask: "Provide estoppel, budget, reserve study, and any pending special assessments.",
      askOf: "Association",
      why: "HOA costs in this report are sample estimates only.",
    },
    {
      ask: "What is the remaining useful life of the 2008 tile roof?",
      askOf: "Contractor",
      why: "The sample roof is about 18 years old.",
    },
  ];

  const byIntent: Record<UserIntent, GeneratedQuestion[]> = {
    buying: [
      {
        ask: "Will the seller credit or complete roof and electrical items before closing?",
        askOf: "Seller",
        why: "Near-term replacement and an expired permit change the buyer’s cost picture.",
      },
    ],
    selling: [
      {
        ask: "Close or resolve ELE-23-7741 before listing if the work was completed.",
        askOf: "Contractor",
        why: "Expired permits commonly appear on buyer municipal searches.",
      },
    ],
    owner: [
      {
        ask: "Schedule a roof assessment and archive any warranties.",
        askOf: "Contractor",
        why: "An 18-year roof is a maintenance and insurance item.",
      },
    ],
    renovation: [
      {
        ask: "What are the current R-1-B setbacks and lot-coverage limits for a rear addition?",
        askOf: "Municipality",
        why: "This file is not a zoning letter.",
      },
    ],
  };

  return [...byIntent[intent], ...shared];
}

export function nextStepsFor(intent: UserIntent, passport: PropertyPassport): NextStep[] {
  const roofAge = passport.floodStorm.roofAge.value.ageYears;
  const steps: NextStep[] = [];
  const add = (company: ServiceCompany, why: string, requestKind: NextStep["requestKind"]) => {
    if (!steps.some((s) => s.company === company && s.requestKind === requestKind)) {
      steps.push({ company, why, requestKind });
    }
  };

  if (intent === "buying" || intent === "selling") {
    add(
      "Premier Estates",
      intent === "buying"
        ? "You selected buying. Representation and a professional property review belong with Premier Estates."
        : "You selected selling. Listing strategy and a market-value review belong with Premier Estates.",
      intent === "buying" ? "professional-review" : "market-value-review",
    );
  }
  if (intent === "buying") {
    add(
      "Premier Estates",
      "Assessed value, PAO market value, and the sample range are not an appraisal.",
      "market-value-review",
    );
  }
  if (roofAge >= 15) {
    add(
      "Storm Shield Roofing & Windows",
      `The sample roof permit dates to 2008 (about ${roofAge} years). Remaining life and opening protection are roofing items.`,
      "professional-review",
    );
  }
  if (intent === "renovation") {
    add(
      "Storm Shield Construction",
      "Renovation potential, possible unpermitted patio work, and an expired electrical permit should be reviewed before design.",
      "renovation-potential",
    );
  }
  if (intent === "owner" || intent === "buying") {
    add(
      "Storm Shield Home Management",
      "After purchase, this passport is shaped to transfer into Storm Shield Home Command.",
      "home-management-plan",
    );
  }
  return steps;
}

export function companyForRequest(kind: ServiceRequestKind, intent: UserIntent): ServiceCompany {
  switch (kind) {
    case "renovation-potential":
      return "Storm Shield Construction";
    case "home-management-plan":
      return "Storm Shield Home Command";
    case "municipal-records":
      return intent === "renovation" ? "Storm Shield Construction" : "Premier Estates";
    default:
      if (intent === "renovation") return "Storm Shield Construction";
      if (intent === "owner") return "Storm Shield Home Management";
      return "Premier Estates";
  }
}

export function requestCopy(
  address: string,
  pcn: string,
  municipality: string,
  department: string,
): string {
  return [
    `Official records request — Property Passport (review demo)`,
    ``,
    `Please provide copies of building permits, open/expired permits, code cases, and related municipal records for:`,
    ``,
    `Property address: ${address}`,
    `Parcel / PCN: ${pcn}`,
    `Municipality: ${municipality}`,
    `Department: ${department}`,
    ``,
    `Please advise of any search fee and expected turnaround.`,
    ``,
    `Note: Inability to retrieve records through an automated search does not mean that no records exist.`,
  ].join("\n");
}
