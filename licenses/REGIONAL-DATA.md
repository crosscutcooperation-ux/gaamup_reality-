# Regional landscape sources

Accessed November 12, 2026. The dataset files and provenance are packaged in `public/assets/region/`.

- Elevation: [Mapzen Terrain Tiles on AWS](https://registry.opendata.aws/terrain-tiles/). Nine zoom-12 Terrarium tiles are decoded to metres. SRTM/GMTED2010 data courtesy of the U.S. Geological Survey; ETOPO1 data courtesy of NOAA. [Provider attribution and source terms](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
- Building footprints, roads and water geometry: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The derived scene database `architecture.json` is distributed under ODbL 1.0. Original extract checksums are recorded in `sources.json`.
- The grass material comes from the existing user-supplied scene repository. The residential facade texture is original locally drawn code-generated artwork.

Coordinate bounds: west 72.96, south 19.10, east 73.19, north 19.30. Height is exaggerated for miniature architectural legibility. Footprints retain geographic locations; unspecified building heights and facade details are illustrative. The route is a visual navigation connection rather than a surveyed or operating railway alignment.
