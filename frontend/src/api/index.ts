import { invoke } from "@tauri-apps/api/core";
import type { AppConfig, ProviderConfig, McpServerConfig, HookConfig, ToolDef } from "../types";

// ============ Config (Tauri IPC) ============

export async function getConfig(): Promise<AppConfig> {
  return invoke("get_config");
}

export async function saveConfig(config: AppConfig): Promise<void> {
  return invoke("save_config", { config });
}

export async function updateProvider(provider: ProviderConfig): Promise<void> {
  return invoke("update_provider", { provider });
}

export async function setCurrentModel(provider: string, model: string): Promise<void> {
  return invoke("set_current_model", { provider, model });
}

export async function addMcpServer(server: McpServerConfig): Promise<void> {
  return invoke("add_mcp_server", { server });
}

export async function removeMcpServer(name: string): Promise<void> {
  return invoke("remove_mcp_server", { name });
}

export async function addHook(hook: HookConfig): Promise<void> {
  return invoke("add_hook", { hook });
}

export async function removeHook(index: number): Promise<void> {
  return invoke("remove_hook", { index });
}

export async function startEngine(): Promise<void> {
  return invoke("start_engine");
}

export async function stopEngine(): Promise<void> {
  return invoke("stop_engine");
}

export async function sendMessage(message: string, threadId?: string): Promise<string> {
  return invoke("send_message", { message, threadId });
}

export async function execTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  return invoke("exec_tool", { toolName, args });
}

export async function listTools(): Promise<ToolDef[]> {
  return invoke("list_tools");
}

// ============ Runtime API (HTTP/SSE) ============
// Complete coverage of ALL 59 codewhale Runtime API endpoints

