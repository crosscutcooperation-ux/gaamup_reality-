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


## Carriage close-up, property search and sales information (3.0.5, 2026-11-20)

- Release: `site-20261120-home-search`; rollback frontend: `site-20261120-feedback`. Source and fallback project records match the live backend update. Previous project records are stored outside releases at `/var/lib/gaamup/release-backups/projects-before-3.0.5.json` with mode 0600. No enquiry or credential changes.
- Supersedes the 3.0.4 whole-train framing per the new sketch: the camera targets the fourth branded carriage and finishes approximately 4.9m beside it at 18:9. Projection tests keep the complete coach, roof and wheels within the frame and require at least 70% frame-width occupancy at landscape aspects. Geometry, textures and the twelve-car consist are unchanged.
- Home search uses a translucent blur material with legible controls, responsive rows and an opaque fallback. City, up to three search terms, BHK and status flow through the existing URL parser and catalog filter. A React DOM interaction test changes all selectors and submits the actual form.
- All three projects have a location section with a lazy Google map and external directions. Sai address: https://saiworlddreams.in/; Venus: https://www.venusskkycity.com/; Elements: supplied Elements brochure, pages 8–9. The Google Maps query uses the named project/site address rather than invented coordinates. CSP frame-src adds only https://www.google.com; script/connect origins remain unchanged.
- Sales data is the user's 2026-11-20 update: ten Sai rows across Castle/Vista/Mist, Spring/Breeze and Meadows; three Venus rows across A and F. Tower F retains its explicit +taxes qualifier and nearing-possession label while the project remains under construction. Elements pricing stays on request. Metro/inventory claims are attributed to the sales update; nearby addresses use developer or supplied brochure sources.
- Starting prices: Sai ₹52.50 L onwards; Venus ₹42.25 L onwards. Backend updates preserve viewer selections, assets, bindings and unrelated manifest fields. New-release seeds retain the supplied records for fresh installations. Cost-sheet links preselect the appropriate project on Contact.
- All 95 JavaScript tests, 6 Rust tests, and local and server production builds passed. Local HTTP rendering checks verified filter controls, all pricing rows/maps and the project-selected contact form. Real browser control remains unavailable; no completed final rendered visual review is claimed.


## Visible photographs and plan loading (3.0.6, 2026-11-20)

- Release: `site-20261120-visible-feedback`; previous `site-20261120-home-search` retained. Project sales data, enquiries, credentials and security settings are unchanged.
- About's four images were present and returned HTTP 200. Fully clipping the observed photograph container to zero prevented a useful intersection, so the reveal never activated. The observed container now has no clip path; the child image carries the downward wipe. About opts into a one-time observer that retains the visible state and unobserves after entry. Reloading establishes a new observer; Contact retains its existing replay behavior.
- Sai's status node was inside the hidden 3D container. It now sits directly inside the visible plan stage for floor/2D/furnished modes. The shared controller marks the stage pending before replacing image src, hides previous image/canvas pixels without changing layout, uses an opaque overlay and waits for a complete paint after decoding and fitting. Newer changes or closing invalidate older work. Errors keep recovery text visible. 3D success clears the pending stage in all three controllers.
- Sai's furnished pair is fully decoded and shown atomically behind the loader; the previous 1.4s build-through animation is removed. Cached-image tests explicitly drive both animation frames before allowing the new view to appear. Controller tests cover delayed floor, apartment and furnished images, hidden ancestors and cancellation.
- The trackside camera moves from 4.9m to 4.65m at 18:9. After the existing 3.6s descent, camera and carriage travel together for 2s over 1.8m. Projection checks retain the complete coach roof and wheels and at least 75% horizontal occupancy at landscape aspects throughout the pass. Descent cloud placements retain the original approach timing. Reduced-motion users retain their abbreviated navigation.
- Rebuilt all 25 current scene runtime modules and revised loader CSS URLs to `plan-feedback-4`; original image/model quality is unchanged. Final test and HTTP verification are recorded below. Browser control is unavailable; no final rendered browser review is claimed.

Verification: all 98 JavaScript tests passed. Both local and server production builds passed. Candidate About, Home, Contact, Venus and Sai routes returned HTTP 200 with the expected content; all three scene documents reference plan-feedback-4. The local About response includes the one-time motion setting and Sai’s loading node is outside the hidden 3D panel.


## Fixed trackside camera (3.0.7, 2026-11-20)

- Release: `site-20261120-fixed-camera`; rollback: `site-20261120-visible-feedback`. Only train framing/timing code, regression assertions and release metadata changed.
- Removes the 3.0.6 camera/target translation during the branding pass. The descent ends in a parked camera; the train alone advances 1.8m over the following 2s before navigation. Camera position, target and quaternion are asserted exactly unchanged at 21 samples over the complete pass and all tested stations.
- Camera distance at 18:9 is 4.35m instead of 4.65m. The passing carriage fills at least 80% of landscape-frame width; its ends may naturally pass through the edges while the roof, wheels and branded carriage centre remain visible. The fixed-camera request supersedes tracking a complete coach horizontally.
- Existing About one-time motion, photo visibility, apartment loaders, sales data, enquiry configuration and security settings are unchanged.

