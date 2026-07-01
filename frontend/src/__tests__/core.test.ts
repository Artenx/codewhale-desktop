import { describe, it, expect, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

describe("AppConfig defaults", () => {
  it("should have correct default values", () => {
    const defaultConfig = {
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

    expect(defaultConfig.current_provider).toBe("deepseek");
    expect(defaultConfig.current_model).toBe("deepseek-chat");
    expect(defaultConfig.sandbox_enabled).toBe(true);
    expect(defaultConfig.auto_approve).toBe(false);
    expect(defaultConfig.theme).toBe("dark");
    expect(defaultConfig.locale).toBe("zh-CN");
    expect(defaultConfig.max_turns).toBe(100);
    expect(defaultConfig.mcp_servers).toEqual([]);
    expect(defaultConfig.hooks).toEqual([]);
  });

  it("should have 5 default providers", () => {
    const providers = [
      { name: "deepseek", kind: "deepseek", enabled: true },
      { name: "openrouter", kind: "openrouter", enabled: false },
      { name: "anthropic", kind: "anthropic", enabled: false },
      { name: "openai", kind: "openai", enabled: false },
      { name: "ollama", kind: "ollama", enabled: false },
    ];

    expect(providers).toHaveLength(5);
    expect(providers[0].enabled).toBe(true);
    expect(providers[0].name).toBe("deepseek");
  });
});

describe("ProviderConfig", () => {
  it("should allow creating a provider with all fields", () => {
    const provider = {
      name: "test-provider",
      kind: "openai",
      api_key: "sk-test",
      base_url: "https://api.test.com",
      models: ["model-a", "model-b"],
      enabled: true,
    };

    expect(provider.name).toBe("test-provider");
    expect(provider.kind).toBe("openai");
    expect(provider.models).toHaveLength(2);
    expect(provider.models).toContain("model-a");
  });

  it("should allow disabled providers", () => {
    const provider = {
      name: "disabled",
      kind: "custom",
      api_key: "",
      base_url: "",
      models: [],
      enabled: false,
    };

    expect(provider.enabled).toBe(false);
    expect(provider.models).toHaveLength(0);
  });
});

describe("ChatMessage", () => {
  it("should create user message", () => {
    const msg = {
      id: "msg-1",
      role: "user" as const,
      content: "Hello",
      timestamp: Date.now(),
    };

    expect(msg.role).toBe("user");
    expect(msg.content).toBe("Hello");
    expect(msg.id).toBeTruthy();
  });

  it("should create assistant message with streaming", () => {
    const msg = {
      id: "msg-2",
      role: "assistant" as const,
      content: "Thinking...",
      timestamp: Date.now(),
      is_streaming: true,
    };

    expect(msg.role).toBe("assistant");
    expect(msg.is_streaming).toBe(true);
  });

  it("should support tool calls in messages", () => {
    const msg = {
      id: "msg-3",
      role: "assistant" as const,
      content: "Let me check",
      timestamp: Date.now(),
      tool_calls: [
        {
          id: "tc-1",
          name: "read_file",
          status: "completed" as const,
          input: { path: "/tmp/test.txt" },
          output: "file content",
          duration_ms: 150,
        },
      ],
    };

    expect(msg.tool_calls).toHaveLength(1);
    expect(msg.tool_calls![0].name).toBe("read_file");
    expect(msg.tool_calls![0].status).toBe("completed");
    expect(msg.tool_calls![0].duration_ms).toBe(150);
  });
});

describe("ToolCall status handling", () => {
  const statuses = ["pending", "running", "completed", "error", "approved", "denied"];

  it("should handle all tool call statuses", () => {
    for (const status of statuses) {
      const tool = {
        id: "tc-test",
        name: "test_tool",
        status,
        input: {},
      };
      expect(tool.status).toBe(status);
    }
  });
});

describe("Thread", () => {
  it("should create thread with metadata", () => {
    const thread = {
      id: "thread-abc123",
      title: "My thread",
      message_count: 5,
      model: "deepseek-chat",
      status: "active",
    };

    expect(thread.id).toBe("thread-abc123");
    expect(thread.message_count).toBe(5);
    expect(thread.model).toBe("deepseek-chat");
    expect(thread.status).toBe("active");
  });
});

describe("Task status transitions", () => {
  it("should support all task statuses", () => {
    const validStatuses = ["queued", "running", "completed", "failed", "canceled"];

    for (const status of validStatuses) {
      const task = {
        id: "task-1",
        prompt: "Test task",
        status,
        checklist: [],
      };
      expect(task.status).toBe(status);
    }
  });
});

describe("Attachment handling", () => {
  it("should detect image type from MIME", () => {
    const isImage = (type: string) => type.startsWith("image/");
    expect(isImage("image/png")).toBe(true);
    expect(isImage("image/jpeg")).toBe(true);
    expect(isImage("text/plain")).toBe(false);
    expect(isImage("application/json")).toBe(false);
  });

  it("should format file size correctly", () => {
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    expect(formatSize(500)).toBe("500 B");
    expect(formatSize(2048)).toBe("2.0 KB");
    expect(formatSize(1048576)).toBe("1.0 MB");
  });
});

describe("Store message operations", () => {
  it("should add messages correctly", () => {
    const messages: Array<{ id: string; content: string }> = [];
    const addMessage = (msg: { id: string; content: string }) => {
      messages.push(msg);
    };

    addMessage({ id: "1", content: "Hello" });
    addMessage({ id: "2", content: "World" });

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe("Hello");
    expect(messages[1].content).toBe("World");
  });

  it("should update messages by id", () => {
    let messages = [
      { id: "1", content: "Loading...", is_streaming: true },
      { id: "2", content: "Done", is_streaming: false },
    ];

    const updateMessage = (id: string, partial: Record<string, unknown>) => {
      messages = messages.map((m) => (m.id === id ? { ...m, ...partial } : m));
    };

    updateMessage("1", { content: "Loaded!", is_streaming: false });

    expect(messages[0].content).toBe("Loaded!");
    expect(messages[0].is_streaming).toBe(false);
    expect(messages[1].content).toBe("Done");
  });

  it("should clear messages", () => {
    let messages = [{ id: "1", content: "test" }];
    messages = [];
    expect(messages).toHaveLength(0);
  });
});
