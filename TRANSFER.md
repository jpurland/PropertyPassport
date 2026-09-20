# Transfer Property Passport to GitHub and Cloudflare

This archive is the completed Palm Beach Property Passport DEMO.
It is sample data only. DEMO labels are intentional. Do not present the
sample property as a lookup of a typed address.

Unpack into a clone of https://github.com/jpurland/PropertyPassport
(currently README-only), then push `main`.

```bash
git clone https://github.com/jpurland/PropertyPassport.git
cd PropertyPassport
# copy the files from this ZIP over the README-only tree
git add -A
git status
git commit -m "Add Property Passport Next.js DEMO and Worker propertypassport config."
git push origin main
```

## Verified local build

Framework: Next.js 16 App Router, `output: "export"`.
Static output folder: `out/` (generated; not committed).

```bash
npm install
npm run build
```

`npm run build` was verified in the Cursor job that produced this ZIP.
It emits `out/index.html` and static assets.

Preview locally with `npx serve out` or `npm run dev`.

## Cloudflare Worker `propertypassport`

Workers Builds settings for production branch `main`:

| Setting | Value |
| --- | --- |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

`wrangler.toml` must stay:

```toml
name = "propertypassport"
compatibility_date = "2026-09-20"

[assets]
directory = "./out"
```

The dashboard Worker name must match `propertypassport`.

Manual deploy after a local build:

```bash
npm run build
npx wrangler deploy
```

Do not attach `palmbeachpropertypassport.com` until the DEMO preview is approved.
Keep `robots.txt` and `X-Robots-Tag: noindex` until a public launch is requested.
