export type AddressSuggestion = { id: string; address: string };

// Public county address table. Request situs addresses only: CITYNAME/ZIP1 in
// this table are owner mailing fields and must not be used as property location.
const endpoint =
  "https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/Tables/MapServer/1/query";
const cache = new Map<string, { expires: number; suggestions: AddressSuggestion[] }>();
const cacheTtl = 5 * 60 * 1000;
const aliases: Record<string, string> = {
  NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W",
  NORTHEAST: "NE", NORTHWEST: "NW", SOUTHEAST: "SE", SOUTHWEST: "SW",
  AVENUE: "AVE", BOULEVARD: "BLVD", CIRCLE: "CIR", COURT: "CT",
  DRIVE: "DR", HIGHWAY: "HWY", LANE: "LN", PARKWAY: "PKWY",
  PLACE: "PL", ROAD: "RD", STREET: "ST", TERRACE: "TER", TRAIL: "TRL",
};

function prefixesFor(query: string): { houseNumber: number; prefixes: string[] } | null {
  // City and state appear in the returned label; the county query searches the
  // street portion. Only an explicit house number plus street text triggers it.
  const street = query.split(",")[0].trim().toUpperCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (!street || street.length > 160 || !/^[A-Z0-9 '\/#-]+$/.test(street)) return null;
  const match = street.match(/^(\d{1,7})\s+(.+)$/);
  if (!match || !/[A-Z]/.test(match[2])) return null;

  const withoutUnitMarker = street.replace(/\s+(?:(?:APT|APARTMENT|UNIT|SUITE)\b|#)\s*/g, " ");
  const tokens = withoutUnitMarker.split(" ");
  const abbreviated = tokens.map((token) => aliases[token] ?? token).join(" ");
  const prefixes = new Set([withoutUnitMarker, abbreviated]);
  // Keep suggestions visible while finishing a suffix, e.g. "Fox Hunt Trai".
  const last = tokens.at(-1)!;
  if (last.length >= 2 && !aliases[last]) {
    for (const [long, short] of Object.entries(aliases)) {
      if (long.startsWith(last)) {
        prefixes.add([...tokens.slice(0, -1).map((token) => aliases[token] ?? token), short].join(" "));
      }
    }
  }
  return { houseNumber: Number(match[1]), prefixes: [...prefixes] };
}

export async function suggestAddresses(query: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  signal.throwIfAborted();
  if (query.length > 160) return [];
  const parsed = prefixesFor(query);
  if (!parsed) return [];
  const key = parsed.prefixes.join("|");
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.suggestions;

  // These fields contain uppercase county source data. Avoid UPPER()/sorting:
  // both materially slowed this public service during integration checks.
  const clauses = parsed.prefixes.map((prefix) =>
    `SITE_ADDR_STR LIKE '${prefix.replace(/'/g, "''")}%'`,
  );
  const params = new URLSearchParams({
    f: "json",
    where: `STREET_NUMBER = ${parsed.houseNumber} AND (${clauses.join(" OR ")})`,
    outFields: "OBJECTID,SITE_ADDR_STR,MUNICIPALITY",
    returnGeometry: "false",
    resultRecordCount: "10",
  });
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${endpoint}?${params}`, {
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
    const unique = new Map<string, AddressSuggestion>();
    for (const feature of body.features) {
      const attributes = feature?.attributes;
      const street = attributes?.SITE_ADDR_STR;
      const municipality = attributes?.MUNICIPALITY;
      const id = attributes?.OBJECTID;
      if (typeof street !== "string" || !street.trim() ||
        typeof municipality !== "string" || !municipality.trim() ||
        (typeof id !== "number" && typeof id !== "string")) continue;
      const city = /^(?:UNINCORPORATED|UNINCORPORATED PALM BEACH COUNTY)$/i.test(municipality.trim())
        ? "Palm Beach County" : municipality.trim();
      const address = `${street.trim().replace(/\s+/g, " ")}, ${city}, FL`;
      if (!unique.has(address)) unique.set(address, { id: String(id), address });
      if (unique.size === 5) break;
    }
    const suggestions = [...unique.values()];
    // Memory only: clear on page reload, never localStorage or an address log.
    if (cache.size >= 40) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + cacheTtl, suggestions });
    return suggestions;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
