// Provider configuration
export interface ProviderConfig {
  name: string;
  kind: string;
  api_key: string;
  base_url: string;
  models: string[];
  enabled: boolean;
}

// MCP Server configuration
export interface McpServerConfig {
  name: string;
  command: string;
  args: string[];
  enabled: boolean;
}

// Hook configuration
export interface HookConfig {
  event: string;
  command: string;
  enabled: boolean;
}

// Application configuration
export interface AppConfig {
  providers: ProviderConfig[];
  current_provider: string;
  current_model: string;
  sandbox_enabled: boolean;
  sandbox_type: string;
  auto_approve: boolean;
  theme: string;
  locale: string;
  max_turns: number;
  mcp_servers: McpServerConfig[];
  hooks: HookConfig[];
  skills_dir: string;
  workspace: string;
}

// Chat message
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  tool_calls?: ToolCall[];
  tool_result?: ToolResult;
  thinking?: string;
  is_streaming?: boolean;
}

// Tool call from LLM
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "error" | "approved" | "denied";
  output?: string;
  error?: string;
  duration_ms?: number;
}

// Tool result
export interface ToolResult {
  tool_call_id: string;
  content: string;
  is_error: boolean;
}

// Thread (conversation)
export interface Thread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  model: string;
  provider: string;
  status: "active" | "completed" | "archived";
}

// Task
export interface Task {
  id: string;
  prompt: string;
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  created_at: string;
  updated_at: string;
  checklist?: ChecklistItem[];
  artifacts?: string[];
}

// Checklist item
export interface ChecklistItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
}

// Tool definition
export interface ToolDef {
  name: string;
  category: string;
  description: string;
  parameters?: Record<string, unknown>;
}

// Skill
export interface Skill {
  name: string;
  description: string;
  path: string;
  enabled: boolean;
  category?: string;
}

// Snapshot
export interface Snapshot {
  id: string;
  thread_id: string;
  turn_id: string;
  created_at: string;
  description: string;
}

// Usage statistics
export interface UsageStats {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_cost: number;
  cache_hit_tokens: number;
  cache_miss_tokens: number;
}

// Approval request
export interface ApprovalRequest {
  id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  thread_id: string;
  turn_id: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
}

// Fleet run
export interface FleetRun {
  id: string;
  prompt: string;
  status: string;
  workers: FleetWorker[];
  created_at: string;
}

// Fleet worker
export interface FleetWorker {
  id: string;
  name: string;
  status: string;
  model: string;
  task: string;
}

// Automation
export interface Automation {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
}

// Navigation item
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
}

// SSE event from runtime API
export interface RuntimeEvent {
  type: string;
  data: Record<string, unknown>;
  seq?: number;
}
