# Website performance and enquiries

## Enquiry delivery

The Next.js `/api/enquiries` route saves enquiries in `AERO_DATA_DIR/enquiries.sqlite3` before attempting SMTP delivery. Only the property desk admin key can read submissions. The existing Rust database and project API remain separate. Contact data is retained for 180 days; throttling uses HMAC identifiers and expires after an hour. Back up both SQLite databases using SQLite's backup facility, not by copying an active WAL database alone.

Set the following in a root-readable systemd EnvironmentFile (never commit values):

- `AERO_DATA_DIR=/var/lib/gaamup`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_USER=enquiry@panvibes.com`
- `SMTP_PASSWORD` (provider app password)
- `ENQUIRY_RECIPIENT=bhavesh@panvibes.com`
- `ENQUIRY_IP_SALT` (random secret)
- `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (production widget, restricted to apex and www)

Install the `gaamup-enquiry-retry` timer to retry deferred deliveries. Five failed attempts are shown as `failed` in the property desk; delivered messages are shown as `sent`. Submitted enquiries remain saved when email is unavailable. Fixed message IDs support mail-provider duplicate detection. Delivery is at least once; SMTP cannot guarantee exactly once if the service stops immediately after acceptance.

Turnstile is enforced server-side when its secret is configured. If no widget keys are installed, forms still use origin validation, bounded inputs, a honeypot, persistent throttling and Nginx throttling; this is **not** a completed CAPTCHA installation. Never deploy test widget keys. Production hosts must match the Siteverify result and its `enquiry` action. Reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

## Reverse proxy

`gaamup-rate-limits.conf` goes in `/etc/nginx/conf.d/`. `gaamup-cloudflare-realip.conf` goes in `/etc/nginx/snippets/` and must be refreshed against https://www.cloudflare.com/ips/. Only Cloudflare IPs can supply the effective visitor IP. The locations snippet routes the two enquiry endpoints to Next on 4173; existing APIs continue to Rust on 4000. Keep API responses out of CDN caches. Test `nginx -t` before reload.

Content Security Policy permits the site's inline Next bootstrap, local Draco WASM/workers, local iframes and Turnstile. It disallows plugins, cross-origin framing and arbitrary external script hosts. Do not turn on Cloudflare Rocket Loader for the Three.js viewers. Cloudflare SSL should use Full (strict).

## Model delivery

The colony viewers request versioned `.bin` URLs containing GLB data. Cloudflare caches this extension; `gzip_static` uses precompressed counterparts generated on the server. The original detailed Venus and Elements facades are byte-identical. The Venus base is 2,887,984 bytes versus 32,302,220 bytes before encoding, with all 971,836 triangles retained. Sai facades retain six source photographs and 42,416 triangles. Geometry, HDR and material downloads overlap. Per-frame Venus roof labels reuse precomputed positions, building clicks use bounds, and the railway skips offscreen/paused work.

Baseline cold transfers from the development machine before release: Venus base 12.63s / 32.3 MB, Venus facades 3.33s / 7.63 MB, Elements 2.88s / 6.57 MB, Sai facades 5.83s / 5.38 MB. These are transfer times on one connection, not promises about total ready time. Measure production browser readiness on target devices after cache warm-up.

Run `npm test`, `npm run test:backend`, `npm run build`, `npm audit`. Do not include `.next`, `node_modules`, `.env`, key files, render previews, backups or Blender source in Git. Retain the previous deployment for rollback, keeping databases and environment outside releases.

HTML responses append `no-transform` to prevent Cloudflare email rewriting from changing React markup during hydration. The shared security-header snippet must be installed alongside the locations snippet. Cloudflare documents this behavior at https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/.
