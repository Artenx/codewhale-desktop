#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use tauri::State;

mod engine;
use engine::EngineHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub providers: Vec<ProviderConfig>,
    pub current_provider: String,
    pub current_model: String,
    pub sandbox_enabled: bool,
    pub sandbox_type: String,
    pub auto_approve: bool,
    pub theme: String,
    pub locale: String,
    pub max_turns: u32,
    pub mcp_servers: Vec<McpServerConfig>,
    pub hooks: Vec<HookConfig>,
    pub skills_dir: String,
    pub workspace: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProviderConfig {
    pub name: String,
    pub kind: String,
    pub api_key: String,
    pub base_url: String,
    pub models: Vec<String>,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpServerConfig {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HookConfig {
    pub event: String,
    pub command: String,
    pub enabled: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            providers: vec![
                ProviderConfig {
                    name: "deepseek".into(), kind: "deepseek".into(),
                    api_key: String::new(), base_url: "https://api.deepseek.com".into(),
                    models: vec!["deepseek-chat".into(), "deepseek-reasoner".into()], enabled: true,
                },
                ProviderConfig {
                    name: "openrouter".into(), kind: "openrouter".into(),
                    api_key: String::new(), base_url: "https://openrouter.ai/api/v1".into(),
                    models: vec!["deepseek/deepseek-chat".into()], enabled: false,
                },
                ProviderConfig {
                    name: "anthropic".into(), kind: "anthropic".into(),
                    api_key: String::new(), base_url: "https://api.anthropic.com".into(),
                    models: vec!["claude-sonnet-4-20250514".into(), "claude-3-5-haiku-20241022".into()], enabled: false,
                },
                ProviderConfig {
                    name: "openai".into(), kind: "openai".into(),
                    api_key: String::new(), base_url: "https://api.openai.com/v1".into(),
                    models: vec!["gpt-4o".into(), "gpt-4o-mini".into()], enabled: false,
                },
                ProviderConfig {
                    name: "ollama".into(), kind: "ollama".into(),
                    api_key: String::new(), base_url: "http://localhost:11434".into(),
                    models: vec!["qwen2.5-coder:7b".into()], enabled: false,
                },
            ],
            current_provider: "deepseek".into(), current_model: "deepseek-chat".into(),
            sandbox_enabled: true, sandbox_type: "auto".into(), auto_approve: false,
            theme: "dark".into(), locale: "zh-CN".into(), max_turns: 100,
            mcp_servers: vec![], hooks: vec![],
            skills_dir: "~/.codewhale/skills".into(), workspace: ".".into(),
        }
    }
}

struct AppState {
    config: Mutex<AppConfig>,
    engine: Mutex<Option<EngineHandle>>,
}

#[tauri::command]
async fn get_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    Ok(state.config.lock().await.clone())
}

#[tauri::command]
async fn save_config(state: State<'_, AppState>, config: AppConfig) -> Result<(), String> {
    *state.config.lock().await = config;
    Ok(())
}

#[tauri::command]
async fn update_provider(state: State<'_, AppState>, provider: ProviderConfig) -> Result<(), String> {
    let mut config = state.config.lock().await;
    if let Some(p) = config.providers.iter_mut().find(|p| p.name == provider.name) {
        *p = provider;
    } else {
        config.providers.push(provider);
    }
    Ok(())
}

#[tauri::command]
async fn set_current_model(state: State<'_, AppState>, provider: String, model: String) -> Result<(), String> {
    let mut config = state.config.lock().await;
    config.current_provider = provider;
    config.current_model = model;
    Ok(())
}

#[tauri::command]
async fn add_mcp_server(state: State<'_, AppState>, server: McpServerConfig) -> Result<(), String> {
    state.config.lock().await.mcp_servers.push(server);
    Ok(())
}

#[tauri::command]
async fn remove_mcp_server(state: State<'_, AppState>, name: String) -> Result<(), String> {
    state.config.lock().await.mcp_servers.retain(|s| s.name != name);
    Ok(())
}

#[tauri::command]
async fn add_hook(state: State<'_, AppState>, hook: HookConfig) -> Result<(), String> {
    state.config.lock().await.hooks.push(hook);
    Ok(())
}

#[tauri::command]
async fn remove_hook(state: State<'_, AppState>, index: usize) -> Result<(), String> {
    let mut config = state.config.lock().await;
    if index < config.hooks.len() {
        config.hooks.remove(index);
    }
    Ok(())
}

#[tauri::command]
async fn send_message(
    state: State<'_, AppState>,
    message: String,
    thread_id: Option<String>,
) -> Result<String, String> {
    let config = state.config.lock().await.clone();
    let engine_guard = state.engine.lock().await;
    if let Some(ref eng) = *engine_guard {
        eng.send_message(&message, thread_id.as_deref(), &config).await
            .map_err(|e| e.to_string())
    } else {
        Err("引擎未初始化".into())
    }
}

#[tauri::command]
async fn start_engine(state: State<'_, AppState>) -> Result<(), String> {
    let config = state.config.lock().await.clone();
    let mut engine = state.engine.lock().await;
    if engine.is_none() {
        let handle = EngineHandle::start(&config).await.map_err(|e| e.to_string())?;
        *engine = Some(handle);
    }
    Ok(())
}

#[tauri::command]
async fn stop_engine(state: State<'_, AppState>) -> Result<(), String> {
    *state.engine.lock().await = None;
    Ok(())
}

#[tauri::command]
async fn exec_tool(
    state: State<'_, AppState>,
    tool_name: String,
    args: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let engine_guard = state.engine.lock().await;
    if let Some(ref eng) = *engine_guard {
        eng.exec_tool(&tool_name, args).await.map_err(|e| e.to_string())
    } else {
        Err("引擎未初始化".into())
    }
}

#[tauri::command]
fn list_tools() -> Vec<serde_json::Value> {
    engine::list_available_tools()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            config: Mutex::new(AppConfig::default()),
            engine: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            get_config, save_config, update_provider, set_current_model,
            add_mcp_server, remove_mcp_server, add_hook, remove_hook,
            send_message, start_engine, stop_engine, exec_tool, list_tools,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run CodeWhale Desktop");
}
