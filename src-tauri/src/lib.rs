#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct User {
    id: String,
    name: String,
    email: String,
    role: String,
    status: String,
    created_at: String,
    avatar: Option<String>,
}

#[tauri::command]
fn get_users() -> Vec<User> {
    vec![
        User { id: "1".into(), name: "Carlos Mendoza".into(), email: "carlos@mindbody.com".into(), role: "admin".into(), status: "active".into(), created_at: "2024-01-15".into(), avatar: Some("CM".into()) },
        User { id: "2".into(), name: "Ana García".into(), email: "ana@mindbody.com".into(), role: "manager".into(), status: "active".into(), created_at: "2024-02-20".into(), avatar: Some("AG".into()) },
        User { id: "3".into(), name: "Luis Rodríguez".into(), email: "luis@mindbody.com".into(), role: "staff".into(), status: "active".into(), created_at: "2024-03-10".into(), avatar: Some("LR".into()) },
        User { id: "4".into(), name: "María Torres".into(), email: "maria@mindbody.com".into(), role: "staff".into(), status: "inactive".into(), created_at: "2024-01-25".into(), avatar: Some("MT".into()) },
        User { id: "5".into(), name: "Pedro Sánchez".into(), email: "pedro@mindbody.com".into(), role: "manager".into(), status: "pending".into(), created_at: "2024-04-01".into(), avatar: Some("PS".into()) },
        User { id: "6".into(), name: "Laura Díaz".into(), email: "laura@mindbody.com".into(), role: "staff".into(), status: "active".into(), created_at: "2024-03-15".into(), avatar: Some("LD".into()) },
        User { id: "7".into(), name: "Roberto Vega".into(), email: "roberto@mindbody.com".into(), role: "staff".into(), status: "active".into(), created_at: "2024-02-28".into(), avatar: Some("RV".into()) },
        User { id: "8".into(), name: "Carmen López".into(), email: "carmen@mindbody.com".into(), role: "admin".into(), status: "active".into(), created_at: "2024-01-05".into(), avatar: Some("CL".into()) },
    ]
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_users])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
