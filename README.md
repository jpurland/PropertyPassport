# Property Passport

Live county property-record lookup by Premier Estates for Palm Beach County, Florida.

## Current functionality

Enter an address, choose its county suggestion (including the correct unit), choose your purpose, and retrieve the selected parcel’s public record. Manual entry searches for matching suggestions and requires confirmation; a prefix is never silently treated as an exact match.

The live report includes available recorded owner names, parcel identifier, property use, subdivision, county parcel area, assessment values, and the latest sale entry in the source. It shows the retrieval time and a link to the exact county response. Source update date and valuation year are not supplied. County market value is not a current market-price estimate; taxable value is not a tax bill.

The report also checks FEMA flood zones and county hurricane evacuation zones at a parcel-matched county address point, plus county zoning for unincorporated parcels. These are point-based map results, not full-parcel determinations. Each lookup has independent loading/error/empty states, a retrieval time, and an exact source link.

Permit research routes PCN prefix 00 to the county’s parcel-specific ePZB page and 06 to Boca eHub. Other municipalities are explicitly unsupported. County guest permit search uses reCAPTCHA; the app does not bypass it or import unverified permit rows. Permit records and inspections must be reviewed on the official website. A copy-PCN action and review checklist support this step.

A Zillow address-search card opens the selected address (including its unit) on Zillow. It does not embed Zillow, invent a property ID, scrape listings, or display a Zestimate. Inline Zestimate integration requires approved Zillow API access, which is not configured.

Official research links open the parcel-specific Property Appraiser page and Tax Collector property-tax resources. Year built, living area, bedrooms/bathrooms, permit rows, violations, liens, tax bills, insurance, association costs, and renovation feasibility are not imported. The report labels these gaps. It never fills them with sample figures. Older demo components remain in the repository but are not used by the live application.

## Source and matching

Public [Palm Beach County PAO.PROPINFO table](https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/Tables/MapServer/1). No API key or paid service is required. The browser sends queries directly to the county, without credentials or referrers.

Autocomplete pauses 350 ms and requests address fields plus the parcel number. Up to five distinct addresses are shown. Directions and unit numbers are preserved. Completed suggestion queries are cached in memory for five minutes (40 queries maximum); no persistent address storage. The county service has taken 5–9 seconds in checks, with a 12-second suggestion timeout.

Record requests use an exact 17-digit parcel number, require one unique result, and compare its returned address with the selected address. They time out after 20 seconds and are cancelled when navigating away. Failed or mismatched results show retry/change-address options, never another property. Record requests bypass the browser cache. Owner names are displayed only when the source confidentiality flag is N. Owner mailing-address fields are never used as the property location. There is no reliable situs ZIP code, valuation year, or building-year field in this table; YEAR_ADDED is not treated as year built. PCN prefix 00 identifies the unincorporated county and 06 the City of Boca Raton; confirm boundary changes or historical jurisdiction with the permitting office.

## Additional verified sources

- County situs point: `OpenData/open_data_v2/FeatureServer/0`, matched with exact `PCN`, one result, WGS84 coordinates. Missing, ambiguous, truncated, and out-of-area results block map lookups.
- FEMA NFHL flood hazard polygons: `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28`.
- County evacuation zones: `OpenData/Public_Safety_Open_Data/MapServer/0`.
- Unincorporated county zoning: `OpenData/Planning_Open_Data/MapServer/9`.
- County layer URLs use `https://maps.co.palm-beach.fl.us/arcgis/rest/services/`.
- County permit route: `https://pbc.gov/iPZB.Building/guest/pcnpermits/{PCN}`. This is an external lookup, not an automatic data feed.
- Boca permit entry point: https://www.myboca.us/2235/Boca-eHub
- Property Appraiser detail: `https://pbcpao.gov/Property/Details?parcelId={PCN}`.
- Tax resources: https://www.pbctax.gov/taxes/property-tax/
- Zillow API access requirements: https://www.zillowgroup.com/developers/api/zestimate/zestimates-api/

Source checks performed September 20, 2026. County/FEMA map requests are credential-free browser GETs with CORS support, 15-second per-request limits, and cancellation on navigation. A source failure is never presented as a successful empty search. Zoning is never requested from the county-only layer for municipal parcels. Successful empty evacuation coverage does not establish that evacuation will never be required. No paid services, keys, proxy, or server runtime were added.

## Development and checks

Use Node 22.18+.

```bash
npm ci
npm test
npm run lint
npm run build
npm run dev
```

Tests cover parcel/address matching, ambiguous and absent records, confidentiality, missing versus zero values, cancellation/timeouts, address suggestions, exact parcel-to-point matching, map data integrity, jurisdiction routing, encoded Zillow address links, and failed/cancelled map requests.

## Deploy

Existing GitHub repository: https://github.com/jpurland/PropertyPassport

Cloudflare Worker: `propertypassport`. Root directory `/`, production branch `main`, build command `npm run build`, deploy command `npx wrangler deploy`. Next.js static export produces `out/`; existing `wrangler.toml` serves it.

The approved custom domain is palmbeachpropertypassport.com. Preserve its existing connection. Keep robots.txt and X-Robots-Tag exclusions until a separate indexing decision. This increment adds no paid integrations, customer accounts, lead submission, or payments.
