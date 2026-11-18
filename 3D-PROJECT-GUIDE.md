# Managing the 3D property website

Start both parts with `npm run dev`, then open http://127.0.0.1:4173. Your frontend is the React/Next.js website visitors use. Your Rust backend checks and stores projects and assets. SQLite keeps the project records; files are stored beside the database.

## The visitor journey

Station board → train and descending camera → city project catalog → Sai World Dreams → rotating colony.

The catalog currently shows the one imported project at every station. Its actual location is Dombivli, labeled on the card. Click a building or its roof label to isolate the original tower. Hover over a floor, click the building at that level or use the level numbers, then select a house on the colored floor drawing. Open **2D house plan**, **Furnished view** and **Rotate model**, or click the plan/image to move through those views. **Back to floor** preserves the chosen level; closing the floor returns to the isolated building, and **All buildings** returns to the colony.

The built-in project now uses the repository's full original interaction engine. **Explore project** opens compact AERO controls for buildings, floors and amenities. Day/evening/night lighting, courtyard/aerial/boulevard/site-plan viewpoints, rotation, exterior floor highlighting, pool/garden walking, guided tours and tour recording are retained. The isolated building stays above the scrollable photo/film presentation. Floor and apartment views expand to the full screen area. Source floor-controller behavior is preserved, with clearer view labels.

Source commit: `26eb058b3fea387a2e55b360e7697de4c094a903` from https://github.com/crosscutcooperation-ux/New-SAI-WORLD-REPO. A fresh pull confirmed this is current `main`, titled **Restore opening floor plans from tower and level clicks**. All 706 plan/unit assets are now recovered, verified against their Git object hashes, and included locally. The 16 plan families contain 134 house entries referencing 47 furnished layout families, with their matching 2D and furnished images. The rotating apartment view now uses 71 complete furnished apartment GLBs from the local backend-program library, matched by tower, configuration and numbered unit; models load individually on demand.

Orchard now reuses neighbouring Spring’s exterior, floor plan and apartment models at the user’s direction, visibly identified as a shared preview. Business Park and ground-floor drawings remain absent; Breeze residential plans start at floor 6. Breeze's labeled floor assignments are preserved; other typical/refuge drawings do not certify an individual floor schedule. Missing drawings show the repo's unavailable state. Exterior dimensions remain approximate.

## Add a project and its files

1. Open `/admin`. In another terminal, run `npm run admin:key`; paste your private local key into the login box.
2. In **Your 3D project library**, choose **Create a project**. Enter its name, page address, actual location and details. Select its station cities, or leave them all unselected to show at every station. Click **Create project**.
3. Choose an asset category, then drag files into **Drop your files here**, or click to browse. Each file can be up to 200 MB.
4. Upload a **Photos / previews** image and click **Use as cover**. Save the project to apply that cover.
5. On a colony/building/unit GLB or interactive package, click **Use as opening scene**. This changes the project page's viewer immediately.
6. Check **Published in the city catalog**, then save. Open the project to review it.

The seven property folders are multicolor floor plans, normal 2D plans, furnished plan images, house/unit GLBs, complete colony GLBs, individual building GLBs, and photos/previews. Interactive viewer code and hierarchy manifests are additional folders. Upload only the representations you have; an empty category stays empty.

**GLBs:** export glTF 2.0 binary with embedded textures and buffers, Y-up. Keep meaningful object names. The backend validates the file header, chunk lengths and embedded resources, and records file size, SHA-256 and node names. Draco, Meshopt and KTX2 compressed assets are currently rejected because their decoders are not configured. The generic viewer fits the model automatically; preserve metres and sensible origins in source files.

**Plans:** PNG, JPG, WebP, or PDF for 2D floor plans. Furnished images and previews accept PNG/JPG/WebP. Enter matching building/floor/unit IDs before uploading to bind files to the hierarchy. Clicking a building in the bundled colony filters the project library to that building's documents and shared project documents.

## Put your interactive code here

Choose **Interactive viewer code**. You can paste a complete HTML document or drop a ZIP containing a built static viewer with `index.html` at its root (one enclosing folder is also supported). A working HTML sample is in `scripts/scene-package-example.html`.

