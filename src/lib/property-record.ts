export const COUNTY_SOURCE = "https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/Tables/MapServer/1";
const fields = "PARCEL_NUMBER,SITE_ADDR_STR,MUNICIPALITY,OWNER_NAME1,OWNER_NAME2,CONFID_FLG,PROPERTY_USE,SUBDIV_NAME,ACRES,ASSESSED_VAL,TOTAL_MARKET,TOTAL_TAXABLE,SALE_DATE,PRICE,BOOK,PAGE,INSTRUMENT";

export type CountyPropertyRecord = {
  parcelNumber: string; address: string; locality: string; owners: string[];
  ownerWithheld: boolean; propertyUse: string | null; subdivision: string | null;
  acres: number | null; assessedValue: number | null; countyMarketValue: number | null;
  taxableValue: number | null; saleDate: string | null; salePrice: number | null;
  book: string | null; page: string | null; instrument: string | null;
  retrievedAt: string; sourceUrl: string;
};

const string = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
const amount = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
const normalize = (value: string) => value.toUpperCase().replace(/\s+/g, " ").trim();

export function parsePropertyRecord(body: unknown, parcelNumber: string, selectedAddress: string, sourceUrl: string): CountyPropertyRecord {
  if (!body || typeof body !== "object" || "error" in body || !("features" in body) || !Array.isArray(body.features)) {
    throw new Error("The county service could not return a property record. Please try again.");
  }
  if (body.features.length !== 1 || ("exceededTransferLimit" in body && body.exceededTransferLimit)) {
    throw new Error("A unique county record could not be matched. Please search and select the address again.");
  }
  const a = body.features[0]?.attributes as Record<string, unknown> | undefined;
  if (!a || string(a.PARCEL_NUMBER) !== parcelNumber) throw new Error("The parcel did not match the selected property. Please search again.");
  const street = string(a.SITE_ADDR_STR);
  const locality = string(a.MUNICIPALITY);
  if (!street || !locality) throw new Error("The county record has no complete address. Please confirm it with the Property Appraiser.");
  const displayCity = /^(?:UNINCORPORATED|UNINCORPORATED PALM BEACH COUNTY)$/i.test(locality) ? "Palm Beach County" : locality;
  const address = `${street.replace(/\s+/g, " ")}, ${displayCity}, FL`;
  if (normalize(address) !== normalize(selectedAddress)) throw new Error("The county address changed or does not match your selection. Please search and select it again.");
  const ownerWithheld = string(a.CONFID_FLG)?.toUpperCase() !== "N";
  const saleTime = typeof a.SALE_DATE === "number" && a.SALE_DATE > 0 && a.SALE_DATE <= Date.now() ? a.SALE_DATE : null;
  return {
    parcelNumber, address, locality, ownerWithheld,
    owners: ownerWithheld ? [] : [...new Set([string(a.OWNER_NAME1), string(a.OWNER_NAME2)].filter((v): v is string => v !== null))],
    propertyUse: string(a.PROPERTY_USE), subdivision: string(a.SUBDIV_NAME),
    acres: amount(a.ACRES), assessedValue: amount(a.ASSESSED_VAL),
    countyMarketValue: amount(a.TOTAL_MARKET), taxableValue: amount(a.TOTAL_TAXABLE),
    saleDate: saleTime === null ? null : new Date(saleTime).toISOString().slice(0, 10),
    salePrice: saleTime === null ? null : amount(a.PRICE),
    book: string(a.BOOK), page: string(a.PAGE), instrument: string(a.INSTRUMENT),
    retrievedAt: new Date().toISOString(), sourceUrl,
  };
}

export async function fetchPropertyRecord(selection: { parcelNumber?: string; address: string }, signal: AbortSignal): Promise<CountyPropertyRecord> {
  signal.throwIfAborted();
  const parcel = selection.parcelNumber;
  if (!parcel || !/^\d{17}$/.test(parcel)) throw new Error("Please select a county address suggestion so we can match the correct parcel.");
  const params = new URLSearchParams({ f: "json", where: `PARCEL_NUMBER = '${parcel}'`, outFields: fields, returnGeometry: "false", resultRecordCount: "2" });
  const sourceUrl = `${COUNTY_SOURCE}/query?${params}`;
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(sourceUrl, { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" });
    if (!response.ok) throw new Error("The county service is unavailable. Please try again shortly.");
    const body: unknown = await response.json();
    signal.throwIfAborted();
    return parsePropertyRecord(body, parcel, selection.address, sourceUrl);
  } catch (error) {
    if (signal.aborted) throw error;
    if (controller.signal.aborted) throw new Error("The county lookup took too long. Please retry; your selected address is saved.");
    if (error instanceof SyntaxError || error instanceof TypeError) throw new Error("The county response could not be read. Please try again shortly.");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
