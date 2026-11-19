# Railway delivery and Cloudflare

The production hostname is https://gaamupproperties.com with proxied Cloudflare DNS. Both domain names use a valid origin certificate.

The scan keeps all 589,799 source triangles and all 13 original JPEG photographs. High precision Draco encoding reduces the scan from 31,733,124 bytes to 12,170,336. The browser uses the existing local Draco decoder with one worker. Startup preloads the scan before the client scene module arrives.

The scan and train use versioned `.bin` URLs because BIN is included in Cloudflare default cacheable extensions; GLB is not. `?release=1` is part of the initial scan cache key. Changing content requires a new URL version.

Nginx must have `gzip_static on;` enabled. Generate adjacent `.gz` files at deployment with `gzip -9 -k` for both BIN files. Model transport is 12,140,282 bytes for the scan plus 1,831,633 for the train, about 64% less than the previous 38,956,796 bytes. Raw GLB content is unchanged by the BIN filename; the loader detects its GLB header.

Verification: 64 existing local tests passed after Draco integration; focused journey/terrain tests passed after the cache URL changes; a new budget test checks the original triangle count and exact SHA-256 of every photograph. The public domain browser loaded the scan in 3.71s and train in 3.62s on the test connection (resource timings, not a guaranteed first-interactive time). A full map response on the same test connection took 4.87s. These timings depend on device, route, cache location and connection.

Regeneration: `node scripts/compress-railway.mjs /path/to/original-scan.glb`. The original artist model is kept outside the deployment package.
