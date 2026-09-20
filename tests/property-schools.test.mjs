import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSchoolResult, addSchoolDirectory, fetchSchools, SCHOOL_BOUNDARIES, SCHOOL_DIRECTORY } from '../src/lib/property-research.ts';

const metadata = { name: 'SACSY2026_2027', editingInfo: { lastEditDate: Date.UTC(2026, 5, 1) } };
const data = (changes = {}) => ({ features: [{ attributes: { elem: 'CALUSA', middle: 'OMNI', high: 'SPANISH RIVER', msid_elem: '1911', msid_midd: '1991', msid_high: '1681', info: '', ...changes } }] });
const point = { x: -80.118487, y: 26.413049, sourceUrl: 'https://county.example/point' };
const parse = (body = data(), meta = metadata) => parseSchoolResult(body, meta, 'https://district.example/result');

test('shows all three assigned levels and school year from district metadata', () => {
  const r = parse();
  assert.deepEqual(r.schools.map(s => [s.level, s.name, s.id]), [['Elementary school', 'CALUSA', '1911'], ['Middle school', 'OMNI', '1991'], ['High school', 'SPANISH RIVER', '1681']]);
  assert.equal(r.schoolYear, '2026–2027'); assert.equal(r.sourceUpdated, '2026-06-01'); assert.ok(r.retrievedAt);
  assert.equal(parse(data(), { name: 'School zones' }).schoolYear, null);
});
test('preserves grade-specific district notes and missing school fields', () => {
  const r = parse(data({ elem: 'WEST RIVIERA / BETHUNE', info: 'PK–2: West Riviera; 3–5: Bethune', middle: null, msid_midd: null }));
  assert.equal(r.note, 'PK–2: West Riviera; 3–5: Bethune');
  assert.equal(r.schools[1].name, null); assert.equal(r.schools[1].id, null);
  assert.equal(r.schools[2].name, 'SPANISH RIVER');
});
test('empty, overlapping, malformed, and truncated zones never become a guessed assignment', () => {
  for (const body of [{ features: [] }, { features: [...data().features, ...data().features] },
    { ...data(), exceededTransferLimit: true }, { error: { code: 500 } }, { features: [null] }, data({ elem: null, middle: null, high: null })]) {
    assert.throws(() => parse(body));
  }
  assert.throws(() => parse(data(), { error: { code: 500 } }));
});
test('school links require an exact school ID and a safe official HTTPS domain', () => {
  const records = { features: [
    { attributes: { msid: '1911', website: 'https://cale.palmbeachschools.org', address: 'Official campus address' } },
    { attributes: { msid: '1991', website: 'javascript:alert(1)' } },
    { attributes: { msid: '1681', website: 'https://palmbeachschools.org.evil.example/' } },
    { attributes: { msid: '9999', name: 'NEARBY SCHOOL', website: 'https://other.palmbeachschools.org' } },
  ] };
  const r = addSchoolDirectory(parse(), records, 'https://directory.example');
  assert.equal(r.schools[0].website, 'https://cale.palmbeachschools.org/');
  assert.equal(r.schools[0].address, 'Official campus address');
  assert.equal(r.schools[1].website, null); assert.equal(r.schools[2].website, null);
  const duplicate = { features: [records.features[0], records.features[0]] };
  assert.equal(addSchoolDirectory(parse(), duplicate, '').schools[0].website, null);
});
test('queries the parcel-matched point and verified IDs; optional directory failure preserves assignments', async (t) => {
  const urls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    urls.push(new URL(url)); assert.equal(options.credentials, 'omit');
    if (url.startsWith(SCHOOL_DIRECTORY)) return new Response('down', { status: 503 });
    return new Response(JSON.stringify(url.includes('/query?') ? data() : metadata));
  });
  const result = await fetchSchools(point, new AbortController().signal);
  const q = urls.find(u => u.pathname === new URL(SCHOOL_BOUNDARIES).pathname + '/query');
  assert.equal(q.searchParams.get('geometry'), `${point.x},${point.y}`);
  assert.equal(q.searchParams.get('spatialRel'), 'esriSpatialRelIntersects');
  assert.equal(urls[2].searchParams.get('where'), "msid IN ('1911','1991','1681')");
  assert.equal(result.directoryUnavailable, true); assert.equal(result.schools[0].name, 'CALUSA');
  await assert.rejects(fetchSchools({ x: NaN, y: 26.4 }, new AbortController().signal));
});
test('cancelled school request cannot return a late assignment', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => { controller.abort(); return new Response(JSON.stringify(data())); });
  await assert.rejects(fetchSchools(point, controller.signal), { name: 'AbortError' });
});
