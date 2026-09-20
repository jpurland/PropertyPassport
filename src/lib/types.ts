export const RECORD_STATUSES = [
  "Verified public record",
  "Uploaded document",
  "Professional verification",
  "Partial records retrieved",
  "Direct municipal verification required",
  "No matching record located",
  "Official search ordered",
  "Official results received",
] as const;

export type RecordStatus = (typeof RECORD_STATUSES)[number];

export type ConfidenceLevel =
  | "High — matches official identifier"
  | "Medium — partial match"
  | "Low — incomplete source"
  | "Unverified — user upload"
  | "Not established";

export type UserIntent = "buying" | "selling" | "owner" | "renovation";

export type ServiceCompany =
  | "Premier Estates"
  | "Storm Shield Construction"
  | "Storm Shield Roofing & Windows"
  | "Storm Shield Home Management"
  | "Storm Shield Home Command";

export type ServiceRequestKind =
  | "downloadable-report"
  | "professional-review"
  | "municipal-records"
  | "market-value-review"
  | "renovation-potential"
  | "home-management-plan";

export type DocumentType =
  | "Seller disclosure"
  | "Inspection report"
  | "Survey"
  | "Title commitment"
  | "HOA/condo documents"
  | "Association budget"
  | "Reserve study"
  | "Milestone inspection"
  | "Elevation certificate"
  | "Wind-mitigation report"
  | "Warranties and receipts";

export type PermitCategory =
  | "Roof"
  | "Windows and doors"
  | "Additions"
  | "Pool"
  | "Electrical"
  | "Plumbing"
  | "Mechanical";

export type PermitLifecycle = "Open" | "Closed" | "Expired" | "Unknown";

export interface SourceCitation {
  name: string;
  type:
    | "Available API"
    | "Public portal only"
    | "Downloadable data"
    | "Manual request"
    | "Paid request"
    | "MLS/data license required"
    | "User upload"
    | "Prototype mock";
  url?: string;
  note?: string;
}

export interface RecordMeta {
  source: SourceCitation;
  retrievedAt: string;
  status: RecordStatus;
  confidence: ConfidenceLevel;
}

export interface SourcedValue<T> extends RecordMeta {
  value: T;
}

export interface AddressParts {
  line1: string;
  city: string;
  state: "FL";
  zip: string;
  county: "Palm Beach County";
}

export interface PropertyOverview {
  address: AddressParts;
  pcn: string;
  municipality: string;
  municipalityCode: string;
  propertyType: string;
  yearBuilt: number;
  livingAreaSqFt: number;
  lotSizeSqFt: number;
  bedrooms: number;
  bathrooms: number;
  constructionType: string;
  zoning: string;
  subdivision?: string;
}

export interface SaleRecord extends RecordMeta {
  date: string;
  price: number | null;
  instrument: string;
  bookPage?: string;
  notes?: string;
}

export interface ComparableSale extends RecordMeta {
  address: string;
  distanceMiles: number;
  saleDate: string;
  salePrice: number;
  livingAreaSqFt: number;
  yearBuilt: number;
}

export interface ValueAndSales {
  assessedValue: SourcedValue<number>;
  paoMarketValue: SourcedValue<number>;
  taxableValue: SourcedValue<number>;
  priorSales: SaleRecord[];
  estimatedMarketRange: SourcedValue<{ low: number; high: number }>;
  comparables: ComparableSale[];
  valueDistinction: string;
}

export type TimelineKind =
  | "Construction"
  | "Ownership transfer"
  | "Sale"
  | "Permit"
  | "Improvement"
  | "Violation"
  | "Violation resolution"
  | "Inspection"
  | "Uploaded document";

export interface TimelineEvent extends RecordMeta {
  id: string;
  kind: TimelineKind;
  date: string;
  title: string;
  detail: string;
}

export interface PermitRecord extends RecordMeta {
  id: string;
  category: PermitCategory;
  number: string | null;
  description: string;
  filed: string | null;
  closed: string | null;
  lifecycle: PermitLifecycle;
}

export interface OfficialRecord extends RecordMeta {
  id: string;
  kind:
    | "Code case"
    | "Fine"
    | "Municipal lien"
    | "Recorded lien"
    | "Judgment"
    | "Mortgage"
    | "Mortgage release"
    | "Notice of commencement";
  title: string;
  date: string | null;
  amount: number | null;
  detail: string;
  resolved?: boolean;
}

export interface TaxYear extends RecordMeta {
  year: number;
  billed: number;
  paid: boolean;
  millageNote?: string;
}

