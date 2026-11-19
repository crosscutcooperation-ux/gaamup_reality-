use super::*;
use axum::{
    http::HeaderValue,
    routing::{post, put},
};
use sha2::{Digest, Sha256};
use std::{
    io::{Cursor, Read},
    path::Component,
};
use tower_http::{cors::CorsLayer, set_header::SetResponseHeaderLayer};

const LIMIT: usize = 200 * 1024 * 1024;
const KINDS: &[&str] = &[
    "colony",
    "building",
    "unit",
    "floor-plan",
    "normal-plan",
    "furnished-image",
    "preview",
    "code",
    "manifest",
];

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    #[serde(default)]
    pub id: String,
    pub slug: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub location: String,
    #[serde(default)]
    pub price: String,
    #[serde(default)]
    pub construction_status: String,
    #[serde(default)]
    pub configuration: String,
    #[serde(default)]
    pub city_slugs: Vec<String>,
    #[serde(default)]
    pub cover_image: String,
    #[serde(default)]
    pub published: bool,
    #[serde(default)]
    pub viewer: Viewer,
    #[serde(default)]
    pub manifest: Value,
}
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer {
    #[serde(default)]
    pub kind: String,
    #[serde(default)]
    pub asset_id: String,
    #[serde(default)]
    pub url: String,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    pub id: String,
    pub project_id: String,
    pub kind: String,
    pub name: String,
    pub url: String,
    pub bytes: usize,
    pub sha256: String,
    pub media_type: String,
    pub building_id: String,
    pub floor_id: String,
    pub unit_id: String,
    pub metadata: Value,
}
pub fn initialize(connection: &mut Connection) -> Result<(), Box<dyn std::error::Error>> {
    connection.execute_batch("CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,document TEXT NOT NULL); CREATE TABLE IF NOT EXISTS project_assets(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,document TEXT NOT NULL);")?;
    for source in [
        include_str!("../project-seed.json"),
        include_str!("../venus-project-seed.json"),
        include_str!("../elements-project-seed.json"),
    ] {
        let seed: Value = serde_json::from_str(source)?;
        connection.execute(
            "INSERT OR IGNORE INTO projects(id,slug,document) VALUES (?1,?2,?3)",
            params![seed["id"].as_str(), seed["slug"].as_str(), seed.to_string()],
        )?;
    }
    let transaction = connection.transaction()?;
    let migrated = transaction.execute(
        "INSERT OR IGNORE INTO metadata(key,value) VALUES ('catalog-locations-and-status-v1','1')",
        [],
    )?;
    if migrated == 1 {
        transaction.execute_batch(
            "UPDATE projects SET document=json_set(document,'$.citySlugs',json_array('dombivli'))
             WHERE id='sai-world-dreams' AND COALESCE(json_array_length(document,'$.citySlugs'),0)=0;
             UPDATE projects SET document=json_set(document,'$.constructionStatus',
               COALESCE(NULLIF(json_extract(document,'$.manifest.catalog.status'),''),'under-construction'))
             WHERE id IN ('sai-world-dreams','venus-skky-city','elements-new-panvel')
               AND COALESCE(json_extract(document,'$.constructionStatus'),'')='';
             UPDATE properties SET document=json_set(document,'$.constructionStatus','under-construction')
             WHERE id IN ('sai-world-dreams','venus-skky-city','elements-new-panvel')
               AND COALESCE(json_extract(document,'$.constructionStatus'),'')='';",
        )?;
    }
    transaction.commit()?;
    Ok(())
}
pub fn routes(state: &Shared) -> Router<Shared> {
    let files = ServeDir::new(state.uploads.with_file_name("scene-assets"));
    let files = tower::ServiceBuilder::new()
        .layer(CorsLayer::permissive())
        .layer(SetResponseHeaderLayer::overriding(axum::http::header::CONTENT_SECURITY_POLICY,HeaderValue::from_static("sandbox allow-scripts allow-pointer-lock; frame-ancestors 'self'; object-src 'none'; base-uri 'self'")))
        .layer(SetResponseHeaderLayer::overriding(axum::http::header::X_CONTENT_TYPE_OPTIONS,HeaderValue::from_static("nosniff")))
        .service(files);
    Router::new()
        .route("/api/projects", get(public_projects))
        .route("/api/projects/{slug}", get(public_project))
        .route(
            "/api/admin/projects",
            get(admin_projects).post(create_project),
        )
        .route("/api/admin/projects/{id}", put(update_project))
        .route(
            "/api/admin/projects/{id}/assets",
            get(admin_assets)
                .post(upload_asset)
                .layer(DefaultBodyLimit::max(LIMIT)),
        )
        .route("/api/admin/projects/{id}/viewer", post(select_viewer))
        .nest_service("/scene-assets", files)
}
fn projects(connection: &Connection) -> Result<Vec<Project>, ApiError> {
    let mut q = connection
        .prepare("SELECT document FROM projects ORDER BY rowid")
        .map_err(internal)?;
    let rows = q
        .query_map([], |r| r.get::<_, String>(0))
        .map_err(internal)?;
    rows.map(|r| serde_json::from_str(&r.map_err(internal)?).map_err(internal))
        .collect()
}
fn project(connection: &Connection, id: &str) -> Result<Project, ApiError> {
    let doc = connection
        .query_row(
            "SELECT document FROM projects WHERE id=?1 OR slug=?1",
            [id],
            |r| r.get::<_, String>(0),
        )
        .map_err(|_| ApiError(StatusCode::NOT_FOUND, "Project not found.".into()))?;
    serde_json::from_str(&doc).map_err(internal)
}
fn assets(connection: &Connection, id: &str) -> Result<Vec<Asset>, ApiError> {
    let mut q = connection
        .prepare("SELECT document FROM project_assets WHERE project_id=?1 ORDER BY rowid DESC")
        .map_err(internal)?;
    let rows = q
        .query_map([id], |r| r.get::<_, String>(0))
        .map_err(internal)?;
    rows.map(|r| serde_json::from_str(&r.map_err(internal)?).map_err(internal))
        .collect()
}
fn save(connection: &Connection, p: &Project) -> Result<(), ApiError> {
    connection
        .execute(
            "UPDATE projects SET slug=?1,document=?2 WHERE id=?3",
            params![p.slug, serde_json::to_string(p).map_err(internal)?, p.id],
        )
        .map_err(|_| bad("That project address is already in use."))?;
    Ok(())
}
async fn public_projects(State(state): State<Shared>) -> Result<Json<Vec<Project>>, ApiError> {
    database(state, |c| {
        Ok(Json(
            projects(&c)?.into_iter().filter(|p| p.published).collect(),
        ))
    })
    .await
}
async fn public_project(
    State(state): State<Shared>,
    Path(slug): Path<String>,
) -> Result<Json<Value>, ApiError> {
    database(state, move |c| {
        let p = project(&c, &slug)?;
        if !p.published {
            return Err(ApiError(StatusCode::NOT_FOUND, "Project not found.".into()));
        }
        let a = assets(&c, &p.id)?;
        Ok(Json(json!({"project":p,"assets":a})))
    })
    .await
}
async fn admin_projects(
    State(state): State<Shared>,
    headers: HeaderMap,
) -> Result<Json<Vec<Project>>, ApiError> {
    authorized(&headers, &state)?;
    database(state, |c| Ok(Json(projects(&c)?))).await
}
fn validate(p: &mut Project, state: &Shared) -> Result<(), ApiError> {
    p.name = p.name.trim().into();
    if p.name.is_empty() || p.name.len() > 200 {
        return Err(bad("Project name is required (up to 200 characters)."));
    }
    if p.slug.is_empty()
        || p.slug.len() > 100
        || !p
            .slug
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(bad(
            "Use lowercase letters, numbers and hyphens for the project address.",
        ));
    }
    if p.description.len() > 10000
        || p.location.len() > 200
        || p.price.len() > 200
        || p.configuration.len() > 200
    {
        return Err(bad("Project details are too long."));
    }
    if !["", "under-construction", "ready-to-move", "new-launch"]
        .contains(&p.construction_status.as_str())
    {
        return Err(bad("Choose a supported construction status."));
    }
    if p.city_slugs.iter().any(|slug| {
        !state.seed["cities"]
            .as_array()
            .unwrap()
            .iter()
            .any(|c| c["slug"].as_str() == Some(slug))
    }) {
        return Err(bad("Choose a city from the station list."));
    }
    if !p.cover_image.is_empty()
        && !p.cover_image.starts_with("/assets/")
        && !p.cover_image.starts_with("/scenes/")
        && !p.cover_image.starts_with("/scene-assets/")
        && !p.cover_image.starts_with("/uploads/")
    {
        return Err(bad("Choose a local uploaded project image."));
    }
    validate_manifest(&p.manifest, &p.id)?;
    Ok(())
}
fn validate_manifest(value: &Value, id: &str) -> Result<(), ApiError> {
    if value.is_null() {
        return Ok(());
    }
    if !value.is_object() || value.to_string().len() > 1024 * 1024 {
        return Err(bad("Manifest must be a JSON object up to 1 MB."));
    }
    if value
        .get("projectId")
        .is_some_and(|p| p.as_str() != Some(id))
    {
        return Err(bad("Manifest projectId must match this project."));
    }
    let mut ids = std::collections::HashSet::new();
    if let Some(nodes) = value.get("nodes") {
        let nodes = nodes
            .as_array()
            .ok_or_else(|| bad("Manifest nodes must be an array."))?;
        if nodes.len() > 20000 {
            return Err(bad("Manifest has too many nodes."));
        }
        for node in nodes {
            let nid = node["id"].as_str().unwrap_or("");
            if nid.is_empty() || nid.len() > 200 || !ids.insert(nid) {
                return Err(bad("Every manifest node needs a unique, stable id."));
            }
            if !["project", "building", "floor", "unit", "amenity"]
                .contains(&node["type"].as_str().unwrap_or(""))
            {
                return Err(bad(
                    "Use project, building, floor, unit or amenity node types.",
                ));
            }
        }
        for node in nodes {
            if let Some(parent) = node["parentId"].as_str() {
                if !ids.contains(parent) || Some(parent) == node["id"].as_str() {
                    return Err(bad(
                        "Manifest parentId must reference another node in the manifest.",
                    ));
                }
            }
        }
        for node in nodes {
            let mut visited = std::collections::HashSet::new();
            let mut current = Some(node);
            while let Some(n) = current {
                if !visited.insert(n["id"].as_str().unwrap()) {
                    return Err(bad("Manifest hierarchy contains a cycle."));
                }
                current = n["parentId"]
                    .as_str()
                    .and_then(|pid| nodes.iter().find(|p| p["id"].as_str() == Some(pid)));
            }
        }
    }
    Ok(())
}
async fn create_project(
    State(state): State<Shared>,
    headers: HeaderMap,
    Json(mut p): Json<Project>,
) -> Result<(StatusCode, Json<Project>), ApiError> {
    authorized(&headers, &state)?;
    p.id = Uuid::new_v4().to_string();
    p.viewer = Viewer::default();
    validate(&mut p, &state)?;
    database(state, move |c| {
        c.execute(
            "INSERT INTO projects(id,slug,document) VALUES (?1,?2,?3)",
            params![p.id, p.slug, serde_json::to_string(&p).map_err(internal)?],
        )
        .map_err(|_| bad("That project address is already in use."))?;
        Ok((StatusCode::CREATED, Json(p)))
    })
    .await
}
async fn update_project(
    State(state): State<Shared>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(mut p): Json<Project>,
) -> Result<Json<Project>, ApiError> {
    authorized(&headers, &state)?;
    p.id = id;
    validate(&mut p, &state)?;
    database(state, move |c| {
        let old = project(&c, &p.id)?;
        p.viewer = old.viewer;
        save(&c, &p)?;
        Ok(Json(p))
    })
    .await
}
async fn admin_assets(
    State(state): State<Shared>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<Json<Vec<Asset>>, ApiError> {
    authorized(&headers, &state)?;
    database(state, move |c| {
        let p = project(&c, &id)?;
        Ok(Json(assets(&c, &p.id)?))
    })
    .await
}
fn header(headers: &HeaderMap, key: &str) -> String {
    headers
        .get(key)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .chars()
        .take(200)
        .collect()
}

// GLBs must be self-contained. This also catches truncated files before publication.
fn validate_glb(body: &[u8]) -> Result<Value, ApiError> {
    if body.len() < 20
        || &body[..4] != b"glTF"
        || u32::from_le_bytes(body[4..8].try_into().unwrap()) != 2
        || u32::from_le_bytes(body[8..12].try_into().unwrap()) as usize != body.len()
    {
        return Err(bad(
            "Upload a complete GLB version 2 file with embedded textures.",
        ));
    }
    let mut offset = 12;
    let mut doc = None;
    let mut bin_len = 0;
    while offset < body.len() {
        if offset + 8 > body.len() {
            return Err(bad("GLB chunk is truncated."));
        }
        let len = u32::from_le_bytes(body[offset..offset + 4].try_into().unwrap()) as usize;
        let tag = &body[offset + 4..offset + 8];
        offset += 8;
        if len % 4 != 0 || offset + len > body.len() {
            return Err(bad("GLB chunk length is invalid."));
        }
        if tag == b"JSON" {
            if doc.is_some() || offset != 20 {
                return Err(bad("GLB must begin with one JSON chunk."));
            }
            doc = Some(
                serde_json::from_slice::<Value>(&body[offset..offset + len])
                    .map_err(|_| bad("GLB JSON is invalid."))?,
            );
        } else if tag == b"BIN\0" {
            bin_len = len;
        }
        offset += len;
    }
    let doc = doc.ok_or_else(|| bad("GLB has no scene document."))?;
    if doc["asset"]["version"].as_str() != Some("2.0") {
        return Err(bad("GLB scene must use glTF 2.0."));
    }
    if doc["extensionsRequired"].as_array().is_some_and(|list| {
        list.iter().any(|e| {
            [
                "KHR_draco_mesh_compression",
                "EXT_meshopt_compression",
                "KHR_texture_basisu",
            ]
            .contains(&e.as_str().unwrap_or(""))
        })
    }) {
        return Err(bad(
            "Export an uncompressed GLB; this viewer does not yet include Draco, Meshopt or KTX2 decoders.",
        ));
    }
    for key in ["buffers", "images"] {
        if let Some(items) = doc[key].as_array() {
            for item in items {
                if item.get("uri").is_some() {
                    return Err(bad(
                        "Pack all images and buffers into the GLB before uploading.",
                    ));
                }
            }
        }
    }
    if let Some(buffers) = doc["buffers"].as_array() {
        if buffers.len() > 1
            || buffers
                .first()
                .is_some_and(|b| b["byteLength"].as_u64().unwrap_or(u64::MAX) > bin_len as u64)
        {
            return Err(bad("GLB binary data is missing or truncated."));
        }
    }
    if doc["meshes"].as_array().is_none_or(|m| m.is_empty()) {
        return Err(bad("The GLB must contain model meshes."));
    }
    let names = doc["nodes"]
        .as_array()
        .map(|n| {
            n.iter()
                .filter_map(|v| v["name"].as_str())
                .take(2000)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    Ok(
        json!({"format":"glTF 2.0","axis":"Y-up","nodeNames":names,"meshCount":doc["meshes"].as_array().map_or(0,Vec::len),"imageCount":doc["images"].as_array().map_or(0,Vec::len)}),
    )
}
fn asset_url_path(path: &str) -> String {
    path.split('/')
        .map(|segment| {
            percent_encoding::utf8_percent_encode(segment, percent_encoding::NON_ALPHANUMERIC)
                .to_string()
        })
        .collect::<Vec<_>>()
        .join("/")
}
fn extract_package(body: &[u8], root: &std::path::Path) -> Result<String, ApiError> {
    let mut zip = zip::ZipArchive::new(Cursor::new(body))
        .map_err(|_| bad("Upload a ZIP containing a built static viewer and index.html."))?;
    if zip.len() > 2000 {
        return Err(bad("Viewer package has too many files (maximum 2,000)."));
    }
    let mut total = 0u64;
    let mut paths = std::collections::HashSet::new();
    // Inspect everything before writing; reject links, duplicate paths and traversal.
    for i in 0..zip.len() {
        let file = zip.by_index(i).map_err(|_| bad("Cannot read ZIP entry."))?;
        let name = file.name();
        let path = std::path::Path::new(name);
        if name.contains('\\')
            || path
                .components()
                .any(|c| !matches!(c, Component::Normal(_)))
            || file.enclosed_name().is_none()
            || !paths.insert(name.to_string())
            || file.unix_mode().is_some_and(|m| m & 0o170000 == 0o120000)
        {
            return Err(bad(
                "Viewer ZIP contains an unsafe path, duplicate file or symbolic link.",
            ));
        }
        total = total
            .checked_add(file.size())
            .ok_or_else(|| bad("ZIP is too large."))?;
        if total > 512 * 1024 * 1024 || file.size() > LIMIT as u64 {
            return Err(bad(
                "Expanded viewer package must be under 512 MB, with files under 200 MB.",
            ));
        }
    }
    let entry = if paths.contains("index.html") {
        "index.html".to_string()
    } else {
        let entries = paths
            .iter()
            .filter(|p| p.ends_with("/index.html") && p.matches('/').count() == 1)
            .cloned()
            .collect::<Vec<_>>();
        if entries.len() != 1 {
            return Err(bad(
                "Put index.html at the ZIP root or inside one enclosing folder.",
            ));
        }
        entries[0].clone()
    };
    for i in 0..zip.len() {
        let mut file = zip.by_index(i).map_err(|_| bad("Cannot read ZIP entry."))?;
        let destination = root.join(file.enclosed_name().unwrap());
        if file.is_dir() {
            std::fs::create_dir_all(destination).map_err(internal)?;
        } else {
            std::fs::create_dir_all(destination.parent().unwrap()).map_err(internal)?;
            let mut output = std::fs::File::create(destination).map_err(internal)?;
            let copied = std::io::copy(
                &mut Read::by_ref(&mut file).take(LIMIT as u64 + 1),
                &mut output,
            )
            .map_err(internal)?;
            if copied > LIMIT as u64 {
                return Err(bad("ZIP file exceeds the upload limit."));
            }
        }
    }
    Ok(entry)
}
async fn upload_asset(
    State(state): State<Shared>,
    Path(id): Path<String>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<(StatusCode, Json<Asset>), ApiError> {
    authorized(&headers, &state)?;
    if body.is_empty() || body.len() > LIMIT {
        return Err(bad("Choose a file up to 200 MB."));
    }
    let kind = header(&headers, "x-asset-kind");
    if !KINDS.contains(&kind.as_str()) {
        return Err(bad("Choose a supported asset category."));
    }
    let encoded_name = header(&headers, "x-file-name");
    let name = percent_encoding::percent_decode_str(&encoded_name)
        .decode_utf8_lossy()
        .to_string();
    let name = if name.is_empty() {
        "asset".into()
    } else {
        name
    };
    let binding = [
        header(&headers, "x-building-id"),
        header(&headers, "x-floor-id"),
        header(&headers, "x-unit-id"),
    ];
    let content_type = header(&headers, "content-type");
    let storage = state.uploads.with_file_name("scene-assets");
    database(state, move |c| {
        let mut p = project(&c, &id)?;
        let asset_id = Uuid::new_v4().to_string();
        let directory = storage.join(&asset_id);
        let mut metadata = Value::Null;
        let (extension, media_type) = match kind.as_str() {
            "colony" | "building" | "unit" => {
                metadata = validate_glb(&body)?;
                ("glb", "model/gltf-binary")
            }
            "manifest" => {
                metadata = serde_json::from_slice(&body)
                    .map_err(|_| bad("Manifest must be valid JSON."))?;
                validate_manifest(&metadata, &p.id)?;
                ("json", "application/json")
            }
            "code" => {
                if content_type.starts_with("text/html") {
                    let html =
                        std::str::from_utf8(&body).map_err(|_| bad("HTML must be UTF-8."))?;
                    if !html.to_lowercase().contains("<html") {
                        return Err(bad(
                            "Paste a complete HTML document or upload a built viewer ZIP.",
                        ));
                    }
                    ("html", "text/html")
                } else {
                    ("zip", "application/zip")
                }
            }
            _ => {
                if body.starts_with(b"\x89PNG\r\n\x1a\n") {
                    ("png", "image/png")
                } else if body.starts_with(&[255, 216, 255]) {
                    ("jpg", "image/jpeg")
                } else if body.len() > 12 && &body[..4] == b"RIFF" && &body[8..12] == b"WEBP" {
                    ("webp", "image/webp")
                } else if body.starts_with(b"%PDF-")
                    && ["floor-plan", "normal-plan"].contains(&kind.as_str())
                {
                    ("pdf", "application/pdf")
                } else {
                    return Err(bad("Choose a PNG, JPG, WebP or a floor-plan PDF."));
                }
            }
        };
        std::fs::create_dir_all(&directory).map_err(internal)?;
        let result = (|| {
            let filename = if kind == "code" && extension == "zip" {
                extract_package(&body, &directory)?
            } else {
                let f = format!("asset.{extension}");
                std::fs::write(directory.join(&f), &body).map_err(internal)?;
                f
            };
            let asset = Asset {
                id: asset_id.clone(),
                project_id: p.id.clone(),
                kind: kind.clone(),
                name,
                url: format!("/scene-assets/{asset_id}/{}", asset_url_path(&filename)),
                bytes: body.len(),
                sha256: format!("{:x}", Sha256::digest(&body)),
                media_type: media_type.into(),
                building_id: binding[0].clone(),
                floor_id: binding[1].clone(),
                unit_id: binding[2].clone(),
                metadata,
            };
            let tx = c.unchecked_transaction().map_err(internal)?;
            tx.execute(
                "INSERT INTO project_assets(id,project_id,document) VALUES (?1,?2,?3)",
                params![
                    asset.id,
                    asset.project_id,
                    serde_json::to_string(&asset).map_err(internal)?
                ],
            )
            .map_err(internal)?;
            if kind == "manifest" {
                p.manifest = asset.metadata.clone();
                save(&tx, &p)?;
            }
            tx.commit().map_err(internal)?;
            Ok((StatusCode::CREATED, Json(asset)))
        })();
        if result.is_err() {
            let _ = std::fs::remove_dir_all(&directory);
        }
        result
    })
    .await
}
async fn select_viewer(
    State(state): State<Shared>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(value): Json<Value>,
) -> Result<Json<Project>, ApiError> {
    authorized(&headers, &state)?;
    database(state, move |c| {
        let mut p = project(&c, &id)?;
        if value["builtin"] == true && ["sai-world-dreams", "venus-skky-city"].contains(&p.id.as_str()) {
            p.viewer = Viewer {
                kind: "builtin".into(),
                asset_id: String::new(),
                url: format!("/scenes/{}/index.html", p.id),
            };
        } else {
            let a = assets(&c, &p.id)?
                .into_iter()
                .find(|a| Some(a.id.as_str()) == value["assetId"].as_str())
                .ok_or_else(|| bad("Choose an asset belonging to this project."))?;
            let kind = match a.kind.as_str() {
                "colony" | "building" | "unit" => "glb",
                "code" => "code",
                _ => return Err(bad("Choose a GLB or interactive viewer package.")),
            };
            p.viewer = Viewer {
                kind: kind.into(),
                asset_id: a.id,
                url: a.url,
            };
        }
        save(&c, &p)?;
        Ok(Json(p))
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use http_body_util::BodyExt;
    use tower::ServiceExt;
    fn setup() -> (Shared, PathBuf) {
        let p = std::env::temp_dir().join(format!("aero-3d-test-{}", Uuid::new_v4()));
        (super::super::initialize(p.clone()).unwrap(), p)
    }
    async fn call(
        state: Shared,
        method: &str,
        url: &str,
        body: Vec<u8>,
        kind: Option<&str>,
        auth: bool,
    ) -> (StatusCode, Value, HeaderMap) {
        let mut req = Request::builder().method(method).uri(url).header(
            "content-type",
            if kind == Some("code-html") {
                "text/html"
            } else {
                "application/json"
            },
        );
        if auth {
            req = req.header("authorization", format!("Bearer {}", state.key));
        }
        if let Some(kind) = kind {
            req = req
                .header(
                    "x-asset-kind",
                    if kind == "code-html" { "code" } else { kind },
                )
                .header("x-file-name", "sample.glb")
                .header("x-building-id", "tower-A");
        }
        let response = app(state)
            .oneshot(req.body(Body::from(body)).unwrap())
            .await
            .unwrap();
        let status = response.status();
        let headers = response.headers().clone();
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        (
            status,
            serde_json::from_slice(&bytes).unwrap_or(Value::Null),
            headers,
        )
    }
    #[tokio::test]
    async fn projects_have_stable_ids_and_publish_only_when_requested() {
        let (state, dir) = setup();
        let (_, list, _) = call(state.clone(), "GET", "/api/projects", vec![], None, false).await;
        assert_eq!(list.as_array().unwrap().len(), 3);
        assert_eq!(list[0]["id"], "sai-world-dreams");
        let mut draft = list[0].clone();
        draft["name"] = json!("A real new project");
        draft["slug"] = json!("new-project");
        draft["published"] = json!(false);
        draft["manifest"] = Value::Null;
        draft["citySlugs"] = json!(["panvel"]);
        assert_eq!(
            call(
                state.clone(),
                "POST",
                "/api/admin/projects",
                draft.to_string().into_bytes(),
                None,
                false
            )
            .await
            .0,
            StatusCode::UNAUTHORIZED
        );
        let (status, mut created, _) = call(
            state.clone(),
            "POST",
            "/api/admin/projects",
            draft.to_string().into_bytes(),
            None,
            true,
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        assert_ne!(created["id"], draft["id"]);
        assert_eq!(created["viewer"]["url"], "");
        assert_eq!(
            call(
                state.clone(),
                "GET",
                "/api/projects/new-project",
                vec![],
                None,
                false
            )
            .await
            .0,
            StatusCode::NOT_FOUND
        );
        let id = created["id"].as_str().unwrap().to_string();
        created["published"] = json!(true);
        created["constructionStatus"] = json!("ready-to-move");
        created["price"] = json!("₹80 L");
        assert_eq!(
            call(
                state.clone(),
                "PUT",
                &format!("/api/admin/projects/{id}"),
                created.to_string().into_bytes(),
                None,
                true
            )
            .await
            .0,
            StatusCode::OK
        );
        let reopened = super::super::initialize(dir.clone()).unwrap();
        let (status, data, _) = call(
            reopened.clone(),
            "GET",
            "/api/projects/new-project",
            vec![],
            None,
            false,
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(data["project"]["citySlugs"], json!(["panvel"]));
        assert_eq!(data["project"]["constructionStatus"], "ready-to-move");
        assert_eq!(data["project"]["price"], "₹80 L");
        created["manifest"] = json!({"projectId":id,"nodes":[{"id":"a","type":"building","parentId":"b"},{"id":"b","type":"floor","parentId":"a"}]});
        assert_eq!(
            call(
                reopened,
                "PUT",
                &format!("/api/admin/projects/{id}"),
                created.to_string().into_bytes(),
                None,
                true
            )
            .await
            .0,
            StatusCode::BAD_REQUEST
        );
        std::fs::remove_dir_all(dir).unwrap();
    }
    #[tokio::test]
    async fn glb_upload_validates_stores_binds_and_restores_opening_scene() {
        let (state, dir) = setup();
        let url = "/api/admin/projects/sai-world-dreams/assets";
        assert_eq!(
            call(
                state.clone(),
                "POST",
                url,
                b"bad".to_vec(),
                Some("colony"),
                false
            )
            .await
            .0,
            StatusCode::UNAUTHORIZED
        );
        assert_eq!(
            call(
                state.clone(),
                "POST",
                url,
                b"bad".to_vec(),
                Some("colony"),
                true
            )
            .await
            .0,
            StatusCode::BAD_REQUEST
        );
        let glb = std::fs::read(
            PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("../public/models/mumbai-ac-local-optimized.glb"),
        )
        .unwrap();
        let (status, asset, _) = call(
            state.clone(),
            "POST",
            url,
            glb.clone(),
            Some("colony"),
            true,
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(asset["buildingId"], "tower-A");
        assert_eq!(asset["bytes"], glb.len());
        assert_eq!(asset["sha256"].as_str().unwrap().len(), 64);
        assert!(asset["metadata"]["imageCount"].as_u64().unwrap() > 0);
        let file = asset["url"].as_str().unwrap();
        let (status, _, headers) = call(state.clone(), "GET", file, vec![], None, false).await;
        assert_eq!(status, StatusCode::OK);
        assert!(
            headers["content-security-policy"]
                .to_str()
                .unwrap()
                .starts_with("sandbox allow-scripts")
        );
        assert_eq!(headers["access-control-allow-origin"], "*");
        assert_eq!(
            call(
                state.clone(),
                "GET",
                &file.replace("/scene-assets/", "/uploads/scenes/"),
                vec![],
                None,
                false
            )
            .await
            .0,
            StatusCode::NOT_FOUND
        );
        let select = json!({"assetId":asset["id"]});
        assert_eq!(
            call(
                state.clone(),
                "POST",
                "/api/admin/projects/sai-world-dreams/viewer",
                select.to_string().into_bytes(),
                None,
                true
            )
            .await
            .1["viewer"]["kind"],
            "glb"
        );
        let reopened = super::super::initialize(dir.clone()).unwrap();
        let (_, data, _) = call(
            reopened.clone(),
            "GET",
            "/api/projects/sai-world-dreams",
            vec![],
            None,
            false,
        )
        .await;
        assert_eq!(data["project"]["viewer"]["url"], file);
        assert_eq!(data["assets"].as_array().unwrap().len(), 1);
        assert_eq!(
            call(
                reopened,
                "POST",
                "/api/admin/projects/sai-world-dreams/viewer",
                b"{\"builtin\":true}".to_vec(),
                None,
                true
            )
            .await
            .1["viewer"]["kind"],
            "builtin"
        );
        std::fs::remove_dir_all(dir).unwrap();
    }
    fn zip_file(path: &str, content: &[u8]) -> Vec<u8> {
        let mut zip = zip::ZipWriter::new(Cursor::new(Vec::new()));
        zip.start_file(path, zip::write::SimpleFileOptions::default())
            .unwrap();
        std::io::Write::write_all(&mut zip, content).unwrap();
        zip.finish().unwrap().into_inner()
    }
    #[tokio::test]
    async fn viewer_packages_reject_traversal_and_run_as_sandboxed_static_files() {
        let (state, dir) = setup();
        let url = "/api/admin/projects/sai-world-dreams/assets";
        assert_eq!(
            call(
                state.clone(),
                "POST",
                url,
                zip_file("../escape.html", b"<html></html>"),
                Some("code"),
                true
            )
            .await
            .0,
            StatusCode::BAD_REQUEST
        );
        assert_eq!(
            call(
                state.clone(),
                "POST",
                url,
                zip_file("package.json", b"{}"),
                Some("code"),
                true
            )
            .await
            .0,
            StatusCode::BAD_REQUEST
        );
        let (status, asset, _) = call(
            state.clone(),
            "POST",
            url,
            zip_file(
                "dist/index.html",
                b"<!doctype html><html><body>3D</body></html>",
            ),
            Some("code"),
            true,
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        let (status, _, headers) = call(
            state.clone(),
            "GET",
            asset["url"].as_str().unwrap(),
            vec![],
            None,
            false,
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert!(
            headers["content-security-policy"]
                .to_str()
                .unwrap()
                .contains("sandbox allow-scripts")
        );
        assert!(
            !headers["content-security-policy"]
                .to_str()
                .unwrap()
                .contains("allow-same-origin")
        );
        // Route has its own larger limit; ordinary image uploads keep their 8 MB limit.
        let html = format!("<html><body>{}</body></html>", " ".repeat(9 * 1024 * 1024));
        assert_eq!(
            call(
                state.clone(),
                "POST",
                url,
                html.into_bytes(),
                Some("code-html"),
                true
            )
            .await
            .0,
            StatusCode::CREATED
        );
        let (_, assets, _) = call(state, "GET", url, vec![], None, true).await;
        assert_eq!(
            assets.as_array().unwrap().len(),
            2,
            "Rejected packages must not leave asset records"
        );
        assert!(!dir.join("escape.html").exists());
        std::fs::remove_dir_all(dir).unwrap();
    }
}