Verification: 98 JavaScript tests and the local production build passed. The fixed-camera tests cover every station and desktop, portrait and wide framing.


## Constant train speed (3.0.8, 2026-11-20)

- Release: `site-20261120-train-speed`; rollback: `site-20261120-fixed-camera`.
- The 3.0.6 pass advanced only 1.8m in 2s (0.9m/s), while the approach covers 21m in 3.6s (5.833m/s). The pass now uses the same shared speed/distance constants as the approach and covers 11.667m in 2s.
- Regression checks measure distance per time just before, across and after the phase boundary and throughout the pass. Camera position, target and rotation remain fixed; closer framing is retained as successive carriages pass through. The same speed continues during the final page-cover transition; the overview retains its original speed. No other behavior or settings changed.

Verification: all 99 JavaScript tests passed, including the new constant-speed boundary regression.


## Google conversation assistant (3.1.0, 2026-11-21)

- Release: `site-20261121-ai-chat`; rollback frontend: `site-20261120-train-speed`. The fixed camera, closer zoom and constant train speed are retained.
- `/api/chat` is a Node route; add its exact Nginx location before `/api/` forwarding to Rust and install the gaamup_chat rate zone. Browser requests use same-origin JSON and bounded alternating user/assistant histories; they cannot choose a model, system prompt, endpoint or credentials.
- Google Gemini REST uses `x-goog-api-key` and stable `gemini-3.1-flash-lite`, verified against the account's available models and a real generated answer. References: https://aistudio.google.com/docs/api-key and https://aistudio.google.com/docs/models/gemini-3.1-flash-lite. No SDK/dependency was added.
- Production key/model are in root-owned 0600 `/etc/gaamup/chat.env`, loaded by the frontend's chat.conf drop-in. Local `.env.local` is 0600 and ignored. Credentials must never be copied into release archives, Git, NEXT_PUBLIC variables, logs, prompts or browser bundles.
- The model receives only current published project facts and a bounded chat history. It asks one useful question at a time, can answer general questions, uses website navigation guidance and does not collect contact details or claim to send enquiries. Known prices/timelines are sales estimates, not promises. Model output is displayed as text; recommendation links are generated from allowlisted published project slugs.
- Chat messages are not stored by the website. The browser keeps up to 20 exchanges in page memory, with up to 11 recent exchanges sent to Google subject to byte limits. New conversation clears it; reload clears it. The UI discloses Google processing. The existing consented enquiry form stays separate.
- Persistent SQLite chat_limits stores only HMAC visitor identifiers and timestamps for up to 1h: 12 requests/minute and 80/hour per visitor, 300/hour site-wide. Nginx adds 20/minute with burst 5. Max request body 32KiB, latest user text 1500 characters, max model output 1000 tokens, 25s provider timeout. Error logs include only event and numeric status. No live chat is fabricated on provider failure; the visitor can retry, browse projects or enquire.
- Rollback: switch to the previous frontend; the chat-only table/environment and exact proxy location are harmless when unused. Existing enquiries, email configuration and admin keys are unchanged.

Verification: all 106 JavaScript tests and local/server production builds passed. Native npm audit reports 0 vulnerabilities. Actual Google replies answered a new-home enquiry, recommended Venus Tower A's listed 2 BHK at ₹52 L for a ₹60 L budget, explained Furnished view/Back to floor, and answered an unrelated science question. UI tests cover greeting, pending state, escaped model text, project links, persistent in-page conversation, enquiry preselection, new chat and retry. The private key is absent from selected source and browser assets. Real browser visual review remains unavailable.

Public verification: the deployed Home, About, Contact, Venus and Sai routes returned HTTP 200 with Ask Gaamup AI. A real two-turn conversation retained the home-search context and recommended the listed Venus 2 BHK option; a separate science question received an on-topic answer. Public chat replies took 3–4s, returned no-store, and cross-site requests returned 403. All 11 referenced browser scripts were retrieved and checked for the private key. Frontend/backend/retry services are active and Nginx validation passed.


## Railway terrain clearance and footer credit (3.1.1, 2026-11-21)

- Release: `site-20261121-terrain-clearance`; rollback: `site-20261121-ai-chat`.
- The smoothed woodland backing terrain protruded by up to 0.478 scene units near Dombivli (route 0.27), covering the railway. After smoothing, the generator now lowers only high backing vertices around the existing route, with a 0.35-unit vertical margin and a feather from 10 to 14 units to accommodate the coarse grid and platform edges. Only 142 vertices were lowered. The scan, texture quality, railway, train speed and camera are unchanged.
- The height asset's content revision changed so the new browser bundle requests fresh terrain from the CDN. No terrain calculation was added to browser startup.
- Shared footers now include an external “Designed by Aero Technologies” link to https://aerotechnology.in.
- Verification: the new regression failed on the old terrain and passes on the corrected triangles, checking 3,208 route/offset samples across both tracks and platform width. All 107 tests and the local production build passed. No rendered browser review is claimed.
