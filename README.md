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

One labeled sample property in Boca Raton. Typing an address does **not** look that address up. Contact forms are not sent. Documents stay in the browser tab.

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
