# Railway assets — revision 2

Generated through the built-in imagegen tool and saved in this project. JPEG copies preserve the generated appearance while reducing transfer size.

## Aerial terrain

Saved file: `public/assets/aerial-terrain.jpg`

Prompt:

> Use case: photorealistic-natural. Asset type: ground texture for an interactive 3D aerial railway scene. Create a photorealistic straight down orthographic satellite drone photograph of semi rural western India in dry season. Wide landscape composition 3:2. Dusty olive green and ochre farmland, dry scrub and small natural trees, narrow dirt paths, a cluster of small Indian houses around the outer edges. The central 80 percent is open low vegetation and realistic textured light dry soil with irregular grass patches, unobstructed, suitable for laying a virtual railway over it. High resolution true satellite photography with fine real terrain detail, neutral late afternoon sunlight, realistic restrained color. NO railway, NO tracks, NO trains, NO text, NO labels, NO infographic, NO UI, NO perspective horizon, NO mountains.

The track, moving train and stations are rendered in 3D above this terrain.

## Passenger coach side

Saved file: `public/assets/train-coach-side.jpg`

Prompt:

> Use case: product-mockup. Asset type: photorealistic albedo texture for the side wall of a 3D Indian passenger railway coach. Exact full broadside orthographic side view, perfectly flat rectangular surface of one modern Indian Railways passenger coach. The composition is a wide 3:1 rectangular image tightly cropped to ONLY the rectangular side wall: roof top edge at top edge and underbody lower edge at bottom edge, no scenery, no floor, no shadow outside. Real brushed stainless steel in light warm grey, subdued deep olive green horizontal lower stripe, a long horizontal row of twelve realistic dark tinted rectangular passenger windows with rubber seals and metallic frames, closed entrance doors at both ends. Photographic detailed weathering, rivets, panel joins, subtle dust, straight horizontal lines. Flat even neutral lighting suitable for a texture map. No text, no logos, no wheels, no front of locomotive, no perspective convergence. The entire frame is occupied by the rectangular coach wall, no empty margins. This is the actual realistic side of a passenger train that will pass very close to camera, not an illustration.

This older texture is retained as a reference asset. The current train uses modeled body panels and windows rather than this photographic side overlay. The earlier front-view cutout is preserved in the static backup archive; it is not shipped or displayed by this Next.js app.

## Existing assets

- Repose display, italic and sans fonts: supplied AERO BUILDS project.
- Pool photograph: supplied AERO BUILDS project; illustrative lifestyle imagery.
- Evara photograph: previously downloaded from the reference HomeBazaar page with permission.
- Three.js 0.170.0: vendored from the npm distribution. MIT license included.

## Reference-inspired city and coastal terrain — revision 3

Saved file: `public/assets/urban-coastal-map.jpg`

Generated with the built-in imagegen tool using the user-supplied screenshot as a visual reference. The screenshot's phone interface, social UI, route labels, logos and drawn lines are not reproduced. This is a stylized terrain asset, not an accurate geographical map.

Prompt:

> Use case: photorealistic-natural. Asset type: terrain surface texture for a real-estate website's 3D railway map. Use the supplied screenshot only as a reference for the satellite-map scenery in its central image panel. Create a fresh high-resolution wide landscape 3:2 top-down satellite aerial terrain, with lush richly green hilly woodland over the left third, dense detailed Indian urban neighbourhoods with tiny grey and warm roofs through the central half, and broad vivid blue coastal water and winding tidal creeks along the right edge. Match the reference's vivid green, grey city and blue-water balance and semi-photoreal satellite-map appearance. The centre should be an unbroken realistic city/green terrain surface where code will overlay a curving railway. Smooth natural transitions between forest, city and water. True directly overhead orthographic view, no sky or horizon. The full image must be ONLY terrain: no Instagram or phone UI, no branding, no watermark, no text, no station names, no labels, no red or orange route lines, no trains or tracks. This will be mapped onto a 3D ground plane; do not include a legend or decorative borders.

## Scratch-built train model — revision 4

Source: `lib/train-model.js`. Export: `public/models/aero-suburban-train.glb`.

