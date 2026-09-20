import assert from "node:assert/strict";
import { test } from "node:test";
import { suggestAddresses } from "../src/lib/address-autocomplete.ts";

const signal = () => new AbortController().signal;
const feature = (id, street, city = "BOCA RATON") => ({
  attributes: { OBJECTID: id, SITE_ADDR_STR: street, MUNICIPALITY: city },
});
const response = (features) => new Response(JSON.stringify({ features }));

test("does not send incomplete addresses or SQL wildcard input", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => response([]));
  for (const value of ["", "4790", "Fox Hunt", "4790 FOX%", "4790 X' OR 1=1--"]) {
    assert.deepEqual(await suggestAddresses(value, signal()), []);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("requests only situs address fields, preserves directions/units, deduplicates and caps at five", async (t) => {
  let requestUrl, options;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requestUrl = new URL(url); options = init;
    return response([
      feature(1, "2727 S OCEAN BLVD 1507", "HIGHLAND BEACH"),
      feature(2, "2727 S OCEAN BLVD 1507", "HIGHLAND BEACH"),
      ...Array.from({ length: 6 }, (_, i) => feature(i + 3, `2727 S OCEAN BLVD ${i + 100}`, "HIGHLAND BEACH")),
    ]);
  });
  const matches = await suggestAddresses("2727 s ocean", signal());
  assert.equal(matches.length, 5);
  assert.equal(matches[0].address, "2727 S OCEAN BLVD 1507, HIGHLAND BEACH, FL");
  assert.equal(requestUrl.searchParams.get("outFields"), "OBJECTID,SITE_ADDR_STR,MUNICIPALITY");
  assert.equal(requestUrl.searchParams.get("returnGeometry"), "false");
  assert.match(requestUrl.searchParams.get("where"), /STREET_NUMBER = 2727 AND .*SITE_ADDR_STR LIKE '2727 S OCEAN%'/);
  assert.equal(options.credentials, "omit");
  assert.equal(options.referrerPolicy, "no-referrer");
});

test("normalizes suffixes, directions and explicit unit markers while escaping apostrophes", async (t) => {
  const queries = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    queries.push(new URL(url).searchParams.get("where"));
    return response([]);
  });
  await suggestAddresses("2727 South Ocean Boulevard Unit 1507, Highland Beach, FL", signal());
  assert.match(queries[0], /2727 S OCEAN BLVD 1507%/);
  await suggestAddresses("111 O'Neal Road", signal());
  assert.match(queries[1], /111 O''NEAL RD%/);
  await suggestAddresses("4790 Fox Hunt Trai", signal());
  assert.match(queries[2], /4790 FOX HUNT TRL%/);
  await suggestAddresses("100 United Way", signal());
  assert.match(queries[3], /100 UNITED WAY%/);
});

test("malformed rows are excluded and the selected address never uses owner mailing fields", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response([
    null, {}, feature(1, "", "BOCA RATON"), feature(2, "123 MAIN ST", ""),
    { attributes: { OBJECTID: 3, SITE_ADDR_STR: "123 MAIN ST", MUNICIPALITY: "UNINCORPORATED", CITYNAME: "CHICAGO", ZIP1: "60601" } },
  ]));
  assert.deepEqual(await suggestAddresses("123 main", signal()), [
    { id: "3", address: "123 MAIN ST, Palm Beach County, FL" },
  ]);
});

test("caches completed lookups in memory but never caches provider errors", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => response([feature(5, "5281 ASCOT BND")]));
  const first = await suggestAddresses("5281 ascot", signal());
  assert.deepEqual(await suggestAddresses("5281 ASCOT", signal()), first);
  assert.equal(fetch.mock.callCount(), 1);
  fetch.mock.mockImplementation(async () => new Response(JSON.stringify({ error: { code: 500 } })));
  await assert.rejects(suggestAddresses("555 oak", signal()), /Unexpected address response/);
  fetch.mock.mockImplementation(async () => response([]));
  assert.deepEqual(await suggestAddresses("555 oak", signal()), []);
  assert.equal(fetch.mock.callCount(), 3);
});

test("HTTP and malformed JSON failures surface for manual-entry fallback", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response("error", { status: 503 }));
  await assert.rejects(suggestAddresses("778 oak", signal()), /unavailable/);
  fetch.mock.mockImplementation(async () => new Response("not json"));
  await assert.rejects(suggestAddresses("778 oak", signal()));
});

test("propagates cancellation and does not request an already aborted lookup", async (t) => {
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
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis, "fetch", (_url, { signal: requestSignal }) => new Promise((_, reject) => {
    requestSignal.addEventListener("abort", () => reject(requestSignal.reason), { once: true });
  }));
  const lookup = suggestAddresses("776 oak", signal());
  t.mock.timers.tick(12_000);
  await assert.rejects(lookup, { name: "AbortError" });
});