Include local JS, CSS, textures, GLBs and other viewer dependencies in the ZIP. Use relative paths such as `./assets/colony.glb`. A ZIP of raw React source needs to be built first; the backend stores and serves finished browser code and does not run npm scripts or Rust programs from uploads. A Next.js project must supply a static export for this embedded package workflow.

Packages run in a sandboxed frame without access to the parent page's admin session. ZIP paths are checked, symbolic links are rejected, and extraction is limited to 2,000 files / 512 MB total. External modules need servers that permit cross-origin requests; bundling dependencies locally is the reliable option.

Optional viewer messages: send `parent.postMessage({source:'aero-scene',type:'selection',id:'tower-A',name:'Castle'},'*')` to filter linked documents. The parent verifies the sending frame. A package can send `{source:'aero-scene',type:'ready'}` when its model is ready. Uploaded packages control their own camera UI.

## Hierarchy example

Open **Building, floor and unit hierarchy** in project settings, or upload a JSON manifest. Keep IDs stable when renaming buildings. If `projectId` is supplied, it must match the saved project's ID.

```json
{
  "schemaVersion": 1,
  "axis": "Y-up",
  "units": "metres",
  "nodes": [
    {"id": "tower-A", "type": "building", "name": "Castle", "objectName": "Tower_A"},
    {"id": "tower-A-floor-1", "type": "floor", "parentId": "tower-A", "name": "Floor 1"},
    {"id": "tower-A-101", "type": "unit", "parentId": "tower-A-floor-1", "name": "101"}
  ]
}
```

Duplicate IDs, missing parents and hierarchy cycles are rejected. The bundled colony has stable tower IDs `tower-A` through `tower-H`. For custom GLBs, node names or `extras.entityId` can identify selectable objects; viewer packages can send selection messages explicitly. The manifest stores mappings and provenance; it does not invent absent interiors, inventory availability or booking logic.

## Persistence, control and code locations

- `backend/data/properties.sqlite3`: properties, projects, manifests and asset records.
- `backend/data/scene-assets/`: uploaded GLBs, plans and viewer packages. Back up the entire `backend/data/` directory privately, including its key. Do not include it in public source archives.
- `public/scenes/sai-world-dreams/`: full original scene engine, building/floor/unit controllers, drawings, furnished images, GLBs, textures and provenance manifest. `bridge.js` connects viewer state to React; `explorer.css` applies the AERO theme. `glb.html` / `viewer.js` remain the separate generic uploaded-GLB viewer.
- `backend/src/projects.rs`: project APIs, file validation, safe package extraction and viewer selection.
- `components/ProjectAssetManager.jsx`: upload/admin interface.
- `app/locations/[slug]/page.jsx`: city catalog.
- `app/projects/[slug]/page.jsx` and `components/ProjectViewer.jsx`: project page and frame controls.
- `models/mumbai-ac-local.blend`: editable Mumbai AC local source, packed PBR textures and lighting. `scripts/build-ac-local.py` rebuilds it. `npm run model:render` exports the GLB and Blender preview.

Use `npm run dev:frontend` and `npm run dev:backend` in separate terminals to control them independently. Control-C stops the service in that terminal. Restart Rust after editing Rust source; Next.js updates frontend edits while it runs. The old photo/property desk remains available below the 3D project desk and controls the homepage's featured residences separately.

Project APIs: public `GET /api/projects`, `GET /api/projects/:slug`; authenticated `GET/POST /api/admin/projects`, `PUT /api/admin/projects/:id`, `GET/POST /api/admin/projects/:id/assets`, `POST /api/admin/projects/:id/viewer`. Asset uploads use raw bytes plus `X-Asset-Kind`, URI-encoded `X-File-Name`, and optional `X-Building-Id`, `X-Floor-Id`, `X-Unit-Id` headers. Opening-scene selection takes `{ "assetId": "…" }`. Built-in restoration for the demo takes `{ "builtin": true }`.

This implements persistent local catalog and asset management. Team login, leads, unit availability, payments and production hosting remain future product features.

Validation commands: `npm test` (geometry and journey), `npm run test:backend` (Rust API/storage), `npm run test:uploads` (isolated real HTTP uploads through Next.js), `npm run test:http` (running site routes), and `npm run build`. The upload test creates and removes a temporary database and does not alter live inventory.

## Catalog fields and scenery

