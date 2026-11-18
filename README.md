# Gaamup reality — React / Next.js frontend and Rust backend

The homepage now loads the user-downloaded **Photogrammetry | 3D scan nature landscape** by Laslo.S as a local GLB, with its supplied texture maps. There is no hosted iframe. A graded, solid track bed, two rail lines and the Mumbai AC local sit directly on the scan. The train and its bogies follow the terrain slope. The complete landscape is framed for desktop and portrait phones; orbit, pan and wheel controls remain locked. Clicking a V marker retains the descending camera, full-screen train pass and destination catalog.

The apartment library has been refreshed from the updated 71-GLB backend-program delivery. Patterned bedding, timber, dark wall cuts and fitted furniture retain their authored textures, with lower ambient light, a directional key, contact shading and fitted shadows in the viewer.

A station click starts the same continuous 3.6-second camera descent to the far side of the selected track. The passing AC-local coach fills the screen before the city project catalog appears. Selecting its single demo project opens the textured Sai World Dreams colony in the complete project viewer, including isolated buildings, floor selection, house plans, furnished previews and rotatable house models. The train makes one local approach. Reduced-motion settings use a short fade. The regional model uses one continuous measured ground surface. Buildings, roads, water and trees have separate physical geometry; the previous satellite-painted map is retained only as a local revision.

The train is a Mumbai AC-local-inspired, 12-car EMU modeled headlessly in Blender, exported to `public/models/mumbai-ac-local.glb`. Silver stainless bodywork, sky-blue lower panels, sealed smoked windows, paired sliding doors, rooftop AC units and a blue driving cab replace the older passenger train. The source is `models/mumbai-ac-local.blend`; the inspection render is `output/blender/mumbai-ac-local-preview.png`. Bogies and wheels retain their physical rail contact.

To regenerate the source and GLB, run `npm run model:export`. Run `npm run model:render` to also render the preview. These commands use `/Applications/Blender.app/Contents/MacOS/Blender` on this Mac, or the executable set with `AERO_BLENDER`. The reproducible source script is `scripts/build-ac-local.py`. Older procedural train files and exports are retained as references and are not loaded by the website.

The hero stays blank. A centered menu below it filters by 1, 2, 3 or 4+ BHK and construction stage. Below the map, the featured collection has two independently scrolling rows with touch, keyboard and arrow controls. The collection shows the published Sai World Dreams and Venus Skky City projects, plus real featured inventory added in the property desk. No filler cards are created; the old sample residences are archived. The Find home link opens the Dombivli catalog and carries the selected filters. The construction-stage control in `/admin` persists the status of your real listings; older listings stay unspecified until edited.

The header links to Home, About, Projects, List and Contact, with Locations opening a dropdown of Dombivli, Kalyan and Shilphata destination catalogs. Each catalog uses a HomeBazaar-inspired side-filter layout with budget, BHK, locality, possession, property type, area and developer controls, sorting and detailed listing rows. White/forest arrow location markers replace the diamond boards; no decorative arrows remain in the controls. A subtle animated pointer guides visitors to a station and disappears after their first selection. Builders and the footer follow the property collection.

## Start everything

On this Mac, open `Start Preview.command` in Finder, or run from the project folder:

```sh
npm run dev
```

Then open:

- Website: http://127.0.0.1:4173/
- Property desk: http://127.0.0.1:4173/admin
- Rust backend health: http://127.0.0.1:4000/api/health

Keep the Terminal window open. Control-C stops the processes started by that launcher.

If you unzip this project on another machine, install Node.js 22.18 or newer. Open `Setup Rust.command` once to install Rust inside the project without changing your shell profile, then open `Start Preview.command`. The first Rust compilation and dependency installation may take a minute. Rust is already installed locally for this workspace.

## Manage 3D projects and uploads

Open `/admin` and use **Your 3D project library** to create projects, drop in self-contained GLBs, upload floor plans and images, or paste complete HTML / upload a built static viewer ZIP. Choose **Use as opening scene** to connect an uploaded model or interactive package to the project page. Published projects appear in their selected city catalogs. Files and metadata persist in the Rust backend.

See [3D-PROJECT-GUIDE.md](3D-PROJECT-GUIDE.md) for exact upload formats, hierarchy IDs, code packages, source provenance, backup locations and API endpoints. The original eight-tower scene and full floor/house interaction engine are bundled. Its controls use the AERO theme, including day/evening/night selection.

## Add a real-estate listing

