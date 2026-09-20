// Public, read-only ArcGIS queries. Location is resolved by the selected PCN,
// never by a loosely matched mailing city or a default/demo coordinate.
export const RESEARCH_SOURCES = {
  location: "https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/open_data_v2/FeatureServer/0",
  flood: "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28",
  evacuation: "https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/Public_Safety_Open_Data/MapServer/0",
  zoning: "https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/Planning_Open_Data/MapServer/9",
} as const;
export type MapKind = "flood" | "evacuation" | "zoning";
export type PropertyPoint = { x: number; y: number; sourceUrl: string };
export type MapResult = { rows: { heading: string; detail: string | null }[]; sourceUrl: string; retrievedAt: string };
type Feature = { attributes: Record<string, unknown>; geometry?: { x?: unknown; y?: unknown } };
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;

function features(body: unknown): Feature[] {
  if (!body || typeof body !== "object" || "error" in body || !("features" in body) || !Array.isArray(body.features)) {
    throw new Error("The source returned an unreadable result. Please retry or open the official source.");
  }
  if ("exceededTransferLimit" in body && body.exceededTransferLimit) throw new Error("The source returned an incomplete result. Please check the official map.");
  if (body.features.some((f) => !f || typeof f !== "object" || !f.attributes || typeof f.attributes !== "object")) {
    throw new Error("The source returned an unreadable record.");
  }
  return body.features;
}

export function parsePropertyPoint(body: unknown, parcel: string, sourceUrl: string): PropertyPoint {
  const rows = features(body);
  if (rows.length !== 1 || rows[0].attributes.PCN !== parcel) throw new Error("A unique county address point could not be matched to this parcel. Check the official maps directly.");
  const x = rows[0].geometry?.x, y = rows[0].geometry?.y;
  // Bounds cover Palm Beach County, including western parcels; reject bad SRs.
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x < -81 || x > -79.9 || y < 26.2 || y > 27.1) {
    throw new Error("The county location is missing or outside the supported area.");
  }
  return { x, y, sourceUrl };
}

export function parseMapResult(body: unknown, kind: MapKind, sourceUrl: string): MapResult {
  const rows = features(body).map(({ attributes: a }) => {
    const heading = text(kind === "flood" ? a.FLD_ZONE : a.FNAME);
    if (!heading) throw new Error("The source returned a record without a zone label. Please check its map.");
    const detail = kind === "flood" ? text(a.ZONE_SUBTY) : kind === "zoning" ? [text(a.FCODE), text(a.ZONING_DESC)].filter(Boolean).join(" · ") || null : null;
    return { heading: kind === "flood" ? `Zone ${heading}` : heading, detail };
  });
  return { rows: rows.filter((r, i) => rows.findIndex((v) => v.heading === r.heading && v.detail === r.detail) === i), sourceUrl, retrievedAt: new Date().toISOString() };
}

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  signal.throwIfAborted();
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" });
    if (!response.ok) throw new Error("This source is unavailable right now. Retry or open its official website.");
    const body: unknown = await response.json();
    signal.throwIfAborted();
    return body;
  } catch (error) {
    if (signal.aborted) throw error;
    if (controller.signal.aborted) throw new Error("This source took too long to respond. Please retry.");
    if (error instanceof TypeError || error instanceof SyntaxError) throw new Error("This source could not be reached or read. Please retry.");
    throw error;
  } finally { clearTimeout(timeout); signal.removeEventListener("abort", abort); }
}

export async function fetchPropertyPoint(parcel: string, signal: AbortSignal): Promise<PropertyPoint> {
  if (!/^\d{17}$/.test(parcel)) throw new Error("A valid matched parcel is required.");
  const params = new URLSearchParams({ f: "json", where: `PCN = '${parcel}'`, outFields: "PCN", outSR: "4326", returnGeometry: "true", resultRecordCount: "2" });
  const url = `${RESEARCH_SOURCES.location}/query?${params}`;
  return parsePropertyPoint(await readJson(url, signal), parcel, url);
}

export async function fetchMapResult(kind: MapKind, point: PropertyPoint, parcel: string, signal: AbortSignal): Promise<MapResult> {
  if (!/^\d{17}$/.test(parcel)) throw new Error("A valid matched parcel is required.");
  if (kind === "zoning" && !parcel.startsWith("00")) throw new Error("This zoning layer covers unincorporated county parcels only.");
  const params = new URLSearchParams({ f: "json", geometry: `${point.x},${point.y}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects", outFields: kind === "flood" ? "FLD_ZONE,ZONE_SUBTY" : kind === "zoning" ? "FCODE,FNAME,ZONING_DESC" : "FNAME", returnGeometry: "false", resultRecordCount: "100" });
  const url = `${RESEARCH_SOURCES[kind]}/query?${params}`;
  return parseMapResult(await readJson(url, signal), kind, url);
}

export function permitSource(parcel: string): { jurisdiction: string; name: string; url: string | null } {
  if (/^00\d{15}$/.test(parcel)) return { jurisdiction: "Unincorporated Palm Beach County", name: "County ePZB", url: `https://pbc.gov/iPZB.Building/guest/pcnpermits/${parcel}` };
  if (/^06\d{15}$/.test(parcel)) return { jurisdiction: "City of Boca Raton", name: "Boca eHub", url: "https://www.myboca.us/2235/Boca-eHub" };
  return { jurisdiction: "Municipal jurisdiction — confirm with the Property Appraiser", name: "Municipal permit portal", url: null };
}

export function zillowSearchUrl(address: string): string {
  // An address search, not a verified Zillow property ID or a data integration.
  return `https://www.zillow.com/homes/${encodeURIComponent(address.trim().replace(/\s+/g, "-"))}_rb/`;
}