Created locally from Three.js geometry and materials, with no external model or texture dependency. Includes a driving cab and five passenger coaches, curved roofs, panel openings with inset opaque glass and reveal geometry, doors, steps, ventilators, bogies, axles and wheels. Static panels are merged by material to reduce draw calls. The website animates the procedural source; the GLB is a static export for Blender inspection and future editing.

Regenerate with `npm run model:export`. Import the GLB in Blender using File → Import → glTF 2.0.

## Indian suburban detailing — revision 5

The train now uses a Mumbai-local-inspired cream/maroon body and yellow cab. Modeled details include window bars, door grab rails, side beading, wipers, roof louvres, a pantograph and suspension springs. This is an artistic interpretation rather than a replica of a specific railway class.

`lib/train-finish.js` creates a deterministic material-grain texture, canvas-rendered Hindi/English nameplates and a soft sky/ground reflection environment locally. No remote texture or model service is required. Generated grain and lettering are applied in the browser; the GLB export includes geometry and base material colors.

## Actual satellite image, Blender blue train and generated board — revision 6

The earlier map and train exports have been removed after the live scene moved to the scanned landscape and AC-local.

### Actual satellite image

Legacy intermediate satellite image removed; the live scene uses the scanned landscape GLB.

Source: [EOX Maps](https://maps.eox.at/), layer `s2cloudless` (the 2016 mosaic), WMS endpoint `https://tiles.maps.eox.at/map`, geographic bounds 72.84,19.04,73.11,19.22. Downloaded directly as JPEG; not generated by AI. [EOX license information](https://cloudless.eox.at/pricing) lists the 2016 imagery under CC BY 4.0. Required credit appears on the page: “Sentinel-2 cloudless by EOX — Contains modified Copernicus Sentinel data 2016.” The displayed railway layout and relief are illustrative overlays.

### Blender train

The blue ICF model and export were superseded by the silver and blue AC local. Its legacy exported GLB was removed; source scripts are retained for design history.

Created headlessly with Blender 5.2.3, including embedded painted-metal and roof textures generated locally, blue electric locomotive, old blue ICF-style coach, window bars and metal trims, lettering, roof equipment, wheels, flanges, bogies and suspension. Textures and geometry are original project work. Exported GLB is loaded by `lib/imported-train.js`. Reference: [Indian Railways RDSO ICF painting manual](https://rdso.indianrailways.gov.in/uploads/files/Painting%2012.pdf), especially the main-line blue exterior schemes. This is a visual interpretation, not an engineering replica.

### Generated station-board texture

Saved file: `public/assets/station-diamond-board.png`. Built-in imagegen tool, transparent background. Used as a raster image in the station controls and as a texture on physical Three.js planes. Names remain live HTML text rather than fixed generated text.

Reference research: [Bandra Terminus platform board](https://commons.wikimedia.org/wiki/File:Bandra_Terminus_platformboard_-_English.jpg) and [Mumbai signage design study](https://www.dsource.in/sites/default/files/case-study/designing-signage-system-mumbai-suburban-railway/introduction/file/Designing-a-Signage-System-for-Mumbai-Suburban-Railway_Report.pdf). Reference photos were not copied into the product.

Final prompt:

> Use case: product-mockup. Asset type: alpha texture for an interactive Mumbai local train station name board, applied to a 3D plane. Generate a single old-style Mumbai suburban railway DIAMOND station board, completely straight-on orthographic view. A square rotated 45 degrees to form a diamond, weathered bright red thick outer frame, white enamel interior, and a deep navy blue horizontal rectangular name band crossing the entire middle and extending a little beyond the diamond's sides. Slight real metal rim, fine enamel wear, restrained dust, realistic natural daylight, minimal dimensional edge. The name band must be EMPTY navy blue: no letters, no station names, no numbers anywhere, because HTML will supply live names. Center the diamond, fill the square frame with the board with only a small alpha margin. No support posts, no backdrop, no ground, no scenery, no cast shadow outside the object. Genuine transparent background. Photographic enamel and painted metal surface, not a vector icon or cartoon. Red, white, navy blue only.

## Current 3D catalog and PBR train — revision 7

### Imported colony

Source: https://github.com/crosscutcooperation-ux/New-SAI-WORLD-REPO, commit `26eb058b3fea387a2e55b360e7697de4c094a903`. User explicitly supplied this repository for reuse. Required files are copied into `public/scenes/sai-world-dreams/`; the original sidebar app is not used. The custom `viewer.js` assembles the original textured scene, uses the repo's Blender facade geometry, preserves eight tower IDs and adds a clean orbit viewer. The supplied scene is an approximate exterior study; unverified dimensions/floor counts are not presented as surveyed facts.

The original source credits the environment as Poly Haven **Kloppenheim 05 Pure Sky**, by Greg Zaal / Jarod Guest, CC0. The same locally stored HDR now lights the train's outdoor reflections. Three.js is MIT, with `vendor/LICENSE.three` included. Project facade and landscape textures come from the user-supplied repository; no new third-party architectural photos have been substituted.

### Photographic enamel texture

Built-in imagegen tool. Saved as `models/textures/oxford-blue-enamel-v2.png` and embedded into `public/models/indian-blue-train.glb`. The generator derives matching pale-blue paint, roughness and micro-normal images; all five exported images are embedded. Editable source: `models/indian-blue-train.blend`, with packed textures, environment and preview rig. Checked render: `output/blender/blue-train-preview.png`.

Final prompt:

> Use case: photorealistic-natural. Asset type: physically based albedo texture for an old blue Indian Railways ICF sleeper coach. Create a very high resolution wide 3:1 seamless macro photograph of a continuous large panel of Oxford navy blue painted railway steel. Flat orthographic straight-on surface, fills the entire image, no perspective. Muted real faded blue enamel, subtle mottled cloudy oxidation, fine paint orange peel, sparse tiny pale chips and worn metal at some spots, diffuse thin vertical rain and dust streaks, slightly greasy dark grime concentrated near the bottom edge, very faint horizontal welded sheet seams. The upper two thirds should be subtly weathered blue, not covered in rust. Perfectly even neutral overcast illumination suitable for texture mapping, no baked highlights or cast shadows. Photographic detail with restrained weathering. No train silhouette, windows, doors, labels, lettering, logos, bolts, frame or borders. No glossy game texture, illustration or heavy repetitive lines. Long edges should tile seamlessly horizontally.

The model has revised body proportions, coach door hinges/latches, gutters, rivets, closer window-bar spacing, gangway bellows and PBR paint. It remains an artistic Indian electric locomotive / ICF-style passenger interpretation. Its mesh and real-time rendering are not a scanned train or a photographic replica of a specific class.

## Full source interaction flow restored

A fresh pull confirms current `main` is `26eb058` (Restore opening floor plans from tower and level clicks). The built-in page now runs the original `app.js`, tower elevation, floor plans, apartment selection, registered furnished-image reveal, 3D apartment viewer, architectural lighting and walkthrough controllers. `bridge.js` connects their state to the React host; `explorer.css` supplies AERO styling. The source sidebar controls are available through a compact Explore project drawer.

All 706 plan/unit files are included under `public/scenes/sai-world-dreams/assets/plans/`, verified against Git blob hashes. Sixteen plan families contain 134 selectable house entries and 47 furnished layout families. Original images and GLBs are retained, with no newly generated substitute interiors. `manifest.json` records floor/house paths, availability, stable instance IDs and checksums. Business Park and source-missing ground drawings remain unavailable. The later Orchard shared-layout change is documented below.

## Mumbai AC local, catalog and satellite atmosphere — November 12

Current train: `public/models/mumbai-ac-local.glb` and `models/mumbai-ac-local.blend`, generated by `scripts/build-ac-local.py`, with locally generated stainless/paint PBR textures. Reference appearance: Mumbai's silver/blue AC local, sealed windows, paired sliding doors, HVAC roofs and blue driving cab. This is a modeled visual interpretation, with the earlier rail-contact bogie helpers retained. The old blue train remains a local revision reference.

Catalog structure reference: [HomeBazaar Mumbai listings](https://www.homebazaar.com/properties-in-mumbai), inspected for sidebar filters, search/sort, broad image/detail cards, configuration tables and amenities. Existing AERO fonts/colors and the supplied Sai World Dreams assets are retained. No additional fake listings, verified badges or prices are supplied. Developer identification is supported by [Sai World / Paradise Group](https://saiworld.in/); bedroom types come from the supplied unit JSON.

Property-surroundings image: `public/scenes/sai-world-dreams/assets/dombivli-satellite-2016.jpg` (3072 square), downloaded from the EOX `s2cloudless` 2016 WMS layer. Bounds: 73.0699,19.1659 to 73.1119,19.2059. Exact WMS URL and attribution are stored in the sibling JSON. [EOX license](https://cloudless.eox.at/pricing): 2016 imagery is CC BY 4.0. Site registration is illustrative; the image is not a current survey. Credit appears inside the scene.

Clouds and stars use original procedural shader/geometry code; the moon is a locally drawn canvas texture. No additional generated or downloaded sky photographs are used. Light state follows the existing architectural-lighting events.

## Route continuity, textured AC train and supplied property media

The railway now uses one continuous ballast/rail/sleeper run per line, including both tangent extensions. The active terrain uses the locally bundled scanned landscape with its own source attribution and license. The older EOX intermediate map images were removed.

The AC local’s silver, blue and roof maps now derive weathering detail from the existing generated photographic-style enamel texture (not a scanned train photograph). Embedded albedo, roughness and micro-normal maps, continuous side UVs, panel fasteners, service hatches, door grips and gangway folds replace the former almost-flat finish. The train remains a modeled interpretation. The packed Blender source and latest render are included.

Supplied media: six TIFF architectural renders and two MP4 promotional films from [the user’s Sai World Dreams folder](https://drive.google.com/drive/folders/1-1CuJxA6qSO_H0XTvI590hOnokmxTOpe). WebP derivatives, local H.264 films, posters and `sources.json` are in `public/projects/sai-world-dreams/media/`. The source manifest records Drive IDs, original sizes and SHA-256 checksums; it contains no signed download URLs. AERO presentation reference: the local `aero-builds/src/ReposeLifestyle.jsx` amenity index, editorial split sections, cinema and film overlay, using the existing Repose fonts and paper/forest palette. Images and films are the supplied Sai World Dreams assets.

The apartment GLBs are exact checksum-verified copies of the validated 71-apartment delivery at `/Users/robin/Documents/ChatGPT/backend program/sai-world-dreams-apartments/`. Embedded material sources are the source library’s CC0 Poly Haven maps. Read `assets/apartments/index.json` for per-unit provenance and reconstruction limits. Orchard reuses Spring’s model and sheets as explicitly requested, with a visible shared-reference note. These replace the prior image-derived models in the visitor’s rotating apartment view; old source files remain as revision/reference assets.

## Geographic architecture and updated apartment delivery

The active railway scene uses `public/assets/region/terrain.json` (nine Terrarium tiles), `architecture.json` (OpenStreetMap extracts) and original facade artwork. It builds measured hills, roughly 13,000 selected building footprints, roads, waterways and woodland as geometry. See `licenses/REGIONAL-DATA.md` and `sources.json` for attribution, source checksums and limitations. Source geographic data remains separate from the visual train connection. Heights, tree forms and facade detail are illustrative.

The latest 71 backend-program GLBs have been reimported with checksum verification. The viewer retains patterned linens, wood, stone and dark wall cuts, with stronger directional separation and contact shading. `apartment-lighting.js` records the lighting profile. The AC train adds ribbed lower panels, stronger stainless/blue wear maps, micro-normal detail and a dedicated glazing-roughness texture. The train is modeled artwork, not a scanned train.

The five-image project presentation uses each supplied photograph once; the duplicated day/evening residential comparison is removed. Videos remain the supplied local films. The optional external inspiration references are documented separately in `DESIGN-REFERENCES.md`; their source assets were not copied.

## Main map embed — İstYA / Riva 4-7

The user supplied the Sketchfab iframe for [İstYA / Riva 4-7](https://sketchfab.com/3d-models/istya-riva-4-7-513fb6da874a4817b48f1d5e2b7e04de), by [Alper BASIRAN](https://sketchfab.com/petaaerial), and explicitly selected replacing the main map view while keeping station/train navigation. The main map now embeds that hosted viewer, with visible attribution and a separate-open link. No Sketchfab model files were downloaded or extracted. Station buttons remain destination controls; they do not claim geographic registration to the hosted model. During station travel, the existing local railway takes over for the camera/train transition and catalog navigation. The embedded viewer is hidden during that journey.

The external Sketchfab pages rejected automated web inspection (403/inaccessible), so browser playback of the hosted model is not claimed as verified. The supplied embed URL and attribution are preserved.

## Local map correction — source model pending

The user clarified that the Riva model must be downloaded and loaded into the website’s own scene, with the train and tracks on it. The iframe was removed. The official model metadata was retrieved successfully from `https://api.sketchfab.com/v3/models/513fb6da874a4817b48f1d5e2b7e04de`: `isDownloadable` is false, with Standard licensing. Its official `/download` endpoint returned 401 without credentials. No viewer resources were extracted or treated as a downloadable model. Exact integration remains pending an accessible source file or creator-provided direct download.

Independent changes completed: locked local camera, full-model frustum fitting across aspect ratios, compact V destination markers, and preservation of tracks/train/catalog navigation. The local landscape remains the earlier regional model until the exact source asset is supplied.

## Downloaded replacement installed locally

The user supplied `photogrammetry__3d_scan_nature_landscape.glb` from Downloads. Embedded asset metadata and the official Sketchfab API identify **Photogrammetry | 3D scan nature landscape**, by **Laslo.S**, model ID `e0050374e75347929017942fe761670f`, CC BY 4.0. The 78,234,888-byte original was not modified. The web derivative is `public/models/nature-landscape.glb`; its own asset extras and sibling manifest preserve attribution, hashes and modifications.

Blender source transforms were applied, then the actual vertices were recentered and uniformly scaled to a 260-unit width. A narrow corridor through the clearing was graded to sampled surface heights, and the scan was reduced to 45% geometry (about 585,000 triangles), retaining texture/material seams. The runtime now loads this GLB directly, follows a 3D route sampled from the scan and aligns both the train body and bogies to the grade. Ballast has a solid cross-section and upward-facing surfaces. No Sketchfab embed or remote model payload is used. The station names remain destination controls for the catalog rather than real labels for this scanned location.

Editable sources: `models/nature-landscape.blend` and `models/nature-landscape-web.blend`. Inspection renders are under `output/blender/scan-*-inspection.png` and `scan-railway-preview.png`. `grounding-validation.json` records 1,200 raycast checks against the actual exported GLB with zero misses and maximum surface deviation about 0.0054 scene units. See `licenses/LANDSCAPE-SCAN.md`.


## Moving woodland surroundings and clouds — November 12, 2026

Generated with the built-in **image_gen** tool, then copied into the project and converted to WebP:

- `public/assets/landscape/woodland-surroundings.webp`: overhead forest/meadow imagery, used on continuous 3D surrounding terrain. Its original 3:1 aspect ratio is preserved in the world UVs.
- `public/assets/landscape/journey-cloud-cumulus.webp`: photographic cumulus sprite; the generated transparent alpha is preserved. Multiple world-space clouds drift independently and remain in the scene during the camera descent.
- Complete final prompts and tool provenance: `public/assets/landscape/generated-scenery.json`.

The woodland extension is illustrative generated imagery, not satellite data. The supplied Laslo.S scan, authored train, grounded tracks, and destination navigation remain local 3D assets. `scripts/build-surrounding-terrain.py` extends and smooths sampled scan-edge heights and generates `surroundings-height.json` plus `scan-edge-mask.png`. The latter follows the actual irregular scan silhouette and feathers its join into the extension while retaining fully opaque terrain under both tracks. It changes rendering, not the supplied GLB.

The animated daylight sky uses Three.js's Sky shader (MIT). Cloud motion pauses for reduced-motion preferences. The existing EOX/Copernicus CC BY credit for the building's satellite surroundings has moved from the model overlay to the host page's expandable **Image credits** area.
