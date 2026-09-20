import type { MunicipalityContact } from "@/lib/types";

export const MUNICIPALITIES: MunicipalityContact[] = [
  {
    name: "City of Boca Raton",
    code: "06",
    pcnPrefix: "06",
    department: "Building Department — Development Services",
    phone: "561-393-7930",
    email: "buildingpermits@myboca.us",
    website: "https://www.myboca.us/157/Building-Permits-and-Inspections",
    portalName: "Boca eHub",
    portalUrl: "https://www.myboca.us/2235/Boca-eHub",
    knownFee:
      "$150 per location for a written open-permit and code-violation search. Financial liens are not included in that search.",
    notes:
      "Active records may appear in Boca eHub. Older records often require a public-records or paid search. Confirm annexation date.",
    financialLienPhone: "561-393-7729",
  },
  {
    name: "Unincorporated Palm Beach County",
    code: "00",
    pcnPrefix: "00",
    department: "Planning, Zoning & Building — Permit Center",
    phone: "561-233-5000",
    email: "PZBOpenPermitSearch@pbc.gov",
    website: "https://discover.pbc.gov/pzb/building/Pages/Permit-Center.aspx",
    portalName: "ePZB",
    portalUrl: "https://www.pbcgov.com/epzb",
    knownFee:
      "Certified searches: open building permit about $65, code compliance about $50, fine/lien about $65. County searches do not cover municipal records.",
    notes: "PCN prefix 00. Use ePZB for unincorporated parcels only.",
  },
];

export function municipalityByPcn(pcn: string): MunicipalityContact | undefined {
  const prefix = pcn.replace(/\D/g, "").slice(0, 2);
  return MUNICIPALITIES.find((m) => m.pcnPrefix === prefix);
}
