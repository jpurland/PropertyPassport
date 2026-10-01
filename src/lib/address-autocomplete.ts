// Situs Address point layer for autocomplete. PROPINFO remains the parcel-report
// source. CITYNAME/ZIP1 in PROPINFO are owner mailing fields and must not be
// used as property location. This layer exposes situs CITY and ZIP_CODE; it does
// not expose PRE_DIR/POST_DIR, so directional prefixes are never invented.

export const SITUS_SOURCE =
  "https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/open_data_v2/FeatureServer/0";

export type BuildingKey = {
  streetNo: string;
  streetName: string;
  streetSuffix: string;
  city: string;
  zip: string;
  zipCity: string | null;
};

export type AddressSuggestion = {
  id: string;
  address: string;
  kind: "building" | "parcel";
  parcelNumber?: string;
  building?: BuildingKey;
  unit?: string | null;
  unitCount?: number;
  city?: string;
  zip?: string;
};

type SitusRow = {
  objectId: string;
  pcn: string | null;
  streetNo: string;
  streetName: string;
  streetSuffix: string;
  apartment: string | null;
  city: string;
  zip: string;
  zipCity: string | null;
};

type ParsedQuery = {
  houseNumber: string | null;
  namePrefixes: string[];
  suffixes: string[];
  unit: string | null;
  city: string | null;
  zip: string | null;
};

const cache = new Map<string, { expires: number; suggestions: AddressSuggestion[] }>();
const unitCache = new Map<string, { expires: number; units: AddressSuggestion[] }>();
const cacheTtl = 5 * 60 * 1000;
const maxBuildingSuggestions = 25;
const pageSize = 1000;

const aliases: Record<string, string> = {
  NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W",
  NORTHEAST: "NE", NORTHWEST: "NW", SOUTHEAST: "SE", SOUTHWEST: "SW",
  AVENUE: "AVE", BOULEVARD: "BLVD", CIRCLE: "CIR", COURT: "CT",
  DRIVE: "DR", HIGHWAY: "HWY", LANE: "LN", PARKWAY: "PKWY",
  PLACE: "PL", ROAD: "RD", STREET: "ST", TERRACE: "TER", TRAIL: "TRL",
};

const directionTokens = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]);
const suffixAbbreviations = new Set(Object.values(aliases).filter((value) => !directionTokens.has(value)));

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function abbreviateToken(token: string): string {
  return aliases[token] ?? token;
}

function expandPartialSuffix(token: string): string[] {
  if (aliases[token]) return [aliases[token]];
  if (suffixAbbreviations.has(token)) return [token];
  if (token.length < 2) return [];
  const matches: string[] = [];
  for (const [long, short] of Object.entries(aliases)) {
    if (!directionTokens.has(short) && long.startsWith(token)) matches.push(short);
  }
  return [...new Set(matches)];
}

function namePrefixVariants(tokens: string[]): string[] {
  if (!tokens.length) return [];
  const abbreviated = tokens.map(abbreviateToken);
  const prefixes = new Set<string>([tokens.join(" "), abbreviated.join(" ")]);
  if (tokens.length >= 2 && directionTokens.has(abbreviateToken(tokens[0]))) {
    for (const variant of namePrefixVariants(tokens.slice(1))) prefixes.add(variant);
  }
  return [...prefixes].filter(Boolean);
}

