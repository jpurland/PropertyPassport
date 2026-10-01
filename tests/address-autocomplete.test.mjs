import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearAddressSuggestionCache,
  parseAddressQuery,
  suggestAddresses,
  suggestUnitsForBuilding,
} from "../src/lib/address-autocomplete.ts";

const signal = () => new AbortController().signal;
const feature = (id, attrs) => ({ attributes: { OBJECTID: id, ...attrs } });
const response = (features, exceeded = false) =>
  new Response(JSON.stringify({ features, ...(exceeded ? { exceededTransferLimit: true } : {}) }));

const oceanCondo = (id, apartment, city, zip, pcn) => feature(id, {
  PCN: pcn,
  STREET_NO: "2727",
  STREET_NAME: "Ocean",
  STREET_SUFFIX: "Blvd",
  APARTMENT: apartment,
  CITY: city,
  ZIP_CODE: zip,
  ZIP_CITY: city,
});

test("parseAddressQuery supports house, street-only, city/ZIP, commas, units, and suffixes", () => {
  assert.deepEqual(parseAddressQuery("2727 s ocean blvd unit 1507, Highland Beach, FL 33487"), {
    houseNumber: "2727",
    namePrefixes: ["OCEAN"],
    suffixes: ["BLVD"],
    unit: "1507",
    city: "HIGHLAND BEACH",
    zip: "33487",
  });
  assert.equal(parseAddressQuery("Fox Hunt")?.houseNumber, null);
  assert.ok(parseAddressQuery("Fox Hunt")?.namePrefixes.includes("FOX HUNT"));
  assert.deepEqual(parseAddressQuery("Palm Lane")?.suffixes, ["LN"]);
  assert.deepEqual(parseAddressQuery("Palm Court")?.suffixes, ["CT"]);
  assert.equal(parseAddressQuery("47"), null);
  assert.equal(parseAddressQuery("2727 FOX%"), null);
});

test("does not send incomplete addresses or SQL wildcard input", async (t) => {
  clearAddressSuggestionCache();
  const fetch = t.mock.method(globalThis, "fetch", async () => response([]));
  for (const value of ["", "4790", "Fo", "4790 FOX%", "4790 X' OR 1=1--"]) {
    assert.deepEqual(await suggestAddresses(value, signal()), []);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("queries the situs layer with structured fields and returns building choices for condos", async (t) => {
  clearAddressSuggestionCache();
  let requestUrl, options;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requestUrl = new URL(url);
    options = init;
    return response([
      oceanCondo(1, "1507", "Highland Beach", "33487", "24434628510001507"),
      oceanCondo(2, "1508", "Highland Beach", "33487", "24434628510001508"),
      oceanCondo(3, "1010", "Boca Raton", "33431", "06434716080011010"),
      oceanCondo(4, "1020", "Boca Raton", "33431", "06434716080011020"),
    ]);
  });

  const matches = await suggestAddresses("2727 s ocean", signal());
  assert.equal(matches.length, 2);
  assert.equal(matches.every((item) => item.kind === "building"), true);
  assert.ok(matches.some((item) => item.address.includes("Highland Beach") && item.address.includes("33487")));
  assert.ok(matches.some((item) => item.address.includes("Boca Raton") && item.address.includes("33431")));
  assert.ok(matches.every((item) => (item.unitCount ?? 0) >= 2));
  assert.match(requestUrl.pathname, /open_data_v2\/FeatureServer\/0\/query$/);
  assert.equal(requestUrl.searchParams.get("outFields"), "OBJECTID,PCN,STREET_NO,STREET_NAME,STREET_SUFFIX,APARTMENT,CITY,ZIP_CODE,ZIP_CITY,BUILDING_NUM,FLOOR");
  assert.equal(requestUrl.searchParams.get("returnGeometry"), "false");
  assert.match(requestUrl.searchParams.get("where"), /STREET_NO = '2727'/);
  assert.match(requestUrl.searchParams.get("where"), /UPPER\(STREET_NAME\) LIKE 'OCEAN%'/);
  assert.equal(options.credentials, "omit");
  assert.equal(options.referrerPolicy, "no-referrer");
});

test("street-only and city/ZIP filters use situs CITY/ZIP_CODE, never PROPINFO mailing fields", async (t) => {
  clearAddressSuggestionCache();
  const queries = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    queries.push(new URL(url).searchParams.get("where"));
    return response([
      feature(10, {
        PCN: "00424636010050080",
        STREET_NO: "4790",
        STREET_NAME: "Fox Hunt",
        STREET_SUFFIX: "Trl",
        APARTMENT: null,
        CITY: "Unincorporated",
        ZIP_CODE: "33487",
        ZIP_CITY: "Boca Raton",
      }),
    ]);
  });

  const streetOnly = await suggestAddresses("Fox Hunt", signal());
  assert.equal(streetOnly.length, 1);
  assert.equal(streetOnly[0].kind, "parcel");
  assert.equal(streetOnly[0].parcelNumber, "00424636010050080");
  assert.match(streetOnly[0].address, /Unincorporated · Boca Raton/);
  assert.match(queries[0], /UPPER\(STREET_NAME\) LIKE 'FOX HUNT%'/);
  assert.doesNotMatch(queries[0], /CITYNAME|ZIP1/);

  clearAddressSuggestionCache();
  await suggestAddresses("Ocean Blvd, Highland Beach 33487", signal());
  assert.match(queries[1], /UPPER\(CITY\) LIKE 'HIGHLAND BEACH%'/);
  assert.match(queries[1], /ZIP_CODE = '33487'/);
});

