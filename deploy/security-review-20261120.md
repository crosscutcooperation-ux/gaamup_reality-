# Website security review — 20 November 2026

Scope: gaamupproperties.com, property administration, saved enquiries, SMTP delivery, Cloudflare asset caching and form protection.

## Verified controls

- The domain uses HTTPS with HSTS and a Content Security Policy that permits the local viewers and Cloudflare Turnstile. Origin TLS is configured with a valid Let's Encrypt certificate and TLS 1.2/1.3.
- Unauthenticated enquiry reads return 401. The random server admin key remains outside the release tree with 0600 permissions; private settings use a 0600 systemd environment file.
- Administrator credentials are no longer persisted in browser storage. The legacy session-storage entry is cleared when the admin page opens; the unlocked page retains its key only in memory until Lock, refresh or failed authentication.
- Enquiries require a permitted Origin, bounded JSON fields, consent, a honeypot and a valid production Turnstile token with the expected hostname and `enquiry` action. Failed verification is rejected before storage or email delivery.
- Public assets are cached separately from private APIs. Model and HDR responses were verified as Cloudflare cache hits. Private enquiry responses use `no-store`.
- The Cloudflare enquiry rule limits POST bursts by IP; Nginx and the persistent application limiter provide independent throttling. Visitor IPs are trusted only from the configured Cloudflare address ranges.
- Database access uses prepared statements. Delivery is retried through the service timer, and enquiries have bounded retention. One saved delivery test is marked sent, with no failed or retry rows at review time.
- The native dependency audit reports zero known vulnerabilities. No real credentials, environment files or private key files are included in the release commit.

## Verification limits

The CAPTCHA widget renders on the production domain. Automated tests cover validation and rejection; this follow-up did not solve a human CAPTCHA or send another email to the recipient. The existing successful delivery record and configured sender/receiver were checked without displaying stored personal details or credentials.

The specifically named Cloudflare security-audit skill was not found in the installed skill directories. The security-and-hardening workflow was used for this review. This report describes checked controls rather than a guarantee that no unknown vulnerabilities exist.


3.0.3 correction: embedded GLB textures use ImageBitmapLoader fetches against browser-created blob URLs. Live CSP previously blocked them despite permitting blob images. `connect-src` now contains self, blob, and the existing Turnstile endpoint only; no wildcard network origin was added. Browser console evidence and restored live forest textures verified this fix. See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src and https://threejs.org/docs/pages/ImageBitmapLoader.html.
