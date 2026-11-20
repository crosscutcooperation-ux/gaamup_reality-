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

## Live verification (2026-11-20)

- Release: `/var/www/gaamup-releases/site-20261120`; previous release retained for rollback.
- 74 JavaScript tests, 6 Rust tests, production builds and dependency audit passed (0 known vulnerabilities).
- SMTP authentication and one saved test enquiry to the configured recipient passed; repeated submission did not duplicate the row or delivery.
- All main pages and three project routes return 200; unauthenticated lead reads return 401.
- All four colony binaries returned Cloudflare HIT and matching decoded SHA-256 checksums. Warm transfers on the test connection: Venus base 344,375 compressed bytes / 0.94s, Venus detailed facades 2,542,062 / 1.68s, Elements 5,451,420 / 2.01s, Sai facades 3,561,526 / 1.99s. These are HTTP transfers, not measured browser-ready times.
- Enquiry timer active, origin throttling installed, security headers and HTML no-transform confirmed publicly.

## Navigation and loading release (3.0.1, 2026-11-20)

- Live release: `/var/www/gaamup-releases/site-20261120-polish`; previous complete release retained. No database migrations.
- `/about` and `/contact` are canonical; legacy `.html` routes issue permanent 308 redirects. Word and photo reveals preserve original content and support reduced motion. Back controls have bordered, underlined labels and arrows; route, model and plan waits show loading feedback.
- 79 JavaScript tests and the Next production build passed; native dependency audit reports 0 known vulnerabilities.
- Cloudflare model/decoder cache rule and the IP enquiry rate-limit rule are Active. Production Managed Turnstile is restricted to this domain; validation checks hostname and `enquiry` action. Secret keys are outside the release in the root-readable environment file. Missing tokens return 422 before any enquiry is saved or mailed. The newly generated admin key authenticates successfully; anonymous enquiry reads return 401.
- Elements ground WebP decodes to exactly the same 1254×1254 RGBA pixels as the original PNG, reducing 3,635,569 bytes to 2,490,988. Geometry, materials, textures and render settings retain their full source detail.
- Run `npm ci --ignore-scripts`, then `npm run build:scenes`, `npm test`, and `npm run build` when changing scene JavaScript. esbuild is a pinned development dependency; its optional platform binary works without install scripts. The generated manifest records source hashes; tests reject stale bundles. Commit only the manifest-listed runtime files, not old generated files.
- Viewer JavaScript is bundled into hashed shared chunks with one Three.js runtime. Critical module preloads avoid serial dependency discovery; original editable scene modules remain the source. Nginx caches hashed bundles for one year, supports gzip, and revalidates scene HTML. Keep original module files for tests and maintenance.
- Browser testing found DevTools Fast 4G simulation active: an initial Elements run took 27.690s; after runtime packaging/preload fixes, a warm-cache run took 2.983s. A subsequent fresh-download test with DevTools cache disabled and throttling off reached the full rendered Elements scene at 5.980s; a warm run reached 2.983s. Device and network conditions still affect readiness. Desktop and 400px mobile emulation were visually checked, including the contact form. Turnstile renders its managed human-verification checkbox. Real handset and reduced-motion filmstrip review remain unverified because native browser control is intermittent. No claim of completed motion review.
- The reconstructed forest remains a static photogrammetry mesh; clouds and train remain animated.


## Visible interaction follow-up (3.0.2, 2026-11-20)

- Solid dark return controls use a new CSS revision to avoid reusing a cached stylesheet. Primary site navigation remains reachable during scrolling and is hidden during the full-screen train journey.
- Company entrance setup waits for a painted initial pose and reruns on pathname changes. Text/photo motion preserves all content; reduced motion removes displacement.
- Forest motion adds an attribute and a small vertex-shader offset only for green canopy above local ground. The original scan position arrays, photographic maps, track grounding and topology remain unchanged. Preparation measured 187ms on the development computer; motion pauses offscreen, in hidden tabs and through its pause control.
- Navigation, home search and secure-form preparation show actual pending state. No artificial delay was added. CAPTCHA has an explicit instruction while the Send button waits for verification.
- 82 JavaScript tests, production builds and native dependency audit passed. The enquiry environment and admin key retain 0600 permissions. Delivery test aggregate: one sent enquiry, zero failed/retry rows. Private enquiry reads return 401; both canonical domains use clean company URLs.
- Original supplied building geometry and texture detail are unchanged. The 3.0.1 Elements browser measurements remain 5.980s with local cache disabled and no throttling, 2.983s warm; no universal timing guarantee on other devices or connections.

