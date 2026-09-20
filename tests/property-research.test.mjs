import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePropertyPoint, parseMapResult, fetchPropertyPoint, fetchMapResult, permitSource, zillowSearchUrl } from '../src/lib/property-research.ts';

const parcel = '00424636010050080';
const pointData = () => ({ features: [{ attributes: { PCN: parcel }, geometry: { x: -80.118487, y: 26.413049 } }] });
const source = 'https://source.example/query';
const zone = (attributes) => ({ features: [{ attributes }] });

test('location requires a unique matching parcel and usable local coordinates', () => {
  const p = parsePropertyPoint(pointData(), parcel, source);
  assert.equal(p.x, -80.118487); assert.equal(p.sourceUrl, source);
  for (const body of [{ features: [] }, { features: [...pointData().features, ...pointData().features] },
    { features: [{ attributes: { PCN: '00424636010050081' }, geometry: p }] },
    { features: [{ attributes: { PCN: parcel }, geometry: { x: 940000, y: 720000 } }] },
    { features: [{ attributes: { PCN: parcel }, geometry: { x: null, y: 26.4 } }] },
    { ...pointData(), exceededTransferLimit: true }, { error: { code: 500 } }]) {
    assert.throws(() => parsePropertyPoint(body, parcel, source));
  }
});
test('successful empty map query is distinct from error, invalid and truncated data', () => {
  assert.deepEqual(parseMapResult({ features: [] }, 'evacuation', source).rows, []);
  for (const body of [null, {}, { features: [null] }, { error: { code: 500 } },
    { features: [], exceededTransferLimit: true }, zone({ FNAME: null })]) {
    assert.throws(() => parseMapResult(body, 'evacuation', source));
  }
});
test('preserves all returned zone labels and qualifiers without interpreting them as safe', () => {
  const r = parseMapResult({ features: [
    ...zone({ FLD_ZONE: 'X', ZONE_SUBTY: 'AREA OF MINIMAL FLOOD HAZARD' }).features,
    ...zone({ FLD_ZONE: 'AE', ZONE_SUBTY: null }).features,
  ] }, 'flood', source);
  assert.deepEqual(r.rows, [{ heading: 'Zone X', detail: 'AREA OF MINIMAL FLOOD HAZARD' }, { heading: 'Zone AE', detail: null }]);
  assert.equal(r.sourceUrl, source); assert.ok(r.retrievedAt);
  assert.deepEqual(parseMapResult(zone({ FCODE: 'RS', FNAME: 'SINGLE FAMILY RESIDENTIAL DISTRICT', ZONING_DESC: 'RESIDENTIAL' }), 'zoning', source).rows,
    [{ heading: 'SINGLE FAMILY RESIDENTIAL DISTRICT', detail: 'RS · RESIDENTIAL' }]);
});
test('permit routing uses PCN, never a Boca Raton mailing address', () => {
  assert.equal(permitSource(parcel).url, `https://pbc.gov/iPZB.Building/guest/pcnpermits/${parcel}`);
  assert.equal(permitSource('06434728150120080').name, 'Boca eHub');
  assert.equal(permitSource('12434728150120080').url, null);
  assert.equal(permitSource('../anything').url, null);
});
test('Zillow link encodes the selected address and unit without creating a fake listing ID', () => {
  const address = '  100 MAIN ST #2, BOCA RATON, FL  ';
  const u = new URL(zillowSearchUrl(address));
  assert.equal(u.origin, 'https://www.zillow.com'); assert.equal(u.hash, ''); assert.equal(u.search, '');
  assert.equal(decodeURIComponent(u.pathname), '/homes/100-MAIN-ST-#2,-BOCA-RATON,-FL_rb/');
  assert.equal(u.pathname.includes('zpid'), false);
});
test('queries the exact selected PCN and uses its point for map intersections', async (t) => {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    seen.push({ url: new URL(url), options });
    return new Response(JSON.stringify(seen.length === 1 ? pointData() : zone({ FLD_ZONE: 'X' })));
  });
  const signal = new AbortController().signal;
  const p = await fetchPropertyPoint(parcel, signal);
  await fetchMapResult('flood', p, parcel, signal);
  assert.equal(seen[0].url.searchParams.get('where'), `PCN = '${parcel}'`);
  assert.equal(seen[1].url.searchParams.get('geometry'), `${p.x},${p.y}`);
  assert.equal(seen[1].url.searchParams.get('inSR'), '4326');
  assert.equal(seen[1].options.credentials, 'omit');
  await assert.rejects(fetchPropertyPoint("' OR 1=1", signal));
  await assert.rejects(fetchMapResult('zoning', p, '06434728150120080', signal), /unincorporated/);
  assert.equal(seen.length, 2);
});
test('HTTP failures, cancellation and timeouts never return an empty zone list', async (t) => {
  const signal = new AbortController().signal;
  t.mock.method(globalThis, 'fetch', async () => new Response('down', { status: 503 }));
  await assert.rejects(fetchPropertyPoint(parcel, signal), /unavailable/);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))));
  const controller = new AbortController();
  const pending = fetchPropertyPoint(parcel, controller.signal);
  controller.abort(); await assert.rejects(pending, { name: 'AbortError' });
  const stalled = fetchPropertyPoint(parcel, signal);
  t.mock.timers.tick(15000); await assert.rejects(stalled, /too long/);
});
