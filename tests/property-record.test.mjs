import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePropertyRecord, fetchPropertyRecord } from '../src/lib/property-record.ts';
const parcel = '00424636010050080';
const address = '4790 FOX HUNT TRL, BOCA RATON, FL';
const data = (overrides = {}) => ({ features: [{ attributes: {
  PARCEL_NUMBER: parcel, SITE_ADDR_STR: '4790 FOX HUNT TRL', MUNICIPALITY: 'BOCA RATON',
  CONFID_FLG: 'N', OWNER_NAME1: 'TEST OWNER', OWNER_NAME2: null, PROPERTY_USE: 'SINGLE FAMILY',
  ASSESSED_VAL: 100, TOTAL_MARKET: 200, TOTAL_TAXABLE: 0,
  SALE_DATE: Date.UTC(2024, 2, 15), PRICE: 300, ...overrides,
} }] });
const parse = (body) => parsePropertyRecord(body, parcel, address, 'https://county.example/source');

test('matches the actual parcel and address, preserving zero while missing fields stay null', () => {
  const r = parse(data());
  assert.equal(r.parcelNumber, parcel); assert.equal(r.address, address);
  assert.equal(r.taxableValue, 0); assert.equal(r.acres, null); assert.equal(r.subdivision, null);
  assert.deepEqual(r.owners, ['TEST OWNER']); assert.equal(r.saleDate, '2024-03-15');
  assert.equal(r.salePrice, 300); assert.ok(r.retrievedAt);
});
test('rejects missing, duplicate, incomplete and wrong-property records', () => {
  for (const body of [{ features: [] }, { features: [...data().features, ...data().features] },
    data({ PARCEL_NUMBER: '00424636010050081' }), data({ SITE_ADDR_STR: '4791 FOX HUNT TRL' }),
    data({ SITE_ADDR_STR: '4790 FOX HUNT TRL 2' }), data({ MUNICIPALITY: null }),
    { error: { code: 500 } }, { ...data(), exceededTransferLimit: true }]) {
    assert.throws(() => parse(body));
  }
});
test('withholds owner fields when confidentiality flag is protected or unknown', () => {
  for (const flag of ['Y', null, '', 'U']) {
    const r = parse(data({ CONFID_FLG: flag })); assert.deepEqual(r.owners, []); assert.equal(r.ownerWithheld, true);
  }
});
test('does not substitute mailing details or fabricate values and sale dates', () => {
  const r = parse(data({ ASSESSED_VAL: null, TOTAL_MARKET: -1, ACRES: '0.2', SALE_DATE: 0, PRICE: 500,
    PADDR1: 'OTHER ADDRESS', CITYNAME: 'CHICAGO', ZIP1: '60601', YEAR_ADDED: '1998' }));
  assert.equal(r.address, address); assert.equal(r.assessedValue, null); assert.equal(r.countyMarketValue, null);
  assert.equal(r.saleDate, null); assert.equal(r.salePrice, null); assert.equal(r.acres, null);
  assert.equal('yearBuilt' in r, false);
});
test('queries exact parcel only, never owners by name or wildcard matching', async (t) => {
  let url, options;
  t.mock.method(globalThis, 'fetch', async (u, o) => { url = new URL(u); options = o; return new Response(JSON.stringify(data())); });
  const r = await fetchPropertyRecord({ parcelNumber: parcel, address }, new AbortController().signal);
  assert.equal(url.searchParams.get('where'), `PARCEL_NUMBER = '${parcel}'`);
  assert.equal(url.searchParams.get('resultRecordCount'), '2');
  assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'omit');
  assert.equal(r.parcelNumber, parcel);
  await assert.rejects(fetchPropertyRecord({ parcelNumber: "' OR 1=1", address }, new AbortController().signal));
});
test('HTTP failure does not produce a report', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('error', { status: 503 }));
  await assert.rejects(fetchPropertyRecord({ parcelNumber: parcel, address }, new AbortController().signal), /unavailable/);
});
test('cancellation and timeout abort county lookup', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', (_url, {signal}) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))));
  const controller = new AbortController();
  const pending = fetchPropertyRecord({ parcelNumber: parcel, address }, controller.signal);
  controller.abort(); await assert.rejects(pending, { name: 'AbortError' });
  const stalled = fetchPropertyRecord({ parcelNumber: parcel, address }, new AbortController().signal);
  t.mock.timers.tick(20_000); await assert.rejects(stalled, /took too long/);
});