Admin-key persistence was removed from browser session storage in 3.0.2. A legacy stored key is cleared when the property desk loads; the active credential exists only in page memory and is cleared on Lock or authentication failure. Refreshing requires the key again. Server bearer authorization and role scope are unchanged.

Final live verification: release `site-20261120-visible` serves all seven checked page routes with HTTP 200, legacy company routes redirect, all three viewer documents reference the new return-control CSS revision, and the private admin key authenticates successfully. New forest/navigation/typography were inspected in the local production preview. Final native-browser access failed with `cgWindowNotFound`; a fresh post-deployment visual pass and real-phone timing are unverified.


## Discovery consistency release (3.0.3, 2026-11-20)

- Live release: `site-20261120-discovery-final`; previous `site-20261120-visible` retained for rollback. Persistent enquiries, credentials and databases are unchanged.
- All three homepage pictures now link to their project, with favourite buttons outside the link. Elements loads the same explorer stylesheet and hand guidance as Venus, including its floor hint. Its 360-degree toggle was checked in Brave.
- White cloud banks are hidden in the railway overview; the photographed terrain and track remain unchanged. Clouds still appear during the train descent and are hidden again on return.
- About/Contact retain replaying word and photo entrances; observer tests cover leaving through both viewport edges and returning.
- All 86 JavaScript tests passed locally and both local/server production builds passed. Server unit tests were not runnable in the production dependency-only copy (development packages are omitted); server HTTP checks passed for the candidate and live routes. The public HTML contains three picture links and Elements serves its new hashed bundle.
- Browser verification showed the clear forest overview and shared Elements walkthrough cards, hand pointer and floor-selection hint in the production-build preview. Final public browser checks are recorded below when complete.

Live-only texture failure diagnosed in Brave: CSP `connect-src` blocked the blob fetches used by GLTFLoader/ImageBitmapLoader for embedded images. The loader recovered with absent maps, creating white terrain. Nginx now allows `blob:` for fetch while retaining the explicit network origins and other security directives. `nginx -t` passed and the public header was verified. The live forest was then visually verified with its full photographic textures and no white terrain. Landscape asset URLs carry content hashes, shared by preloading and loading, to prevent stale browser copies.

Final browser verification: the public gaamupproperties.com landscape showed the restored textured clearing without white patches, and the public Elements route showed the Venus-style walkthrough cards, demonstration hand, replay control and active 360-degree rotation.


## Readability, motion and floor feedback (3.0.4, 2026-11-20)

- Live release: `site-20261120-feedback`; previous `site-20261120-discovery-final` retained. Six candidate routes and the public pages were checked. No database, mail or security credential changes.
- The light About CTA now explicitly sets its heading to #2f3229 and body to #505b49 over #eae8df; these foreground/background colours were measured in the preview browser. Search controls use matching sans typography and the three developer names use the same display face.
- Word entrances move horizontally from alternating sides; photos reveal down from their top edge. Motion selectors now explicitly include `:scope.company-motion-ready` because the class is on the scoping root. The previous relative selector did not match that root, leaving the intended scroll transitions inactive. Re-entry resets and replays; reduced motion uses opacity without displacement. Decorative hover movement was removed.
- All three plan controllers show real image-decode pending states for floor, selected 2D house and furnished views. A shared coordinator prevents older pending images from clearing a newer loader, supports close/cancel, and shows a stationary recovery message after failure. Tests exercise delayed images, superseded requests and the actual Venus/Elements controllers.
- Train travel is centred in an 18:9 cinema frame. The final camera distance is 52m at that aspect instead of 70m; bounds tests still fit all twelve complete coaches, including roof/body/bottom corners, at landscape, portrait and wide aspects. No geometry or texture reductions.
- 91 JavaScript tests and local/server production builds passed. Final public HTML/CSS/runtime revisions were checked. Browser control became unavailable during final motion/framing review; the revised scoped motion and cinema composition have not received a final rendered browser review. The earlier preview CTA colour measurement passed.
