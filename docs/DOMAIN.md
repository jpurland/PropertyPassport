# Custom domain — wait for approval

Purchased: `palmbeachpropertypassport.com` (Cloudflare / John Purland).

This review demo deploys to the existing Cloudflare Worker `propertypassport`.
Do not attach the custom domain until the mobile and desktop review is approved.

After approval:

1. Cloudflare Dashboard → Workers & Pages → `propertypassport`
2. Custom domains / routes → add `palmbeachpropertypassport.com`
3. Add `www.palmbeachpropertypassport.com`
4. Confirm SSL is active
5. Confirm `X-Robots-Tag: noindex` still applies until a public launch is requested

Do not treat domain attachment as a production launch or as paid-service enablement.