const API_BASE = "http://127.0.0.1:18789";

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API ${resp.status}: ${text}`);
  }
  return resp;
}

export const runtimeApi = {
  // ================================================================
  // PUBLIC ENDPOINTS (no auth required)
  // ================================================================

  /** GET /health — Health check */
  async health(): Promise<{ status: string; version: string }> {
    const resp = await fetch(`${API_BASE}/health`);
    return resp.json();
  },

  /** GET /v1/runtime/info — Runtime info (version, capabilities, config) */
  async runtimeInfo(): Promise<Record<string, unknown>> {
    const resp = await fetch(`${API_BASE}/v1/runtime/info`);
    return resp.json();
  },

  // ================================================================
  // SESSIONS
  // ================================================================

  /** GET /v1/sessions — List all saved sessions */
  async listSessions() {
    const resp = await apiFetch("/v1/sessions");
    return resp.json();
  },

  /** POST /v1/sessions — Create session from existing thread */
  async createSessionFromThread(data: { thread_id: string; title?: string }) {
    const resp = await apiFetch("/v1/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  /** PUT /v1/sessions — Save current active session */
  async saveCurrentSession(data?: { title?: string }) {
    const resp = await apiFetch("/v1/sessions", {
      method: "PUT",
      body: JSON.stringify(data || {}),
    });
    return resp.json();
  },

  /** GET /v1/sessions/{id} — Get session detail */
  async getSession(id: string) {
    const resp = await apiFetch(`/v1/sessions/${id}`);
    return resp.json();
  },

  /** DELETE /v1/sessions/{id} — Delete session */
  async deleteSession(id: string) {
    const resp = await apiFetch(`/v1/sessions/${id}`, { method: "DELETE" });
    return resp.json();
  },

  /** POST /v1/sessions/{id}/resume-thread — Resume a session's thread */
  async resumeSessionThread(id: string) {
    const resp = await apiFetch(`/v1/sessions/${id}/resume-thread`, { method: "POST" });
    return resp.json();
  },

  // ================================================================
  // WORKSPACE
  // ================================================================

  /** GET /v1/workspace/status — Current workspace git/status info */
  async workspaceStatus() {
    const resp = await apiFetch("/v1/workspace/status");
    return resp.json();
  },

  // ================================================================
  // AGENT RUNS
  // ================================================================

  /** GET /v1/agent-runs — List all agent runs */
  async listAgentRuns() {
    const resp = await apiFetch("/v1/agent-runs");
    return resp.json();
  },

  /** GET /v1/agent-runs/{run_id} — Get specific agent run detail */
  async getAgentRun(runId: string) {
    const resp = await apiFetch(`/v1/agent-runs/${runId}`);
    return resp.json();
  },

  // ================================================================
  // FLEET (multi-agent orchestration)
  // ================================================================

  /** GET /v1/fleet/runs — List all fleet runs */
  async listFleetRuns() {
    const resp = await apiFetch("/v1/fleet/runs");
    return resp.json();
  },

  /** GET /v1/fleet/runs/{run_id} — Get fleet run detail */
  async getFleetRun(runId: string) {
    const resp = await apiFetch(`/v1/fleet/runs/${runId}`);
    return resp.json();
  },

  /** GET /v1/fleet/runs/{run_id}/workers — List workers in a fleet run */
  async listFleetRunWorkers(runId: string) {
    const resp = await apiFetch(`/v1/fleet/runs/${runId}/workers`);
    return resp.json();
  },

  /** POST /v1/fleet/runs/{run_id}/stop — Stop a fleet run */
  async stopFleetRun(runId: string) {
    const resp = await apiFetch(`/v1/fleet/runs/${runId}/stop`, { method: "POST" });
    return resp.json();
  },

  /** GET /v1/fleet/workers/{worker_id} — Get fleet worker detail */
  async getFleetWorker(workerId: string) {
    const resp = await apiFetch(`/v1/fleet/workers/${workerId}`);
    return resp.json();
  },

  /** POST /v1/fleet/workers/{worker_id}/interrupt — Interrupt a fleet worker */
  async interruptFleetWorker(workerId: string) {
    const resp = await apiFetch(`/v1/fleet/workers/${workerId}/interrupt`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/fleet/workers/{worker_id}/restart — Restart a fleet worker */
  async restartFleetWorker(workerId: string) {
    const resp = await apiFetch(`/v1/fleet/workers/${workerId}/restart`, { method: "POST" });
    return resp.json();
  },

  // ================================================================
  // STREAMING
  // ================================================================

  /** POST /v1/stream — Stream a single turn (SSE response) */
  streamTurn(data: Record<string, unknown>, onChunk: (chunk: string) => void, onDone: () => void, onError: (err: string) => void): () => void {
    const controller = new AbortController();
    fetch(`${API_BASE}/v1/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    })
      .then(async (resp) => {
        if (!resp.ok) { onError(await resp.text()); return; }
        const reader = resp.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          onChunk(decoder.decode(value, { stream: true }));
        }
        onDone();
      })
      .catch((err) => onError(err.message));
    return () => controller.abort();
  },

  // ================================================================
  // THREADS
  // ================================================================

  /** GET /v1/threads — List all threads */
  async listThreads() {
    const resp = await apiFetch("/v1/threads");
    return resp.json();
  },

  /** POST /v1/threads — Create new thread */
  async createThread(data?: Record<string, unknown>) {
    const resp = await apiFetch("/v1/threads", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
    return resp.json();
  },

  /** GET /v1/threads/summary — List threads summary (lightweight) */
  async listThreadsSummary(params?: { limit?: number; include_archived?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.include_archived !== undefined) qs.set("include_archived", String(params.include_archived));
    const resp = await apiFetch(`/v1/threads/summary${qs.toString() ? "?" + qs : ""}`);
    return resp.json();
  },

  /** GET /v1/threads/{id} — Get thread detail with messages */
  async getThread(id: string) {
    const resp = await apiFetch(`/v1/threads/${id}`);
    return resp.json();
  },

  /** PATCH /v1/threads/{id} — Update thread metadata */
  async updateThread(id: string, data: Record<string, unknown>) {
    const resp = await apiFetch(`/v1/threads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  /** POST /v1/threads/{id}/resume — Resume a paused thread */
  async resumeThread(id: string) {
    const resp = await apiFetch(`/v1/threads/${id}/resume`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/threads/{id}/fork — Fork thread (branch conversation) */
  async forkThread(id: string) {
    const resp = await apiFetch(`/v1/threads/${id}/fork`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/threads/{id}/undo — Undo last turn */
  async undoThreadTurn(id: string) {
    const resp = await apiFetch(`/v1/threads/${id}/undo`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/threads/{id}/patch-undo — Patch-level undo (surgical) */
  async patchUndoThreadTurn(id: string) {
    const resp = await apiFetch(`/v1/threads/${id}/patch-undo`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/threads/{id}/retry — Retry last turn */
  async retryThreadTurn(id: string) {
    const resp = await apiFetch(`/v1/threads/${id}/retry`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/threads/{id}/turns — Start a new turn */
  async startThreadTurn(id: string, data: Record<string, unknown>) {
    const resp = await apiFetch(`/v1/threads/${id}/turns`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  /** POST /v1/threads/{id}/turns/{turn_id}/steer — Steer (redirect) a running turn */
  async steerThreadTurn(id: string, turnId: string, data: { message: string }) {
    const resp = await apiFetch(`/v1/threads/${id}/turns/${turnId}/steer`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  /** POST /v1/threads/{id}/turns/{turn_id}/interrupt — Interrupt a running turn */
  async interruptThreadTurn(id: string, turnId: string) {
    const resp = await apiFetch(`/v1/threads/${id}/turns/${turnId}/interrupt`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/threads/{id}/turns/{turn_id}/tool-calls/{call_id}/result — Deliver dynamic tool result */
  async deliverDynamicToolResult(id: string, turnId: string, callId: string, data: { result: unknown }) {
    const resp = await apiFetch(`/v1/threads/${id}/turns/${turnId}/tool-calls/${callId}/result`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  /** POST /v1/threads/{id}/compact — Compact thread context */
  async compactThread(id: string) {
    const resp = await apiFetch(`/v1/threads/${id}/compact`, { method: "POST" });
    return resp.json();
  },

  /** GET /v1/threads/{id}/events — SSE stream of thread events */
  streamThreadEvents(threadId: string, onEvent: (event: unknown) => void): EventSource {
    const es = new EventSource(`${API_BASE}/v1/threads/${threadId}/events`);
    es.onmessage = (msg) => {
      try { onEvent(JSON.parse(msg.data)); } catch { onEvent(msg.data); }
    };
    return es;
  },

  // ================================================================
  // APPROVALS
  // ================================================================

  /** POST /v1/approvals/{approval_id} — Decide approval (approve/deny) */
  async decideApproval(approvalId: string, decision: "approved" | "denied") {
    const resp = await apiFetch(`/v1/approvals/${approvalId}`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
    return resp.json();
  },

  // ================================================================
  // USER INPUT
  // ================================================================

  /** POST /v1/user-input/{thread_id}/{input_id} — Submit user input response */
  async submitUserInput(threadId: string, inputId: string, data: { value: unknown }) {
    const resp = await apiFetch(`/v1/user-input/${threadId}/${inputId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  // ================================================================
  // TASKS
  // ================================================================

  /** GET /v1/tasks — List all tasks */
  async listTasks() {
    const resp = await apiFetch("/v1/tasks");
    return resp.json();
  },

  /** POST /v1/tasks — Create new task */
  async createTask(data: Record<string, unknown>) {
    const resp = await apiFetch("/v1/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  /** GET /v1/tasks/{id} — Get task detail (timeline, checklist, artifacts) */
  async getTask(id: string) {
    const resp = await apiFetch(`/v1/tasks/${id}`);
    return resp.json();
  },

  /** POST /v1/tasks/{id}/cancel — Cancel task */
  async cancelTask(id: string) {
    const resp = await apiFetch(`/v1/tasks/${id}/cancel`, { method: "POST" });
    return resp.json();
  },

  // ================================================================
  // SKILLS
  // ================================================================

  /** GET /v1/skills — List all available skills */
  async listSkills() {
    const resp = await apiFetch("/v1/skills");
    return resp.json();
  },

  /** POST /v1/skills/{name} — Enable/disable a skill */
  async setSkillEnabled(name: string, enabled: boolean) {
    const resp = await apiFetch(`/v1/skills/${name}`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    return resp.json();
  },

  // ================================================================
  // MCP (Model Context Protocol)
  // ================================================================

  /** GET /v1/apps/mcp/servers — List MCP servers */
  async listMcpServers() {
    const resp = await apiFetch("/v1/apps/mcp/servers");
    return resp.json();
  },

  /** GET /v1/apps/mcp/tools — List MCP tools */
  async listMcpTools() {
    const resp = await apiFetch("/v1/apps/mcp/tools");
    return resp.json();
  },

  // ================================================================
  // AUTOMATIONS
  // ================================================================

  /** GET /v1/automations — List all automations */
  async listAutomations() {
    const resp = await apiFetch("/v1/automations");
    return resp.json();
  },

  /** POST /v1/automations — Create automation */
  async createAutomation(data: Record<string, unknown>) {
    const resp = await apiFetch("/v1/automations", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  /** GET /v1/automations/{id} — Get automation detail */
  async getAutomation(id: string) {
    const resp = await apiFetch(`/v1/automations/${id}`);
    return resp.json();
  },

  /** PATCH /v1/automations/{id} — Update automation */
  async updateAutomation(id: string, data: Record<string, unknown>) {
    const resp = await apiFetch(`/v1/automations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return resp.json();
  },

  /** DELETE /v1/automations/{id} — Delete automation */
  async deleteAutomation(id: string) {
    const resp = await apiFetch(`/v1/automations/${id}`, { method: "DELETE" });
    return resp.json();
  },

  /** POST /v1/automations/{id}/run — Trigger automation run now */
  async runAutomation(id: string) {
    const resp = await apiFetch(`/v1/automations/${id}/run`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/automations/{id}/pause — Pause automation */
  async pauseAutomation(id: string) {
    const resp = await apiFetch(`/v1/automations/${id}/pause`, { method: "POST" });
    return resp.json();
  },

  /** POST /v1/automations/{id}/resume — Resume automation */
  async resumeAutomation(id: string) {
    const resp = await apiFetch(`/v1/automations/${id}/resume`, { method: "POST" });
    return resp.json();
  },

  /** GET /v1/automations/{id}/runs — List automation run history */
  async listAutomationRuns(id: string) {
    const resp = await apiFetch(`/v1/automations/${id}/runs`);
    return resp.json();
  },

  // ================================================================
  // USAGE & ANALYTICS
  // ================================================================

  /** GET /v1/usage — Get token/cost usage statistics */
  async getUsage() {
    const resp = await apiFetch("/v1/usage");
    return resp.json();
  },

  // ================================================================
  // SNAPSHOTS (side-git workspace snapshots)
  // ================================================================

  /** GET /v1/snapshots — List all workspace snapshots */
  async listSnapshots() {
    const resp = await apiFetch("/v1/snapshots");
    return resp.json();
  },

  /** POST /v1/snapshots/{id}/restore — Restore workspace to snapshot */
  async restoreSnapshot(id: string) {
    const resp = await apiFetch(`/v1/snapshots/${id}/restore`, { method: "POST" });
    return resp.json();
  },
};
