mod projects;
use axum::{
    Json, Router,
    body::Bytes,
    extract::{DefaultBodyLimit, Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{path::PathBuf, sync::Arc};
use tower_http::services::ServeDir;
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    database: PathBuf,
    uploads: PathBuf,
    key: String,
    seed: Value,
}
type Shared = Arc<AppState>;
#[derive(Debug)]
struct ApiError(StatusCode, String);
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({"error":self.1}))).into_response()
    }
}
fn internal(error: impl std::fmt::Display) -> ApiError {
    eprintln!("Backend error: {error}");
    ApiError(
        StatusCode::INTERNAL_SERVER_ERROR,
        "The property service could not complete that request.".into(),
    )
}
fn bad(message: &str) -> ApiError {
    ApiError(StatusCode::BAD_REQUEST, message.into())
}
fn authorized(headers: &HeaderMap, state: &AppState) -> Result<(), ApiError> {
    let supplied = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if supplied != format!("Bearer {}", state.key) {
        return Err(ApiError(
            StatusCode::UNAUTHORIZED,
            "Enter your local admin key to manage properties.".into(),
        ));
    }
    Ok(())
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Property {
    #[serde(default)]
    id: String,
    name: String,
    city: String,
    locality: String,
    price: String,
    area: String,
    bhk: String,
    developer: String,
    image: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    construction_status: String,
    #[serde(default = "yes")]
    published: bool,
    #[serde(default = "yes")]
    featured: bool,
    #[serde(default)]
    position: i64,
    #[serde(default)]
    archived: bool,
}
fn yes() -> bool {
    true
}
fn validate(property: &mut Property, state: &AppState) -> Result<(), ApiError> {
    for (name, value) in [
        ("Name", &mut property.name),
        ("City", &mut property.city),
        ("Locality", &mut property.locality),
        ("Price", &mut property.price),
        ("Area", &mut property.area),
        ("BHK", &mut property.bhk),
        ("Developer", &mut property.developer),
    ] {
        *value = value.trim().to_string();
        if value.is_empty() || value.chars().count() > 200 {
            return Err(bad(&format!(
                "{name} must contain between 1 and 200 characters."
            )));
        }
    }
    if !state.seed["cities"]
        .as_array()
        .unwrap()
        .iter()
        .any(|city| city["name"].as_str() == Some(&property.city))
    {
        return Err(bad("Choose a city from the station list."));
    }
    if !["", "under-construction", "ready-to-move", "new-launch"]
        .contains(&property.construction_status.as_str())
    {
        return Err(bad("Choose a supported construction status."));
    }
    if property.description.chars().count() > 5000 {
        return Err(bad("Description must be 5,000 characters or fewer."));
    }
    let local_asset = ["evara.webp", "pool.jpg"].contains(&property.image.as_str())
        || state.seed["properties"].as_array().is_some_and(|properties| {
            properties.iter().any(|p| p["image"].as_str() == Some(property.image.as_str()))
        });
    let uploaded = property
        .image
        .strip_prefix("/uploads/")
        .is_some_and(|name| {
            !name.is_empty()
                && name
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '.')
                && state.uploads.join(name).is_file()
        });
    if !local_asset && !uploaded {
        return Err(bad("Choose a bundled photo or upload a property photo."));
    }
    if !(-10000..=10000).contains(&property.position) {
        return Err(bad("Display position must be between -10000 and 10000."));
    }
    Ok(())
}
async fn database<T, F>(state: Shared, operation: F) -> Result<T, ApiError>
where
    T: Send + 'static,
    F: FnOnce(Connection) -> Result<T, ApiError> + Send + 'static,
{
    tokio::task::spawn_blocking(move || {
        let connection = Connection::open(&state.database).map_err(internal)?;
        connection
            .busy_timeout(std::time::Duration::from_secs(5))
            .map_err(internal)?;
        operation(connection)
    })
    .await
    .map_err(internal)?
}
fn read_properties(connection: &Connection) -> Result<Vec<Property>, ApiError> {
    let mut query = connection
        .prepare("SELECT document FROM properties")
        .map_err(internal)?;
    let rows = query
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(internal)?;
    let mut result = Vec::new();
    for row in rows {
        result.push(serde_json::from_str::<Property>(&row.map_err(internal)?).map_err(internal)?);
    }
    result.sort_by(|a, b| a.position.cmp(&b.position).then(a.id.cmp(&b.id)));
    Ok(result)
}
async fn health() -> Json<Value> {
    Json(
        json!({"status":"ok","service":"aero-property-discovery","runtime":"rust","database":"sqlite"}),
    )
}
async fn catalog(State(state): State<Shared>) -> Result<Json<Value>, ApiError> {
    let properties = database(state.clone(), |connection| {
        Ok(read_properties(&connection)?
            .into_iter()
            .filter(|p| p.published && !p.archived)
            .collect::<Vec<_>>())
    })
    .await?;
    Ok(Json(
        json!({"cities":state.seed["cities"],"builders":state.seed["builders"],"properties":properties}),
    ))
}
async fn public_properties(State(state): State<Shared>) -> Result<Json<Vec<Property>>, ApiError> {
    database(state, |connection| {
        Ok(Json(
            read_properties(&connection)?
                .into_iter()
                .filter(|p| p.published && !p.archived)
                .collect(),
        ))
    })
    .await
}
async fn admin_properties(
    State(state): State<Shared>,
    headers: HeaderMap,
) -> Result<Json<Vec<Property>>, ApiError> {
    authorized(&headers, &state)?;
    database(state, |connection| Ok(Json(read_properties(&connection)?))).await
}
async fn create_property(
    State(state): State<Shared>,
    headers: HeaderMap,
    Json(mut property): Json<Property>,
) -> Result<(StatusCode, Json<Property>), ApiError> {
    authorized(&headers, &state)?;
    validate(&mut property, &state)?;
    property.id = Uuid::new_v4().to_string();
    property.archived = false;
    database(state, move |connection| {
        connection
            .execute(
                "INSERT INTO properties (id,document) VALUES (?1,?2)",
                params![
                    property.id,
                    serde_json::to_string(&property).map_err(internal)?
                ],
            )
            .map_err(internal)?;
        Ok((StatusCode::CREATED, Json(property)))
    })
    .await
}
async fn update_property(
    State(state): State<Shared>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(mut property): Json<Property>,
) -> Result<Json<Property>, ApiError> {
    authorized(&headers, &state)?;
    validate(&mut property, &state)?;
    property.id = id;
    database(state, move |connection| {
        let changed = connection
            .execute(
                "UPDATE properties SET document=?1 WHERE id=?2",
                params![
                    serde_json::to_string(&property).map_err(internal)?,
                    property.id
                ],
            )
            .map_err(internal)?;
        if changed == 0 {
            return Err(ApiError(
                StatusCode::NOT_FOUND,
                "Property not found.".into(),
            ));
        }
        Ok(Json(property))
    })
    .await
}
async fn archive_property(
    State(state): State<Shared>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<Json<Property>, ApiError> {
    authorized(&headers, &state)?;
    database(state, move |connection| {
        let document = connection
            .query_row(
                "SELECT document FROM properties WHERE id=?1",
                [&id],
                |row| row.get::<_, String>(0),
            )
            .map_err(|_| ApiError(StatusCode::NOT_FOUND, "Property not found.".into()))?;
        let mut property: Property = serde_json::from_str(&document).map_err(internal)?;
        property.archived = true;
        connection
            .execute(
                "UPDATE properties SET document=?1 WHERE id=?2",
                params![serde_json::to_string(&property).map_err(internal)?, id],
            )
            .map_err(internal)?;
        Ok(Json(property))
    })
    .await
}
async fn upload_image(
    State(state): State<Shared>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<(StatusCode, Json<Value>), ApiError> {
    authorized(&headers, &state)?;
    if body.is_empty() || body.len() > 8 * 1024 * 1024 {
        return Err(bad("Upload a JPG, PNG or WebP image up to 8 MB."));
    }
    let content_type = headers
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    let extension = if content_type == "image/jpeg" && body.starts_with(&[0xff, 0xd8, 0xff]) {
        "jpg"
    } else if content_type == "image/png" && body.starts_with(b"\x89PNG\r\n\x1a\n") {
        "png"
    } else if content_type == "image/webp"
        && body.len() >= 12
        && &body[..4] == b"RIFF"
        && &body[8..12] == b"WEBP"
    {
        "webp"
    } else {
        return Err(bad("Only JPG, PNG and WebP photos are supported."));
    };
    let filename = format!("{}.{}", Uuid::new_v4(), extension);
    std::fs::write(state.uploads.join(&filename), body).map_err(internal)?;
    Ok((
        StatusCode::CREATED,
        Json(json!({"image":format!("/uploads/{filename}")})),
    ))
}
fn initialize(data: PathBuf) -> Result<Shared, Box<dyn std::error::Error>> {
    std::fs::create_dir_all(data.join("uploads"))?;
    let key_path = data.join("admin-key.txt");
    let key = if key_path.exists() {
        std::fs::read_to_string(&key_path)?.trim().to_string()
    } else {
        let key = format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple());
        std::fs::write(&key_path, &key)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&key_path, std::fs::Permissions::from_mode(0o600))?;
        }
        key
    };
    if key.len() < 32 {
        return Err("Admin key must contain at least 32 characters".into());
    }
    let seed: Value = serde_json::from_str(include_str!("../seed.json"))?;
    let database = data.join("properties.sqlite3");
    let mut connection = Connection::open(&database)?;
    connection.execute_batch("PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS properties(id TEXT PRIMARY KEY,document TEXT NOT NULL); CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);")?;
    let seeded: i64 = connection.query_row(
        "SELECT COUNT(*) FROM metadata WHERE key='seeded'",
        [],
        |r| r.get(0),
    )?;
    if seeded == 0 {
        let transaction = connection.transaction()?;
        for (index, value) in seed["properties"].as_array().unwrap().iter().enumerate() {
            let mut property: Property = serde_json::from_value(value.clone())?;
            property.position = index as i64;
            transaction.execute(
                "INSERT OR IGNORE INTO properties(id,document) VALUES (?1,?2)",
                params![property.id, serde_json::to_string(&property)?],
            )?;
        }
        transaction.execute("INSERT INTO metadata(key,value) VALUES ('seeded','1')", [])?;
        transaction.commit()?;
    }
    let added_elements: i64 = connection.query_row(
        "SELECT COUNT(*) FROM metadata WHERE key='elements-new-panvel-v1'", [], |r| r.get(0),
    )?;
    if added_elements == 0 {
        if let Some(value) = seed["properties"].as_array().unwrap().iter().find(|v| v["id"] == "elements-new-panvel") {
            let mut property: Property = serde_json::from_value(value.clone())?;
            property.position = 2;
            connection.execute("INSERT OR IGNORE INTO properties(id,document) VALUES (?1,?2)", params![property.id, serde_json::to_string(&property)?])?;
        }
        connection.execute("INSERT INTO metadata(key,value) VALUES ('elements-new-panvel-v1','1')", [])?;
    }
    projects::initialize(&mut connection)?;
    std::fs::create_dir_all(data.join("scene-assets"))?;
    Ok(Arc::new(AppState {
        database,
        uploads: data.join("uploads"),
        key,
        seed,
    }))
}
fn app(state: Shared) -> Router {
    Router::new()
        .merge(projects::routes(&state))
        .route("/api/health", get(health))
        .route("/api/catalog", get(catalog))
        .route("/api/properties", get(public_properties))
        .route(
            "/api/admin/properties",
            get(admin_properties).post(create_property),
        )
        .route(
            "/api/admin/properties/{id}",
            axum::routing::put(update_property).delete(archive_property),
        )
        .route("/api/admin/images", axum::routing::post(upload_image))
        .nest_service("/uploads", ServeDir::new(state.uploads.clone()))
        .layer(DefaultBodyLimit::max(8 * 1024 * 1024))
        .with_state(state)
}
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let data = std::env::var_os("AERO_DATA_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data"));
    let state = initialize(data)?;
    let port = std::env::var("AERO_BACKEND_PORT").unwrap_or_else(|_| "4000".into());
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}")).await?;
    println!("Rust backend: http://127.0.0.1:{port}");
    println!("Admin access: use npm run admin:key in the project folder.");
    axum::serve(listener, app(state))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use http_body_util::BodyExt;
    use tower::ServiceExt;
    fn setup() -> (Shared, PathBuf) {
        let path = std::env::temp_dir().join(format!("aero-rust-test-{}", Uuid::new_v4()));
        (initialize(path.clone()).unwrap(), path)
    }
    async fn call(
        state: Shared,
        method: &str,
        path: &str,
        body: Option<Value>,
        auth: bool,
    ) -> (StatusCode, Value) {
        let mut request = Request::builder()
            .method(method)
            .uri(path)
            .header("content-type", "application/json");
        if auth {
            request = request.header("authorization", format!("Bearer {}", state.key));
        }
        let response = app(state)
            .oneshot(
                request
                    .body(
                        body.map(|v| Body::from(v.to_string()))
                            .unwrap_or_else(Body::empty),
                    )
                    .unwrap(),
            )
            .await
            .unwrap();
        let status = response.status();
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        (
            status,
            serde_json::from_slice(&bytes).unwrap_or(Value::Null),
        )
    }
    #[tokio::test]
    async fn property_lifecycle_is_authenticated_and_persistent() {
        let (state, path) = setup();
        let (status, catalogue) = call(state.clone(), "GET", "/api/catalog", None, false).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(catalogue["properties"].as_array().unwrap().len(), 3);
        let mut property = catalogue["properties"][0].clone();
        property["name"] = json!("A new test home");
        property["published"] = json!(false);
        property["constructionStatus"] = json!("under-construction");
        assert_eq!(
            call(
                state.clone(),
                "POST",
                "/api/admin/properties",
                Some(property.clone()),
                false
            )
            .await
            .0,
            StatusCode::UNAUTHORIZED
        );
        let (status, created) = call(
            state.clone(),
            "POST",
            "/api/admin/properties",
            Some(property),
            true,
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        let id = created["id"].as_str().unwrap().to_string();
        assert_eq!(
            call(state.clone(), "GET", "/api/catalog", None, false)
                .await
                .1["properties"]
                .as_array()
                .unwrap()
                .len(),
            3,
            "Draft must not appear publicly"
        );
        assert_eq!(created["constructionStatus"], "under-construction");
        let mut changed = created;
        changed["published"] = json!(true);
        changed["name"] = json!("Updated test home");
        assert_eq!(
            call(
                state.clone(),
                "PUT",
                &format!("/api/admin/properties/{id}"),
                Some(changed.clone()),
                true
            )
            .await
            .0,
            StatusCode::OK
        );
        let reopened = initialize(path.clone()).unwrap();
        let (_, data) = call(reopened.clone(), "GET", "/api/catalog", None, false).await;
        assert!(
            data["properties"]
                .as_array()
                .unwrap()
                .iter()
                .any(|p| p["name"] == "Updated test home"
                    && p["constructionStatus"] == "under-construction"),
            "Updates must survive reopening the database"
        );
        assert_eq!(
            call(
                reopened.clone(),
                "DELETE",
                &format!("/api/admin/properties/{id}"),
                None,
                true
            )
            .await
            .0,
            StatusCode::OK
        );
        assert_eq!(
            call(reopened.clone(), "GET", "/api/catalog", None, false)
                .await
                .1["properties"]
                .as_array()
                .unwrap()
                .len(),
            3
        );
        let (_, all) = call(reopened.clone(), "GET", "/api/admin/properties", None, true).await;
        assert!(
            all.as_array()
                .unwrap()
                .iter()
                .any(|p| p["id"] == id && p["archived"] == true)
        );
        changed["archived"] = json!(false);
        assert_eq!(
            call(
                reopened,
                "PUT",
                &format!("/api/admin/properties/{id}"),
                Some(changed),
                true
            )
            .await
            .0,
            StatusCode::OK
        );
        std::fs::remove_dir_all(path).unwrap();
    }
    #[tokio::test]
    async fn validates_city_image_and_required_fields() {
        let (state, path) = setup();
        let (_, catalogue) = call(state.clone(), "GET", "/api/catalog", None, false).await;
        let property = catalogue["properties"][0].clone();
        for (field, value) in [
            ("name", " "),
            ("city", "Unknown city"),
            ("image", "javascript:alert(1)"),
            ("constructionStatus", "complete-ish"),
        ] {
            let mut invalid = property.clone();
            invalid[field] = json!(value);
            assert_eq!(
                call(
                    state.clone(),
                    "POST",
                    "/api/admin/properties",
                    Some(invalid),
                    true
                )
                .await
                .0,
                StatusCode::BAD_REQUEST
            );
        }
        assert_eq!(
            call(state.clone(), "GET", "/api/admin/properties", None, false)
                .await
                .0,
            StatusCode::UNAUTHORIZED
        );
        assert_eq!(
            call(state, "GET", "/api/health", None, false).await.1["runtime"],
            "rust"
        );
        std::fs::remove_dir_all(path).unwrap();
    }
    #[tokio::test]
    async fn image_upload_checks_auth_and_file_type() {
        let (state, path) = setup();
        let response = app(state.clone())
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/admin/images")
                    .header("content-type", "image/png")
                    .body(Body::from("not an image"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        let response = app(state.clone())
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/admin/images")
                    .header("content-type", "image/svg+xml")
                    .header("authorization", format!("Bearer {}", state.key))
                    .body(Body::from("<svg/>"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let response = app(state.clone())
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/admin/images")
                    .header("content-type", "image/webp")
                    .header("authorization", format!("Bearer {}", state.key))
                    .body(Body::from(
                        include_bytes!("../../public/assets/evara.webp").as_slice(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::CREATED);
        let upload: Value =
            serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes())
                .unwrap();
        let name = upload["image"]
            .as_str()
            .unwrap()
            .strip_prefix("/uploads/")
            .unwrap();
        assert!(state.uploads.join(name).is_file());
        std::fs::remove_dir_all(path).unwrap();
    }
}