test("Lane versus Court suffixes are queried separately", async (t) => {
  clearAddressSuggestionCache();
  const queries = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    queries.push(new URL(url).searchParams.get("where"));
    return response([]);
  });
  await suggestAddresses("Palm Lane", signal());
  await suggestAddresses("Palm Court", signal());
  assert.match(queries[0], /UPPER\(STREET_SUFFIX\) = 'LN'/);
  assert.match(queries[1], /UPPER\(STREET_SUFFIX\) = 'CT'/);
});

test("unit lists for a building are searchable and not capped at five", async (t) => {
  clearAddressSuggestionCache();
  t.mock.method(globalThis, "fetch", async () => response(
    Array.from({ length: 12 }, (_, i) => oceanCondo(
      i + 1,
      String(1000 + i),
      "Highland Beach",
      "33487",
      `2443462851000${String(1000 + i).padStart(4, "0")}`,
    )),
  ));

  const units = await suggestUnitsForBuilding({
    streetNo: "2727",
    streetName: "Ocean",
    streetSuffix: "Blvd",
    city: "Highland Beach",
    zip: "33487",
    zipCity: "Highland Beach",
  }, "100", signal());

  assert.equal(units.length, 12);
  assert.ok(units.every((item) => item.kind === "parcel" && item.parcelNumber));
  const filtered = await suggestUnitsForBuilding({
    streetNo: "2727",
    streetName: "Ocean",
    streetSuffix: "Blvd",
    city: "Highland Beach",
    zip: "33487",
    zipCity: "Highland Beach",
  }, "1005", signal());
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].unit, "1005");
});

test("normalizes capitalization, commas, apostrophes, and unit markers", async (t) => {
  clearAddressSuggestionCache();
  const queries = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    queries.push(new URL(url).searchParams.get("where"));
    return response([]);
  });
  await suggestAddresses("2727 South Ocean Boulevard Unit 1507, Highland Beach, FL", signal());
  assert.match(queries[0], /STREET_NO = '2727'/);
  assert.match(queries[0], /UPPER\(STREET_NAME\) LIKE 'OCEAN%'/);
  assert.match(queries[0], /UPPER\(STREET_SUFFIX\) = 'BLVD'/);
  assert.match(queries[0], /UPPER\(APARTMENT\) LIKE '1507%'/);
  await suggestAddresses("111 O'Neal Road", signal());
  assert.match(queries[1], /O''NEAL/);
  await suggestAddresses("4790 Fox Hunt Trai", signal());
  assert.match(queries[2], /UPPER\(STREET_SUFFIX\) = 'TRL'/);
});