1. Start the app.
2. In another Terminal window, in this project folder, run:

```sh
npm run admin:key
```

3. Copy the key shown in that Terminal into the property desk's Admin key box.
4. Add the property name, city, locality, builder, price range, area and configuration.
5. Choose a bundled photograph or upload a JPG, PNG or WebP photo, up to 8 MB.
6. Save it as a draft, or check **Published on website**.
7. Choose the construction stage, then check **Featured on homepage** to include it in the scrolling collection. Lower display-position numbers appear first.
8. Open or refresh the website to see the current published listings.

You can edit, publish, unpublish, archive and restore listings. Archiving preserves the record. Data and uploaded photographs survive backend restarts.

Keep the admin key private. It is saved in `backend/data/admin-key.txt` with owner-only file permissions. It is not included in the downloadable project or frontend code. This is local property management; a hosted multi-user product can later add individual administrator accounts.

## Frontend and backend, in plain language

**The frontend is what the visitor sees and touches.** Here, React and Next.js build the homepage, property cards, railway scene, buttons and the property management form. Frontend code runs in the browser; Next.js also renders the initial page through its web server.

**The backend is the service that owns the data.** Here, a Rust program accepts requests, checks the admin key, validates property fields and saves records in SQLite. It also accepts property photos and returns published listings to the website.

**The database is the durable notebook.** Closing a browser or restarting the backend does not erase it. Do not edit the database file by hand; use the property desk.

Example: changing a price in the admin form sends a request to Rust. Rust checks it and writes the new value into SQLite. The next homepage request reads the updated published data. You do not edit React code to add a property.

Next.js still requires Node.js to run the frontend web server. The property API and data rules are written in Rust, not Node.js.

Read `FRONTEND-BACKEND-GUIDE.md` for separate controls, file locations and troubleshooting.

## Separate controls

```sh
npm run dev:backend    # Rust service on port 4000
npm run dev:frontend   # Next.js frontend on port 4173
npm run admin:key     # Show your local admin key
npm test              # JavaScript journey and geometry tests
npm run test:backend  # Rust API, validation, persistence and upload tests
npm run build         # Build the frontend for production
npm start             # Run production frontend + Rust backend after building
```

To use a different frontend port:

```sh
AERO_FRONTEND_PORT=4175 npm run dev
```

Rust binds to `127.0.0.1`; the browser reaches its API through the frontend's `/api/` proxy. API data logic is not implemented in Next.js route handlers.

## Data and source files

- `components/HomePage.jsx`: public page layout and featured cards.
- `components/PropertyManager.jsx`: add/edit/publish/archive controls.
- `components/RailwayExplorer.jsx`: station interactions and scene readiness.
- `app/globals.css`: page colors, fonts, location markers and soft scenery edges.
- `app/page.jsx`: asks Rust for the latest published catalogue.
- `lib/railway.js`: map geometry and a local passing-train animation.
- `lib/camera-flight.js`: smooth aerial-to-trackside camera descent.
- `lib/imported-train.js`: loads Blender geometry into animated coach and bogie groups.
- `lib/train-finish.js`: soft outdoor reflections.
- `public/models/mumbai-ac-local.glb`: self-contained Blender train asset.
- `models/mumbai-ac-local.blend`: editable Blender source.
- `scripts/build-ac-local.py`: rebuild the model, textures and export headlessly.
- `lib/property-collection.js`: preview collection and bedroom/stage filtering.
- `components/PropertyFilters.jsx`: hero filter controls.
- `components/PropertyCollection.jsx`: the two scrolling property rows.
- `lib/landscape.js`: terrain relief and the cleared railway corridor.
- `backend/src/main.rs`: Rust API, validation, authorization, uploads and SQLite access.
- `backend/seed.json`: initial sample inventory used only when creating a new database.
- `backend/data/properties.sqlite3`: live property records.
- `backend/data/uploads/`: uploaded photographs.
- `public/assets/region/`: current elevation, mapped architecture, textures and source metadata. Earlier satellite-map assets remain as revision references.
- `public/assets/station-diamond-board.png`: generated transparent station-board texture.

Back up the entire `backend/data/` directory privately, including uploaded photos. It is deliberately excluded from Git and the downloadable project. The included seed listings are illustrative; add your verified listing details through the property desk.

## API

