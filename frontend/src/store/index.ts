import { create } from "zustand";
import type {
  AppConfig,
  ChatMessage,
  Thread,
  Task,
  ToolDef,
  Skill,
  ApprovalRequest,
  UsageStats,
} from "../types";

interface AppState {
  // Configuration
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  updateConfig: (partial: Partial<AppConfig>) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, partial: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;

  // Threads
  threads: Thread[];
  setThreads: (threads: Thread[]) => void;
  currentThreadId: string | null;
  setCurrentThreadId: (id: string | null) => void;

  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;

  // Tools
  tools: ToolDef[];
  setTools: (tools: ToolDef[]) => void;

  // Skills
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;

  // Approvals
  pendingApprovals: ApprovalRequest[];
  addApproval: (a: ApprovalRequest) => void;
  removeApproval: (id: string) => void;

  // Usage
  usage: UsageStats | null;
  setUsage: (u: UsageStats) => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  engineRunning: boolean;
  setEngineRunning: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

const defaultConfig: AppConfig = {
  providers: [
    {
      name: "deepseek",
      kind: "deepseek",
      api_key: "",
      base_url: "https://api.deepseek.com",
      models: ["deepseek-chat", "deepseek-reasoner"],
      enabled: true,
    },
    {
      name: "openrouter",
      kind: "openrouter",
      api_key: "",
      base_url: "https://openrouter.ai/api/v1",
      models: ["deepseek/deepseek-chat"],
      enabled: false,
    },
    {
      name: "anthropic",
      kind: "anthropic",
      api_key: "",
      base_url: "https://api.anthropic.com",
      models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
      enabled: false,
    },
    {
      name: "openai",
      kind: "openai",
      api_key: "",
      base_url: "https://api.openai.com/v1",
      models: ["gpt-4o", "gpt-4o-mini"],
      enabled: false,
    },
    {
      name: "ollama",
      kind: "ollama",
      api_key: "",
      base_url: "http://localhost:11434",
      models: ["qwen2.5-coder:7b"],
      enabled: false,
    },
  ],
  current_provider: "deepseek",
  current_model: "deepseek-chat",
  sandbox_enabled: true,
  sandbox_type: "auto",
  auto_approve: false,
  theme: "dark",
  locale: "zh-CN",
  max_turns: 100,
  mcp_servers: [],
  hooks: [],
  skills_dir: "~/.codewhale/skills",
  workspace: ".",
};

export const useAppStore = create<AppState>((set) => ({
  config: defaultConfig,
  setConfig: (config) => set({ config }),
  updateConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),

  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, partial) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    })),
  clearMessages: () => set({ messages: [] }),
  isStreaming: false,
  setIsStreaming: (v) => set({ isStreaming: v }),

  threads: [],
  setThreads: (threads) => set({ threads }),
  currentThreadId: null,
  setCurrentThreadId: (id) => set({ currentThreadId: id }),

  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  tools: [],
  setTools: (tools) => set({ tools }),

  skills: [],
  setSkills: (skills) => set({ skills }),

  pendingApprovals: [],
  addApproval: (a) =>
    set((s) => ({ pendingApprovals: [...s.pendingApprovals, a] })),
  removeApproval: (id) =>
    set((s) => ({
      pendingApprovals: s.pendingApprovals.filter((a) => a.id !== id),
    })),

  usage: null,
  setUsage: (u) => set({ usage: u }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  currentPage: "chat",
  setCurrentPage: (page) => set({ currentPage: page }),
  engineRunning: false,
  setEngineRunning: (v) => set({ engineRunning: v }),
  error: null,
  setError: (e) => set({ error: e }),
}));