The public city catalogs now have side filters, sorting, saved project hearts, photo controls, configuration/area/price tables, amenities and working project/floor-plan links. Prices, areas and possession dates remain On request until supplied. Additional structured facts can be persisted in `project.manifest.catalog`: `developer`, `bhk` (array), `propertyType` (`Apartment`, `Villa`, `Plot`, `Commercial`), `status` (`under-construction`, `ready-to-move`, `new-launch`), `area`, `possession`, `photos`, `amenities`, and `variants` (configuration/area/price rows). Existing project price and configuration fields continue to work.

`public/scenes/sai-world-dreams/site-environment.js` adds regional satellite ground, animated clouds, stars and a moon. The imagery is from 2016, with an approximate Dombivli-area registration and visible EOX/CC BY attribution. `lib/camera-flight.js` removes the old one-second final hold while preserving the descent timing.

## Current project presentation and apartment assets

The project page keeps the interactive colony/building preview above AERO-style editorial chapters, an amenity collection, full-width project film, residence image, day/evening comparison and horizontal gallery. Six renders and two films were imported from the supplied Drive folder. Originals remain in `output/imports/sai-drive/`; web versions and source IDs/checksums are in `public/projects/sai-world-dreams/media/`. Architectural renders are labeled as visualisations. These media chapters are currently curated in `components/ProjectPresentation.jsx`; the existing Rust asset upload library continues to manage new projects and uploads.

`public/scenes/sai-world-dreams/assets/apartments/index.json` records the 71 whole-apartment files, original checksums and the approved Orchard-to-Spring mapping. `apartment-models.js` resolves tower + floor configuration + apartment number. It never chooses a model solely by bedroom count. The 2D and furnished-image views retain the supplied source art; rotating 3D loads the complete apartment with its authored furnishings, materials and textures. These are dimension-calibrated reconstructions, with approximate furniture, cutaway heights and some mirrored variations. No separate new exterior-building GLBs were found in the current backend-program apartment delivery; the existing colony exteriors remain, with Orchard using Spring.

To reimport an updated apartment delivery, run `python3 scripts/import-apartments.py "/absolute/path/to/sai-world-dreams-apartments"`, then `node scripts/manifest-scene.mjs` and `npm test`. The import verifies original SHA-256 checksums and preserves the source library. The curated library adds about 596 MB to the project; visitors download only the selected updated apartment (typically 8–10 MB), not the entire library.

## Updated GLBs, contrast and the regional scene

All 71 furnished apartments were reimported from the updated backend-program manifest and verified by SHA-256. Model URLs carry a short checksum version so an older cached GLB cannot mask an updated file. The renderer preserves authored materials, uses a warm directional key, reduced hemisphere/environment fill, a gentle rim, fitted shadow bounds and screen-space contact shading. White backgrounds remain separate from the apartment materials. The local source library is not modified.

The homepage no longer displays a satellite photograph as its principal ground material. `lib/regional-landscape.js` builds elevation relief, roughly 13,000 selected mapped building footprints, road geometry, waterways and woodland from the offline regional datasets. Heights are exaggerated for legibility; this remains an architectural visualisation rather than a surveyed digital twin. Dragging orbits the model. Clicking a station retains the established single camera descent and train transition to its catalog. `public/assets/region/sources.json` records sources and limitations.

`scene-guidance.js` projects a demonstration hand onto the selected architecture and supports a replay control. Prominent walk-launch cards expose pool-terrace and courtyard/garden/veranda walking. The image presentation no longer repeats the day/evening residential views.

## Current local landscape and railway

The downloaded nature scan is now the opening map. It replaces the previously generated regional scene, while the rest of the site and property tour remain unchanged. `lib/scanned-landscape.js` loads the local model and route data. `lib/railway.js` builds the ballast, rails, sleepers, stations and articulated train on the graded surface. `lib/map-framing.js` fits the complete model without exposing camera controls. The camera transition accounts for the selected station’s ground height.

Source preparation and export scripts are `scripts/prepare-scan-landscape.py` and `scripts/export-scan-landscape.py`. The original user download remains unchanged; the web GLB and packed Blender masters are separate files. Track/scan contact was checked against the exported GLB in `scripts/validate-scan-grounding.py`. The scan is an illustrative setting for the destinations, not their surveyed geography. The image/gallery, backend, project listings and apartment assets were not replaced.