- `GET /api/health`: Rust service and SQLite status.
- `GET /api/catalog`: published inventory plus station and builder metadata.
- `GET /api/properties`: published properties.
- `GET /api/admin/properties`: all properties, including drafts and archived records.
- `POST /api/admin/properties`: create a property.
- `PUT /api/admin/properties/<id>`: update or restore a property.
- `DELETE /api/admin/properties/<id>`: archive a property without deleting it.
- `POST /api/admin/images`: upload a JPG, PNG or WebP photo.

Admin routes require `Authorization: Bearer <your admin key>`. Public visitors cannot write inventory.

## Verification

Run `npm test`, `npm run test:backend` and `npm run build`. With both servers running, `npm run test:http` checks the page, routes, assets, Rust API and protected admin endpoint.

Visual browser QA remains blocked by the saved localhost browser permission. The actual satellite image, generated board artwork and Blender train render have been inspected, and geometry tests verify a local train approach, smooth camera descent to the opposite side and full-screen coverage using the actual rebuilt coach meshes. Additional tests check the imported GLB, embedded textures, side openings, wheel contact, filtering and preview separation. The exported GLB geometry has also been loaded back through the Three.js glTF loader; its textures are verified in the Blender render. The railway layout is illustrative and does not locate the destination stations geographically.

Generated prompts and asset details are in `ASSETS.md`. Rust dependencies are locked by `backend/Cargo.lock`; JavaScript dependencies are locked by `package-lock.json`. Build output, local toolchains, database files, admin keys and uploads are excluded from the archive.

## Satellite surroundings and atmosphere

The property scene uses a locally stored EOX Sentinel-2 cloudless 2016 image around Dombivli (`assets/dombivli-satellite-2016.jpg` inside the Sai World Dreams scene). It covers the real surrounding region; placement of the reconstructed project remains illustrative. Procedural drifting clouds, night stars and a moon follow the original day/evening/night lighting controls. The camera descent keeps its original timing; the final one-second trackside hold is removed before catalog navigation.

## Latest preview refinement

The home finder straddles the hero/discovery boundary by half its measured height on desktop and mobile. Both physical railway lines are continuous through their extensions, and expanded satellite coverage removes stretched edge pixels. The AC train includes textured stainless/blue panels, surface wear and extra service details.

Sai World Dreams now has AERO-style photo/film chapters below the colony or selected building. Its rotating apartment view loads one of 71 complete furnished GLBs from the local backend-program delivery. Orchard uses the neighbouring Spring exterior and plan as an explicitly labeled shared preview. See `3D-PROJECT-GUIDE.md` for the source mapping, limitations, media and reimport commands.

## Guided colony and current design references

The colony has a projected, animated demonstration hand that points to actual buildings and opens one only on a visitor click. **Show me where to click** replays it. Floor and apartment views continue the visual guidance. **Walk the pool terrace** and **Walk the courtyard** are persistent, prominent entry controls outside the drawer. The City blocks button is removed.

The project story uses five supplied photographs once each. The repeated day/evening section is removed; film playback is preserved. Section reveals, image depth, chapter navigation and building-entry animations respect reduced-motion preferences. Spacing and letter tracking are tighter. Five live design references are linked in `DESIGN-REFERENCES.md`.

## Current downloaded landscape

Source: `/Users/robin/Downloads/photogrammetry__3d_scan_nature_landscape.glb`, preserved unchanged. Web model: `public/models/nature-landscape.glb` (about 39 MiB, 585,000 triangles). The original normalized master, graded web source and combined railway inspection scene are in `models/`. Source/license metadata and grounding validation are in `public/assets/landscape/`. The previous regional model and unavailable Riva lookup remain revision references and are not the active scene.

The GLB retains the scan’s embedded PBR maps. All model requests are local. CC BY attribution is displayed below the map. Read `licenses/LANDSCAPE-SCAN.md` for attribution and modifications.


### Moving scenery and presentation

The railway now fills the surrounding space with generated woodland on a continuous relief mesh, an atmospheric sky and drifting transparent clouds. All scenery is in world coordinates, so it follows the same camera perspective during the train transition. The view remains locked. Station names are always visible and the three destination buttons below the map are enlarged. Generation prompts are in `public/assets/landscape/generated-scenery.json`.

The marked hero footer, map eyebrow labels, HUD and bottom slogan strip have been removed. The development corner indicator is disabled. The building page uses reversible scroll reveals from `lib/scroll-reveal.js`: text, photographs, cinema copy and the model introduction animate again after leaving and returning to view. Reduced-motion preferences disable these effects. Source image credits are available below the 3D viewer rather than over the model.