export function parseAddressQuery(query: string): ParsedQuery | null {
  if (!query || query.length > 160) return null;
  const [streetPartRaw, ...localityParts] = query.split(",");
  const streetPart = streetPartRaw.trim().toUpperCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (!streetPart || !/^[A-Z0-9 '\/#-]+$/.test(streetPart)) return null;

  let city: string | null = null;
  let zip: string | null = null;
  const locality = localityParts.join(",").trim().toUpperCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (locality) {
    const localityNormalized = locality.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    if (!/^[A-Z0-9 '\/#-]+$/.test(localityNormalized)) return null;
    const zipMatch = localityNormalized.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) zip = zipMatch[1];
    const cityText = localityNormalized
      .replace(/\b\d{5}(?:-\d{4})?\b/g, " ")
      .replace(/\bFL(?:ORIDA)?\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cityText) city = cityText;
  }

  const unitMatch = streetPart.match(/\s+(?:(?:APT|APARTMENT|UNIT|SUITE)\b|#)\s*([A-Z0-9-]+)\s*$/);
  const unit = unitMatch?.[1] ?? null;
  const withoutUnit = streetPart
    .replace(/\s+(?:(?:APT|APARTMENT|UNIT|SUITE)\b|#)\s*[A-Z0-9-]*\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!withoutUnit) return null;

  const houseMatch = withoutUnit.match(/^(\d{1,7})(?:\s+(.*))?$/);
  let houseNumber: string | null = null;
  let streetTokens: string[] = [];
  if (houseMatch) {
    houseNumber = houseMatch[1];
    streetTokens = (houseMatch[2] ?? "").split(" ").filter(Boolean);
  } else {
    streetTokens = withoutUnit.split(" ").filter(Boolean);
  }

  if (!streetTokens.length || !streetTokens.some((token) => /[A-Z]/.test(token))) return null;
  if (!houseNumber && streetTokens.join(" ").length < 3) return null;

  let suffixes: string[] = [];
  let nameTokens = streetTokens;
  const last = streetTokens.at(-1)!;
  const suffixMatches = expandPartialSuffix(last);
  if (suffixMatches.length && streetTokens.length >= 2) {
    suffixes = suffixMatches;
    nameTokens = streetTokens.slice(0, -1);
  }

  // Drop a leading direction from the street-name field query only. Labels never
  // invent PRE_DIR because the situs layer does not provide it.
  while (nameTokens.length > 1 && directionTokens.has(abbreviateToken(nameTokens[0]))) {
    nameTokens = nameTokens.slice(1);
  }

  const namePrefixes = namePrefixVariants(nameTokens);
  if (!namePrefixes.length) return null;
  return { houseNumber, namePrefixes, suffixes, unit, city, zip };
}

function buildingKeyOf(row: SitusRow): BuildingKey {
  return {
    streetNo: row.streetNo,
    streetName: row.streetName,
    streetSuffix: row.streetSuffix,
    city: row.city,
    zip: row.zip,
    zipCity: row.zipCity,
  };
}

function buildingId(building: BuildingKey): string {
  return ["b", building.streetNo, building.streetName, building.streetSuffix, building.city, building.zip]
    .map((part) => part.toUpperCase())
    .join("|");
}

function formatLocality(city: string, zipCity: string | null, zip: string): string {
  const unincorporated = /^(?:UNINCORPORATED|UNINCORPORATED PALM BEACH COUNTY)$/i.test(city);
  const cityLabel = unincorporated
    ? (zipCity && !/^(?:UNINCORPORATED|UNINCORPORATED PALM BEACH COUNTY)$/i.test(zipCity)
      ? `Unincorporated · ${zipCity}`
      : "Unincorporated Palm Beach County")
    : city;
  return zip ? `${cityLabel}, FL ${zip}` : `${cityLabel}, FL`;
}

function formatStreetLine(building: BuildingKey, unit?: string | null): string {
  const base = [building.streetNo, building.streetName, building.streetSuffix].filter(Boolean).join(" ");
  return unit ? `${base} #${unit}` : base;
}

export function formatSuggestionAddress(building: BuildingKey, unit?: string | null): string {
  return `${formatStreetLine(building, unit)}, ${formatLocality(building.city, building.zipCity, building.zip)}`;
}

function rowFromAttributes(attributes: Record<string, unknown>): SitusRow | null {
  const objectId = attributes.OBJECTID;
  const streetNo = typeof attributes.STREET_NO === "string" ? attributes.STREET_NO.trim() : "";
  const streetName = typeof attributes.STREET_NAME === "string" ? attributes.STREET_NAME.trim() : "";
  const streetSuffix = typeof attributes.STREET_SUFFIX === "string" ? attributes.STREET_SUFFIX.trim() : "";
  const city = typeof attributes.CITY === "string" ? attributes.CITY.trim() : "";
  const zip = typeof attributes.ZIP_CODE === "string" ? attributes.ZIP_CODE.trim() : "";
  if ((typeof objectId !== "number" && typeof objectId !== "string") || !streetNo || !streetName || !city) {
    return null;
  }
  const pcn = typeof attributes.PCN === "string" && /^\d{17}$/.test(attributes.PCN) ? attributes.PCN : null;
  const apartment = typeof attributes.APARTMENT === "string" && attributes.APARTMENT.trim()
    ? attributes.APARTMENT.trim()
    : null;
  const zipCity = typeof attributes.ZIP_CITY === "string" && attributes.ZIP_CITY.trim()
    ? attributes.ZIP_CITY.trim()
    : null;
  return {
    objectId: String(objectId),
    pcn,
    streetNo,
    streetName,
    streetSuffix,
    apartment,
    city,
    zip,
    zipCity,
  };
}

function whereClause(parsed: ParsedQuery): string {
  const nameClauses = parsed.namePrefixes.map(
    (prefix) => `UPPER(STREET_NAME) LIKE '${escapeSql(prefix)}%'`,
  );
  const parts = [`(${nameClauses.join(" OR ")})`];
  if (parsed.houseNumber) parts.push(`STREET_NO = '${escapeSql(parsed.houseNumber)}'`);
  if (parsed.suffixes.length) {
    const suffixClauses = parsed.suffixes.map(
      (suffix) => `UPPER(STREET_SUFFIX) = '${escapeSql(suffix)}'`,
    );
    parts.push(`(${suffixClauses.join(" OR ")})`);
  }
  if (parsed.city) parts.push(`UPPER(CITY) LIKE '${escapeSql(parsed.city)}%'`);
  if (parsed.zip) parts.push(`ZIP_CODE = '${escapeSql(parsed.zip)}'`);
  if (parsed.unit) parts.push(`UPPER(APARTMENT) LIKE '${escapeSql(parsed.unit)}%'`);
  return parts.join(" AND ");
}

async function querySitus(where: string, signal: AbortSignal, offset = 0): Promise<{ rows: SitusRow[]; exceeded: boolean }> {
  const params = new URLSearchParams({
    f: "json",
    where,
    outFields: "OBJECTID,PCN,STREET_NO,STREET_NAME,STREET_SUFFIX,APARTMENT,CITY,ZIP_CODE,ZIP_CITY,BUILDING_NUM,FLOOR",
    returnGeometry: "false",
    resultRecordCount: String(pageSize),
    resultOffset: String(offset),
    orderByFields: "STREET_NO,STREET_NAME,STREET_SUFFIX,APARTMENT",
  });
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${SITUS_SOURCE}/query?${params}`, {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw new Error("Address service unavailable");
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || "error" in body ||
      !("features" in body) || !Array.isArray(body.features)) {
      throw new Error("Unexpected address response");
    }
    signal.throwIfAborted();
    const rows: SitusRow[] = [];
    for (const feature of body.features) {
      const attributes = feature?.attributes;
      if (!attributes || typeof attributes !== "object") continue;
      const row = rowFromAttributes(attributes as Record<string, unknown>);
      if (row) rows.push(row);
    }
    return { rows, exceeded: Boolean((body as { exceededTransferLimit?: boolean }).exceededTransferLimit) };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

async function queryAllSitus(where: string, signal: AbortSignal): Promise<SitusRow[]> {
  const all: SitusRow[] = [];
  let offset = 0;
  for (;;) {
    const page = await querySitus(where, signal, offset);
    all.push(...page.rows);
    if (!page.exceeded || page.rows.length === 0) return all;
    offset += page.rows.length;
    if (offset > 20_000) return all;
  }
}

function suggestionFromParcel(row: SitusRow): AddressSuggestion | null {
  if (!row.pcn) return null;
  const building = buildingKeyOf(row);
  return {
    id: `p|${row.pcn}|${row.objectId}`,
    address: formatSuggestionAddress(building, row.apartment),
    kind: "parcel",
    parcelNumber: row.pcn,
    building,
    unit: row.apartment,
    city: building.city,
    zip: building.zip,
  };
}

function suggestionFromBuilding(building: BuildingKey, rows: SitusRow[]): AddressSuggestion {
  const parcels = rows.filter((row) => row.pcn);
  const withUnits = parcels.filter((row) => row.apartment);
  const multiUnit = parcels.length > 1 || withUnits.length > 1;
  if (!multiUnit && parcels[0]) return suggestionFromParcel(parcels[0])!;
  if (!parcels.length) {
    return {
      id: buildingId(building),
      address: formatSuggestionAddress(building),
      kind: "building",
      building,
      unitCount: 0,
      city: building.city,
      zip: building.zip,
    };
  }
  return {
    id: buildingId(building),
    address: `${formatSuggestionAddress(building)} · ${parcels.length} ${parcels.length === 1 ? "unit" : "units"}`,
    kind: "building",
    building,
    unitCount: parcels.length,
    city: building.city,
    zip: building.zip,
  };
}

function groupRows(rows: SitusRow[]): AddressSuggestion[] {
  const groups = new Map<string, { building: BuildingKey; rows: SitusRow[] }>();
  for (const row of rows) {
    const building = buildingKeyOf(row);
    const id = buildingId(building);
    const existing = groups.get(id);
    if (existing) existing.rows.push(row);
    else groups.set(id, { building, rows: [row] });
  }
  return [...groups.values()]
    .map(({ building, rows: grouped }) => suggestionFromBuilding(building, grouped))
    .sort((a, b) => a.address.localeCompare(b.address));
}

export async function suggestAddresses(query: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  signal.throwIfAborted();
  const parsed = parseAddressQuery(query);
  if (!parsed) return [];
  const key = JSON.stringify(parsed);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.suggestions;

  const where = whereClause(parsed);
  const rows = parsed.houseNumber
    ? await queryAllSitus(where, signal)
    : (await querySitus(where, signal)).rows;

  signal.throwIfAborted();

  let suggestions = groupRows(rows);
  if (parsed.unit) {
    const parcels = suggestions.filter((item) => item.kind === "parcel");
    if (parcels.length === 1) suggestions = parcels;
  }
  if (!parsed.houseNumber) suggestions = suggestions.slice(0, maxBuildingSuggestions);

  if (cache.size >= 40) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + cacheTtl, suggestions });
  return suggestions;
}

export async function suggestUnitsForBuilding(
  building: BuildingKey,
  unitQuery: string,
  signal: AbortSignal,
): Promise<AddressSuggestion[]> {
  signal.throwIfAborted();
  const cacheKey = buildingId(building);
  let cached = unitCache.get(cacheKey);
  if (!cached || cached.expires <= Date.now()) {
    const where = [
      `STREET_NO = '${escapeSql(building.streetNo)}'`,
      `UPPER(STREET_NAME) = '${escapeSql(building.streetName.toUpperCase())}'`,
      `UPPER(STREET_SUFFIX) = '${escapeSql(building.streetSuffix.toUpperCase())}'`,
      `UPPER(CITY) = '${escapeSql(building.city.toUpperCase())}'`,
      `ZIP_CODE = '${escapeSql(building.zip)}'`,
    ].join(" AND ");
    const rows = await queryAllSitus(where, signal);
    signal.throwIfAborted();
    const mapped = rows
      .map(suggestionFromParcel)
      .filter((item): item is AddressSuggestion => item !== null)
      .sort((a, b) => (a.unit ?? "").localeCompare(b.unit ?? "", undefined, { numeric: true }));
    if (unitCache.size >= 40) unitCache.delete(unitCache.keys().next().value!);
    cached = { expires: Date.now() + cacheTtl, units: mapped };
    unitCache.set(cacheKey, cached);
  }

  const filter = unitQuery.trim().toUpperCase().replace(/^(?:APT|APARTMENT|UNIT|SUITE|#)\s*/i, "");
  if (!filter) return cached.units;
  return cached.units.filter((item) => {
    const unit = (item.unit ?? "").toUpperCase();
    return unit.includes(filter) || item.address.toUpperCase().includes(filter) || (item.parcelNumber ?? "").includes(filter);
  });
}

/** Clear suggestion caches — used by tests. */
export function clearAddressSuggestionCache(): void {
  cache.clear();
  unitCache.clear();
}
