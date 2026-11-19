# Lightsail deployment

Public URL: https://16.176.182.103/

The site uses `gaamup-frontend` (127.0.0.1:4173) and `gaamup-backend` (127.0.0.1:4000) systemd services. Nginx serves public assets and routes the IP hostname to Gaamup. Other hostnames on this server retain their own virtual hosts.

- Release directory: `/var/www/gaamup-releases/bb92b6f`
- Active symlink: `/var/www/gaamup-current`
- Persistent SQLite database, uploads and apartment assets: `/var/lib/gaamup`
- Admin key: `/var/lib/gaamup/admin-key.txt` (read through SSH; never commit it).
- Logs: `journalctl -u gaamup-frontend -u gaamup-backend`; `/var/log/nginx/gaamup.error.log`.

Build using `npm ci && npm run build` and `cargo build --release --locked --jobs 1 --manifest-path backend/Cargo.toml`. Copy bundled `backend/data/scene-assets` into the persistent data directory when provisioning a fresh server. Preserve the existing data directory for updates.

Nginx configuration samples are in this directory. Validate with `sudo nginx -t` before reload. Release rollback: repoint the active symlink to a previously verified release, then restart the two services. Do not roll back the persistent database by deleting it.

The IP has a Let's Encrypt short-lived certificate with the existing Certbot renewal timer. Its ACME webroot is `/var/www/panvibes-acme` and must stay reachable. Cloudflare is pending the future domain; direct-IP traffic does not pass through Cloudflare. Connect the future domain as proxied DNS, install its origin certificate, and keep SSL in Full (strict) mode.

Verification: production build passed; 6 Rust backend tests passed; public health endpoint, all three viewers, asset availability, range responses and the two existing domain homepages checked. The production npm audit reported one moderate Next.js advisory group; no high or critical findings. Update the framework with a separate verified patch release.
