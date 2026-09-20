# Property Passport

Live county property-record lookup by Premier Estates for Palm Beach County, Florida.

## Current functionality

Enter an address, choose its county suggestion (including the correct unit), choose your purpose, and retrieve the selected parcel’s public record. Manual entry searches for matching suggestions and requires confirmation; a prefix is never silently treated as an exact match.

The live report includes available recorded owner names, parcel identifier, property use, subdivision, county parcel area, assessment values, and the latest sale entry in the source. It shows the retrieval time and a link to the exact county response. Source update date and valuation year are not supplied. County market value is not a current market-price estimate; taxable value is not a tax bill.

Year built, living area, bedrooms/bathrooms, permits, violations, liens, tax bills, flood and evacuation data, insurance, association costs, and renovation feasibility are not connected. The report labels these gaps. It never fills them with sample figures. Older demo components remain in the repository but are not used by the live application.

## Source and matching

Public [Palm Beach County PAO.PROPINFO table](https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/Tables/MapServer/1). No API key or paid service is required. The browser sends queries directly to the county, without credentials or referrers.

Autocomplete pauses 350 ms and requests address fields plus the parcel number. Up to five distinct addresses are shown. Directions and unit numbers are preserved. Completed suggestion queries are cached in memory for five minutes (40 queries maximum); no persistent address storage. The county service has taken 5–9 seconds in checks, with a 12-second suggestion timeout.

Record requests use an exact 17-digit parcel number, require one unique result, and compare its returned address with the selected address. They time out after 20 seconds and are cancelled when navigating away. Failed or mismatched results show retry/change-address options, never another property. Record requests bypass the browser cache. Owner names are displayed only when the source confidentiality flag is N. Owner mailing-address fields are never used as the property location. There is no reliable situs ZIP code, valuation year, or building-year field in this table; YEAR_ADDED is not treated as year built. PCN prefix 00 identifies the unincorporated county; other permitting jurisdictions require confirmation.

## Development and checks

Use Node 22.18+.

```bash
npm ci
npm test
npm run lint
npm run build
npm run dev
```

Tests cover parcel/address matching, ambiguous and absent records, confidentiality, missing versus zero values, cancellation/timeouts, and address suggestions.

## Deploy

Existing GitHub repository: https://github.com/jpurland/PropertyPassport

Cloudflare Worker: `propertypassport`. Root directory `/`, production branch `main`, build command `npm run build`, deploy command `npx wrangler deploy`. Next.js static export produces `out/`; existing `wrangler.toml` serves it.

The approved custom domain is palmbeachpropertypassport.com. Preserve its existing connection. Keep robots.txt and X-Robots-Tag exclusions until a separate indexing decision. This increment adds no paid integrations, customer accounts, lead submission, or payments.
