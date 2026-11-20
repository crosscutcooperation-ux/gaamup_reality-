# Changelog

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
