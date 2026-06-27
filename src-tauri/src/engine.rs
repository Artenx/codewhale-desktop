//! CodeWhale engine bridge — connects to codewhale Runtime API or spawns codewhale process.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::mpsc;

use crate::AppConfig;

pub struct EngineHandle {
    process: Child,
    api_base: String,
    runtime_token: Option<String>,
    client: reqwest::Client,
}

impl EngineHandle {
    pub async fn start(config: &AppConfig) -> Result<Self> {
        let client = reqwest::Client::new();

        // Try to connect to an existing codewhale serve instance
        let api_base = "http://127.0.0.1:18789".to_string();
        if client.get(format!("{}/health", api_base)).send().await.is_ok() {
            return Ok(Self {
                process: spawn_noop_child(),
                api_base,
                runtime_token: None,
                client,
            });
        }

        // Otherwise spawn codewhale serve
        let workspace = shellexpand::tilde(&config.workspace).to_string();
        let mut cmd = Command::new("codewhale");
        cmd.arg("serve")
            .arg("--http")
            .arg("127.0.0.1:18789")
            .current_dir(&workspace)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .stdin(Stdio::null());

        // Set provider environment
        if let Some(provider) = config.providers.iter().find(|p| p.name == config.current_provider && p.enabled) {
            if !provider.api_key.is_empty() {
                let env_key = match provider.kind.as_str() {
                    "deepseek" => "DEEPSEEK_API_KEY",
                    "openai" => "OPENAI_API_KEY",
                    "anthropic" => "ANTHROPIC_API_KEY",
                    "openrouter" => "OPENROUTER_API_KEY",
                    _ => "API_KEY",
                };
                cmd.env(env_key, &provider.api_key);
            }
            if !provider.base_url.is_empty() {
                cmd.env("CODEWHALE_BASE_URL", &provider.base_url);
            }
        }

        let process = cmd.spawn().context("Failed to spawn codewhale serve")?;

        // Wait for server to be ready
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;

        Ok(Self {
            process,
            api_base,
            runtime_token: None,
            client,
        })
    }

    pub async fn send_message(&self, message: &str, thread_id: Option<&str>, config: &AppConfig) -> Result<String> {
        let url = if let Some(tid) = thread_id {
            format!("{}/v1/threads/{}/turns", self.api_base, tid)
        } else {
            format!("{}/v1/threads", self.api_base)
        };

        let body = json!({
            "message": message,
            "model": config.current_model,
            "provider": config.current_provider,
        });

        let mut req = self.client.post(&url).json(&body);
        if let Some(ref token) = self.runtime_token {
            req = req.bearer_auth(token);
        }

        let resp = req.send().await?.text().await?;
        Ok(resp)
    }

    pub async fn exec_tool(&self, tool_name: &str, args: Value) -> Result<Value> {
        let url = format!("{}/v1/tools/{}/execute", self.api_base, tool_name);
        let mut req = self.client.post(&url).json(&args);
        if let Some(ref token) = self.runtime_token {
            req = req.bearer_auth(token);
        }
        let resp = req.send().await?.json::<Value>().await?;
        Ok(resp)
    }
}

impl Drop for EngineHandle {
    fn drop(&mut self) {
        let _ = self.process.start_kill();
    }
}

fn spawn_noop_child() -> Child {
    Command::new("echo")
        .arg("noop")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap()
}

pub fn list_available_tools() -> Vec<Value> {
    vec![
        json!({"name": "read_file", "category": "file", "description": "读取文件内容"}),
        json!({"name": "write_file", "category": "file", "description": "写入文件内容"}),
        json!({"name": "edit_file", "category": "file", "description": "编辑文件（精确替换）"}),
        json!({"name": "apply_patch", "category": "file", "description": "应用 unified diff 补丁"}),
        json!({"name": "list_dir", "category": "file", "description": "列出目录内容"}),
        json!({"name": "file_search", "category": "file", "description": "按文件名搜索"}),
        json!({"name": "grep_files", "category": "file", "description": "正则搜索文件内容"}),
        json!({"name": "exec_shell", "category": "shell", "description": "执行 Shell 命令"}),
        json!({"name": "git_status", "category": "git", "description": "Git 状态"}),
        json!({"name": "git_diff", "category": "git", "description": "Git diff"}),
        json!({"name": "git_log", "category": "git", "description": "Git 日志"}),
        json!({"name": "git_show", "category": "git", "description": "Git show"}),
        json!({"name": "git_blame", "category": "git", "description": "Git blame"}),
        json!({"name": "web_search", "category": "web", "description": "网络搜索"}),
        json!({"name": "fetch_url", "category": "web", "description": "获取 URL 内容"}),
        json!({"name": "run_tests", "category": "test", "description": "运行测试"}),
        json!({"name": "run_verifiers", "category": "test", "description": "运行验证器"}),
        json!({"name": "agent", "category": "subagent", "description": "子 Agent 管理"}),
        json!({"name": "checklist_write", "category": "planning", "description": "写入检查清单"}),
        json!({"name": "update_plan", "category": "planning", "description": "更新计划"}),
        json!({"name": "task_create", "category": "task", "description": "创建持久任务"}),
        json!({"name": "task_list", "category": "task", "description": "列出任务"}),
        json!({"name": "task_read", "category": "task", "description": "读取任务详情"}),
        json!({"name": "rlm_open", "category": "rlm", "description": "打开 RLM 会话"}),
        json!({"name": "rlm_eval", "category": "rlm", "description": "在 RLM 中执行代码"}),
        json!({"name": "rlm_close", "category": "rlm", "description": "关闭 RLM 会话"}),
        json!({"name": "handle_read", "category": "rlm", "description": "读取 var_handle 数据"}),
        json!({"name": "load_skill", "category": "skill", "description": "加载技能"}),
        json!({"name": "tool_search", "category": "meta", "description": "搜索工具定义"}),
        json!({"name": "validate_data", "category": "data", "description": "验证 JSON/TOML"}),
        json!({"name": "request_user_input", "category": "ui", "description": "请求用户输入"}),
        json!({"name": "finance", "category": "finance", "description": "金融市场报价"}),
        json!({"name": "code_execution", "category": "sandbox", "description": "Python 沙箱执行"}),
    ]
}
