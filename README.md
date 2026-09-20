# Property Passport

Find information about a property from various sources.

Simple product name: **Property Passport** (`Property_Passport`).

Review demo by Premier Estates. Sample data only. Not a government record, title search, or appraisal.

## Run

```bash
npm install
npm run build
npx serve out
```

Or `npm run dev` for local development.

## What this preview is

One labeled sample property in Boca Raton. Address autocomplete uses live Palm Beach County address data; selecting an address does **not** retrieve property records for it. Reports still show the sample property. Contact forms are not sent. Documents stay in the browser tab.

## Address suggestions

Start with the house number and street, then select a suggestion or keep a manually entered address. Suggestions cover Palm Beach County, Florida. They use the county's public [PAO address table](https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/Tables/MapServer/1), with no API key or paid service.

The browser sends the street query directly to the county after a 350 ms pause. Requests include address fields only, omit credentials and referrers, cancel when typing changes, and time out after 12 seconds. The service took 5–9 seconds in integration checks; a loading message and manual-entry fallback remain available. Up to five unique suggestions are shown, preserving county street directions and unit numbers. Labels use the municipality and Florida; this source does not provide a reliable situs ZIP code. Addresses are suggestions, not verified deliverability or ownership records.

Completed lookups are cached in memory for five minutes (at most 40 queries), never in persistent browser storage. County coverage and availability are not guaranteed. No fake or sample addresses are substituted when a lookup fails. The **DEMO — SAMPLE DATA** report notices remain in place.

Run provider regression checks with Node 22.18+ using `npm test`.

## Deploy (Cloudflare Worker `propertypassport`)

Framework: **Next.js** with `output: "export"`. Static files land in **`out/`**.

Cloudflare Workers Builds settings for [jpurland/PropertyPassport](https://github.com/jpurland/PropertyPassport):

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

`wrangler.toml` names the existing Worker `propertypassport` and serves `[assets] directory = "./out"`.

```bash
npm run build
npx wrangler deploy
```

Keep the project out of search indexing (`robots.txt` + `X-Robots-Tag`).

Do **not** attach `palmbeachpropertypassport.com` or `www` until the mobile and desktop preview is approved.

## Repository

https://github.com/jpurland/PropertyPassport
