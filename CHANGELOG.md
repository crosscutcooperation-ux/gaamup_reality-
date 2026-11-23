# Changelog

## 3.2.0 — 2026-11-23

### Added
- A 1.5-second building-themed entrance on initial load and refresh, with reduced-motion support and a CSS dismissal fallback.

### Changed
- Publish the latest GitHub hero, typography, public contact details, builder logos and optimized railway assets.

### Fixed
- The terrain cache revision matches the deployed height data.

## 3.1.2 — 2026-11-22

### Changed
- The AI assistant knows the public website sections, leadership, values, saved homes, search, enquiry process and footer links, including the Aero Technologies design credit and website.
- Current project context also includes carpet area, property type, sales highlights and pricing update dates.

## 3.1.1 — 2026-11-21

### Fixed
- Surrounding terrain stays beneath the railway and platforms near Dombivli instead of protruding through the track bed.
- Every shared site footer links “Designed by Aero Technologies” to aerotechnology.in.

## 3.1.0 — 2026-11-21

### Added
- A Google Gemini conversation assistant that asks helpful follow-up questions, remembers the conversation during the visit, and answers project, website and general questions.
- Recommendations use current public project prices, floor areas, possession estimates, amenities and addresses, with direct project links and secure enquiry handoff.
- Server-only API credentials, bounded requests and replies, rate limits, typing feedback, retries and a new-conversation control.

## 3.0.8 — 2026-11-20

### Fixed
- The train maintains its approach speed throughout the two-second pass instead of slowing down beside the fixed camera.

## 3.0.7 — 2026-11-20

### Fixed
- The trackside camera stays completely fixed during the two-second train pass.
- Moved the camera a little closer so the carriage and branding occupy more of the view.

## 3.0.6 — 2026-11-20

### Fixed
- About photos reveal reliably; sections animate once and remain visible until the page is reloaded.
- Venus and Sai floor, apartment and furnished views cover old content with a visible spinner until replacement pixels and layout are ready.
- Sai furnished view swaps cleanly instead of revealing the previous plan through the construction transition.
- The train camera is slightly closer and follows the branded carriage for two seconds before navigation.

## 3.0.5 — 2026-11-20

### Changed
- The train journey now approaches a branded carriage closely, with its roof and wheels visible.
- The glass home search includes BHK and construction-status selectors and a Find my home action; all choices combine in the listing filters.
- Added project addresses, lazy maps and directions for all three projects.
- Added supplied tower-specific Venus and Sai World Dreams prices, carpet areas, possession timelines and Venus highlights. Starting prices now appear in the collection.
- Cost-sheet enquiries carry the selected project into the contact form.

## 3.0.4 — 2026-11-20

### Fixed
- Restored readable CTA heading/body colours and consistent developer typography.
- About/Contact scroll entrances now bring words from alternating sides and photographs down from above; decorative hover movement is removed.
- Floor, apartment 2D and furnished images show loading feedback until decoding completes. Superseded requests cannot clear a newer loader; image failures offer recovery.
- The train journey uses an 18:9 cinema frame and a closer camera while preserving the complete twelve-coach train in view.


## 3.0.3 — 2026-11-20

### Fixed
- Production security policy permits browser-created GLB image blobs, fixing missing white landscape textures on the live site.
- Property photographs open their residence, with saving kept as an independent button.
- Elements shares Venus walkthrough controls and replayable building, floor and apartment hints.
- The railway overview stays clear of white cloud overlays; clouds remain in the train descent.
- About and Contact retain scroll entrances that reset and replay whenever a section returns.


## Website performance and enquiry release — 2026-11-20

### Added
- Saved enquiries, server-side email notifications and delivery status in the property desk.
- Project assistant for exploring homes and submitting enquiries.
- Search for up to three localities/projects with recent-search continuation.
- Shared contact footer and Today Group in the developer collection.

### Fixed
- Large colony downloads, sequential asset loading and repeated Venus picking/label work.
- Portrait train framing, mobile navigation and search layout.
- Enquiry forms previously requiring a separate email app or WhatsApp send.

### Security
- Updated vulnerable dependencies; native dependency audit reports no known vulnerabilities.
- Validated and bounded enquiries, admin-only lead access, persistent request limits, protected server mail settings and CSP.
- Server-side Turnstile verification is ready for production widget keys; see deployment status before claiming CAPTCHA is active.

## 3.0.1 — 2026-11-20

- Clear back controls, clean About/Contact URLs, readable company pages with word/photo entrances and reduced-motion support.
- Route, model and floor-plan loading feedback; overlapping asset preparation, lossless ground texture delivery and bundled shared 3D runtime.
- Production Cloudflare asset caching, enquiry rate limiting and Managed Turnstile installed; server admin key rotated privately.

## 3.0.2 — 2026-11-20

- Return controls now use solid green buttons with white arrows; navigation stays reachable while scrolling.
- Company text/photo entrances replay across routes and begin after the starting pose is painted; captions, muted text and developer cards have clearer contrast.
- Added page-opening, property-search and secure-form feedback, plus a live forest breeze with a pause control. Original scan positions and textures are preserved.
- Pulled the train camera farther back to retain all twelve coaches on wide and portrait screens.
- Stopped persisting the administrator credential in browser storage; legacy stored values are cleared when the admin screen loads.