test("malformed rows are excluded and mailing-only fields are never required", async (t) => {
  clearAddressSuggestionCache();
  t.mock.method(globalThis, "fetch", async () => response([
    null,
    {},
    feature(1, { STREET_NO: "", STREET_NAME: "Main", CITY: "Boca Raton", ZIP_CODE: "33432", PCN: "06434728010001360" }),
    feature(2, { STREET_NO: "123", STREET_NAME: "Main", STREET_SUFFIX: "St", CITY: "", ZIP_CODE: "33432", PCN: "06434728010001361" }),
    feature(3, {
      STREET_NO: "123",
      STREET_NAME: "Main",
      STREET_SUFFIX: "St",
      CITY: "Unincorporated",
      ZIP_CODE: "33487",
      ZIP_CITY: "Boca Raton",
      PCN: "00424636010050080",
      APARTMENT: null,
    }),
  ]));
  const matches = await suggestAddresses("123 main", signal());
  assert.equal(matches.length, 1);
  assert.equal(matches[0].parcelNumber, "00424636010050080");
  assert.match(matches[0].address, /Unincorporated · Boca Raton/);
});

test("caches completed lookups in memory but never caches provider errors", async (t) => {
  clearAddressSuggestionCache();
  const fetch = t.mock.method(globalThis, "fetch", async () => response([
    feature(5, {
      PCN: "00424636010050080",
      STREET_NO: "5281",
      STREET_NAME: "Ascot",
      STREET_SUFFIX: "Bnd",
      CITY: "Boca Raton",
      ZIP_CODE: "33496",
      ZIP_CITY: "Boca Raton",
      APARTMENT: null,
    }),
  ]));
  const first = await suggestAddresses("5281 ascot", signal());
  assert.deepEqual(await suggestAddresses("5281 ASCOT", signal()), first);
  assert.equal(fetch.mock.callCount(), 1);
  fetch.mock.mockImplementation(async () => new Response(JSON.stringify({ error: { code: 500 } })));
  await assert.rejects(suggestAddresses("555 oak", signal()), /Unexpected address response/);
  fetch.mock.mockImplementation(async () => response([]));
  assert.deepEqual(await suggestAddresses("555 oak", signal()), []);
  assert.equal(fetch.mock.callCount(), 3);
});

test("HTTP failures surface as service errors", async (t) => {
  clearAddressSuggestionCache();
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response("error", { status: 503 }));
  await assert.rejects(suggestAddresses("778 oak", signal()), /unavailable/);
  fetch.mock.mockImplementation(async () => new Response("not json"));
  await assert.rejects(suggestAddresses("778 oak", signal()));
});

test("propagates cancellation and does not request an already aborted lookup", async (t) => {
  clearAddressSuggestionCache();
  const fetch = t.mock.method(globalThis, "fetch", (_url, { signal: requestSignal }) => new Promise((_, reject) => {
    requestSignal.addEventListener("abort", () => reject(requestSignal.reason), { once: true });
  }));
  const controller = new AbortController();
  const lookup = suggestAddresses("777 oak", controller.signal);
  controller.abort();
  await assert.rejects(lookup, { name: "AbortError" });
  await assert.rejects(suggestAddresses("777 oak", controller.signal), { name: "AbortError" });
  assert.equal(fetch.mock.callCount(), 1);
});

test("bounds a stalled county request with a timeout", async (t) => {
  clearAddressSuggestionCache();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis, "fetch", (_url, { signal: requestSignal }) => new Promise((_, reject) => {
    requestSignal.addEventListener("abort", () => reject(requestSignal.reason), { once: true });
  }));
  const lookup = suggestAddresses("776 oak", signal());
  t.mock.timers.tick(12_000);
  await assert.rejects(lookup, { name: "AbortError" });
});

test("keeps different parcels sharing one street address as separate choices", async (t) => {
  clearAddressSuggestionCache();
  t.mock.method(globalThis, "fetch", async () => response([
    feature(901, {
      PCN: "00424636010050081",
      STREET_NO: "901",
      STREET_NAME: "Main",
      STREET_SUFFIX: "St",
      CITY: "Boca Raton",
      ZIP_CODE: "33432",
      ZIP_CITY: "Boca Raton",
      APARTMENT: null,
    }),
    feature(902, {
      PCN: "00424636010050082",
      STREET_NO: "901",
      STREET_NAME: "Main",
      STREET_SUFFIX: "St",
      CITY: "Boca Raton",
      ZIP_CODE: "33432",
      ZIP_CITY: "Boca Raton",
      APARTMENT: null,
    }),
  ]));
  const matches = await suggestAddresses("901 main", signal());
  assert.equal(matches.length, 1);
  assert.equal(matches[0].kind, "building");
  assert.equal(matches[0].unitCount, 2);
});