export interface TaxesAndAssessments {
  currentBill: SourcedValue<{ year: number; amount: number; status: string }>;
  history: TaxYear[];
  exemptions: SourcedValue<string[]>;
  buyerTaxWarning: string;
  hoa: SourcedValue<{ name: string; monthly: number; notes: string } | null>;
}

export interface FloodStormInsurance {
  femaFloodZone: SourcedValue<string>;
  evacuationZone: SourcedValue<string>;
  roofAge: SourcedValue<{ year: number; ageYears: number; notes: string }>;
  impactProtection: SourcedValue<string>;
  windMitigation: SourcedValue<string>;
  elevationCertificate: SourcedValue<string>;
  generator: SourcedValue<string>;
  systemConcerns: SourcedValue<string[]>;
  insuranceLossDisclaimer: string;
}

export interface OwnershipCostLine {
  label: string;
  annualLow: number;
  annualHigh: number;
  notes: string;
  estimate: true;
}

export interface EstimatedOwnershipCosts {
  afterPurchaseTaxes: OwnershipCostLine;
  hoa: OwnershipCostLine;
  insurance: OwnershipCostLine;
  poolLandscape: OwnershipCostLine;
  majorReplacements: OwnershipCostLine;
  fiveYearForecast: {
    low: number;
    high: number;
    years: { year: number; low: number; high: number; drivers: string }[];
  };
  estimateDisclaimer: string;
}

export interface NearbyPlace {
  name: string;
  kind: "Amenity" | "Beach" | "Hospital" | "Airport" | "Park";
  distanceMiles: number;
  notes?: string;
}

export interface AssignedSchool extends RecordMeta {
  level: "Elementary" | "Middle" | "High";
  name: string;
  notes: string;
}

export interface NearbyActivity extends RecordMeta {
  title: string;
  kind: "Building permit" | "Proposed development" | "Zoning activity";
  distanceMiles: number;
  detail: string;
}

export interface Neighborhood {
  places: NearbyPlace[];
  schools: AssignedSchool[];
  nearbyActivity: NearbyActivity[];
  neighborhoodRatingDisclaimer: string;
}

export interface PropertyPotential {
  renovation: string[];
  additions: string[];
  setbacksAndCoverage: SourcedValue<string>;
  hoaRestrictions: SourcedValue<string>;
  possibleUnpermitted: SourcedValue<string>;
  verificationRequired: string[];
}

export interface GeneratedQuestion {
  ask: string;
  askOf: "Seller" | "Association" | "Municipality" | "Inspector" | "Contractor";
  why: string;
}

export interface NextStep {
  company: ServiceCompany;
  why: string;
  requestKind: ServiceRequestKind;
}

export interface MunicipalityContact {
  name: string;
  code: string;
  pcnPrefix: string;
  department: string;
  phone: string;
  email: string;
  website: string;
  portalName: string;
  portalUrl: string;
  knownFee: string;
  notes: string;
  financialLienPhone?: string;
}

export interface MunicipalFallback {
  message: string;
  municipality: MunicipalityContact;
  propertyAddress: string;
  pcn: string;
}

export interface UploadedDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  uploadedAt: string;
  status: "Uploaded document";
  summary: string;
  timelineNote: string;
}

export interface HomeCommandRecord {
  transferable: true;
  transferredAt: string | null;
  equipment: { name: string; serialNumber: string | null; installed: string | null }[];
  warranties: { item: string; expires: string | null; documentId: string | null }[];
  inspectionPhotographs: { caption: string; capturedAt: string | null }[];
  maintenanceHistory: { date: string; work: string; vendor: string | null }[];
  vendors: { trade: string; name: string | null }[];
  recurringServiceCalendar: { cadence: string; task: string }[];
  hoaAndClubDocuments: { title: string; documentId: string | null }[];
  stormPreparationRecords: { season: string; notes: string | null }[];
  renovationProjects: { name: string; status: string }[];
  annualHomeHealthReports: { year: number; documentId: string | null }[];
}

export interface PropertyPassport {
  id: string;
  demo: true;
  generatedAt: string;
  overview: PropertyOverview & RecordMeta;
  valueAndSales: ValueAndSales;
  timeline: TimelineEvent[];
  permits: PermitRecord[];
  officialRecords: OfficialRecord[];
  taxes: TaxesAndAssessments;
  floodStorm: FloodStormInsurance;
  ownershipCosts: EstimatedOwnershipCosts;
  neighborhood: Neighborhood;
  potential: PropertyPotential;
  questions: GeneratedQuestion[];
  municipalFallback: MunicipalFallback;
  homeCommand: HomeCommandRecord;
}

export interface ServiceRequest {
  kind: ServiceRequestKind;
  company: ServiceCompany;
  name: string;
  email: string;
  phone: string;
  notes: string;
  submittedAt: string;
}
