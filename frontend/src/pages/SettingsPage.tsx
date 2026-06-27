import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Server, Puzzle, Cpu, GitBranch, Shield, Settings, Package,
  Plus, Trash2, Save, Eye, EyeOff, Check, X, ChevronRight,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { useAppStore } from "../store";
import { saveConfig, updateProvider, addMcpServer, removeMcpServer, addHook, removeHook, setCurrentModel } from "../api";
import type { ProviderConfig, McpServerConfig, HookConfig } from "../types";
import clsx from "clsx";

const tabs = [
  { id: "providers", label: "Models", icon: Server, desc: "Provider & model routing" },
  { id: "mcp", label: "MCP", icon: Puzzle, desc: "Model Context Protocol servers" },
  { id: "skills", label: "Skills", icon: Cpu, desc: "Reusable workflow templates" },
  { id: "plugins", label: "Plugins", icon: Package, desc: "Extensions & integrations" },
  { id: "hooks", label: "Hooks", icon: GitBranch, desc: "Pre/post tool execution" },
  { id: "sandbox", label: "Sandbox", icon: Shield, desc: "OS-level isolation" },
  { id: "general", label: "General", icon: Settings, desc: "Workspace, locale, theme" },
];

/* ═══════════════════════════════════════════════════════════════
   Section wrapper (Codex style)
   ═══════════════════════════════════════════════════════════════ */
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-ink-800 mb-0.5">{title}</h3>
      {desc && <p className="text-xs text-ink-500 font-mono mb-3">{desc}</p>}
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="text-xs text-ink-600 font-mono mb-1 block">{label}</label>
      {children}
      {hint && <p className="text-2xs text-ink-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-2 group">
      {value ? <ToggleRight className="w-5 h-5 text-ok" /> : <ToggleLeft className="w-5 h-5 text-ink-500" />}
      <span className="text-xs text-ink-700 group-hover:text-ink-900 transition-colors">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Models / Providers
   ═══════════════════════════════════════════════════════════════ */
function ProvidersTab() {
  const { config, updateConfig } = useAppStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<ProviderConfig>>({ kind: "openai" });

  const select = async (provider: string, model: string) => {
    await setCurrentModel(provider, model);
    updateConfig({ current_provider: provider, current_model: model });
  };

  const save = async (p: ProviderConfig) => {
    await updateProvider(p);
    setEditing(null);
  };

  const addProvider = async () => {
    if (!form.name || !form.kind) return;
    const p: ProviderConfig = {
      name: form.name, kind: form.kind, api_key: form.api_key || "",
      base_url: form.base_url || "", models: form.models || [], enabled: true,
    };
    await updateProvider(p);
    updateConfig({ providers: [...config.providers, p] });
    setAdding(false);
    setForm({ kind: "openai" });
  };

  return (
    <>
      {/* Active model selector */}
      <Section title="Active Model" desc="Select the provider and model for new conversations">
        <div className="flex gap-2">
          <select value={config.current_provider}
            onChange={(e) => {
              const p = config.providers.find((x) => x.name === e.target.value);
              if (p?.models[0]) select(p.name, p.models[0]);
            }}
            className="cx-input w-44">
            {config.providers.filter((p) => p.enabled).map((p) =>
              <option key={p.name} value={p.name}>{p.name}</option>
            )}
          </select>
          <select value={config.current_model}
            onChange={(e) => select(config.current_provider, e.target.value)}
            className="cx-input flex-1">
            {config.providers.find((p) => p.name === config.current_provider)?.models.map((m) =>
              <option key={m} value={m}>{m}</option>
            )}
          </select>
        </div>
      </Section>

      {/* Add provider */}
      <Section title="Providers" desc="Configure API keys and endpoints">
        {adding && (
          <div className="cx-card p-4 mb-3 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <Field label="name"><input className="cx-input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="my-provider" /></Field>
              <Field label="type">
                <select className="cx-input" value={form.kind || "openai"} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                  {["deepseek","openai","anthropic","openrouter","ollama","vllm","sglang","custom"].map((k) =>
                    <option key={k} value={k}>{k}</option>
                  )}
                </select>
              </Field>
              <Field label="api key"><input className="cx-input" type="password" value={form.api_key || ""} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="sk-..." /></Field>
              <Field label="base url"><input className="cx-input" value={form.base_url || ""} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.example.com/v1" /></Field>
              <div className="col-span-2">
                <Field label="models (comma-separated)">
                  <input className="cx-input" value={form.models?.join(", ") || ""} onChange={(e) => setForm({ ...form, models: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="model-a, model-b" />
                </Field>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={addProvider} className="cx-btn-primary text-xs"><Check className="w-3 h-3 inline mr-1" />save</button>
              <button onClick={() => setAdding(false)} className="cx-btn-ghost text-xs">cancel</button>
            </div>
          </div>
        )}
        <button onClick={() => setAdding(true)} className="cx-btn-ghost text-xs font-mono mb-3">
          <Plus className="w-3 h-3 inline mr-1" />add provider
        </button>

        <div className="space-y-2">
          {config.providers.map((p) => {
            const isCurrent = config.current_provider === p.name;
            const isOpen = editing === p.name;
            return (
              <div key={p.name} className={clsx("cx-card p-3", isCurrent && "border-whale/30")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-800">{p.name}</span>
                    <span className="cx-badge-dim">{p.kind}</span>
                    {isCurrent && <span className="cx-badge-ok">active</span>}
                    <span className={p.enabled ? "cx-badge-ok" : "cx-badge-err"}>
                      {p.enabled ? "on" : "off"}
                    </span>
                  </div>
                  <button onClick={() => setEditing(isOpen ? null : p.name)} className="cx-btn-ghost text-2xs font-mono">
                    {isOpen ? "close" : "edit"} <ChevronRight className={clsx("w-3 h-3 transition-transform", isOpen && "rotate-90")} />
                  </button>
                </div>
                {!isOpen ? (
                  <div className="mt-1.5 text-2xs text-ink-500 font-mono space-y-0.5">
                    <div>url: {p.base_url || "default"}</div>
                    <div>key: {p.api_key ? "••••••••" : "not set"}</div>
                    <div>models: {p.models.join(", ") || "none"}</div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 animate-slide-up">
                    <Field label="api key">
                      <div className="relative">
                        <input className="cx-input pr-8" type={showKey[p.name] ? "text" : "password"}
                          value={p.api_key} onChange={(e) => {
                            const updated = { ...p, api_key: e.target.value };
                            updateConfig({ providers: config.providers.map((x) => x.name === p.name ? updated : x) });
                          }} />
                        <button onClick={() => setShowKey((s) => ({ ...s, [p.name]: !s[p.name] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-700">
                          {showKey[p.name] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </Field>
                    <Field label="base url">
                      <input className="cx-input" value={p.base_url} onChange={(e) => {
                        const updated = { ...p, base_url: e.target.value };
                        updateConfig({ providers: config.providers.map((x) => x.name === p.name ? updated : x) });
                      }} />
                    </Field>
                    <Field label="models (comma-separated)">
                      <input className="cx-input" value={p.models.join(", ")} onChange={(e) => {
                        const updated = { ...p, models: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                        updateConfig({ providers: config.providers.map((x) => x.name === p.name ? updated : x) });
                      }} />
                    </Field>
                    <div className="flex items-center gap-3">
                      <Toggle value={p.enabled} onChange={(v) => {
                        const updated = { ...p, enabled: v };
                        updateConfig({ providers: config.providers.map((x) => x.name === p.name ? updated : x) });
                      }} label="enabled" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => save(p)} className="cx-btn-primary text-xs"><Save className="w-3 h-3 inline mr-1" />save</button>
                      <button onClick={() => setEditing(null)} className="cx-btn-ghost text-xs">cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MCP Servers
   ═══════════════════════════════════════════════════════════════ */
function McpTab() {
  const { config, updateConfig } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", command: "", args: "", env: "" });

  const add = async () => {
    if (!form.name || !form.command) return;
    const s: McpServerConfig = { name: form.name, command: form.command, args: form.args.split(/\s+/).filter(Boolean), enabled: true };
    await addMcpServer(s);
    updateConfig({ mcp_servers: [...config.mcp_servers, s] });
    setForm({ name: "", command: "", args: "", env: "" });
    setAdding(false);
  };

  const remove = async (name: string) => {
    await removeMcpServer(name);
    updateConfig({ mcp_servers: config.mcp_servers.filter((s) => s.name !== name) });
  };

  const toggle = (name: string) => {
    updateConfig({
      mcp_servers: config.mcp_servers.map((s) => s.name === name ? { ...s, enabled: !s.enabled } : s),
    });
  };

  return (
    <>
      <Section title="MCP Servers" desc="Model Context Protocol servers provide external tools to the agent. Tools are auto-discovered at startup.">
        {adding && (
          <div className="cx-card p-4 mb-3 animate-slide-up">
            <Field label="name"><input className="cx-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="filesystem" /></Field>
            <Field label="command"><input className="cx-input" value={form.command} onChange={(e) => setForm({ ...form, command: e.target.value })} placeholder="npx" /></Field>
            <Field label="args (space-separated)" hint="e.g. -y @modelcontextprotocol/server-filesystem /">
              <input className="cx-input" value={form.args} onChange={(e) => setForm({ ...form, args: e.target.value })} />
            </Field>
            <div className="flex gap-2 mt-2">
              <button onClick={add} className="cx-btn-primary text-xs"><Check className="w-3 h-3 inline mr-1" />save</button>
              <button onClick={() => setAdding(false)} className="cx-btn-ghost text-xs">cancel</button>
            </div>
          </div>
        )}
        <button onClick={() => setAdding(true)} className="cx-btn-ghost text-xs font-mono mb-3">
          <Plus className="w-3 h-3 inline mr-1" />add server
        </button>

        {config.mcp_servers.length === 0 ? (
          <div className="text-center py-8 text-ink-500 font-mono text-xs">No MCP servers configured</div>
        ) : (
          <div className="space-y-2">
            {config.mcp_servers.map((s) => (
              <div key={s.name} className="cx-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(s.name)}>
                      {s.enabled ? <ToggleRight className="w-4 h-4 text-ok" /> : <ToggleLeft className="w-4 h-4 text-ink-500" />}
                    </button>
                    <span className="font-mono text-xs text-ink-800">{s.name}</span>
                  </div>
                  <button onClick={() => remove(s.name)} className="cx-btn-ghost text-err text-2xs">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="ml-6 mt-1 text-2xs text-ink-500 font-mono">
                  $ {s.command} {s.args.join(" ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="MCP Tools" desc="Tools exposed by connected MCP servers (auto-discovered at runtime)">
        <div className="text-xs text-ink-500 font-mono">
          MCP tools are listed automatically when the engine connects to configured servers.
          Use the runtime API endpoint <code className="text-whale-glow">/v1/apps/mcp/tools</code> to inspect.
        </div>
      </Section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Skills
   ═══════════════════════════════════════════════════════════════ */
function SkillsTab() {
  const { config, updateConfig } = useAppStore();

  return (
    <>
      <Section title="Skills Directory" desc="Skills are reusable workflow templates defined by SKILL.md files">
        <Field label="skills directory" hint="Each subdirectory with a SKILL.md file becomes a skill">
          <input className="cx-input" value={config.skills_dir} onChange={(e) => {
            updateConfig({ skills_dir: e.target.value });
            saveConfig({ ...config, skills_dir: e.target.value });
          }} />
        </Field>
      </Section>

      <Section title="How Skills Work" desc="Loading and invoking skills">
        <div className="cx-card p-4 text-xs text-ink-600 font-mono space-y-2">
          <p>• Place skill directories under <code className="text-whale-glow">~/.codewhale/skills/</code></p>
          <p>• Each skill needs a <code className="text-whale-glow">SKILL.md</code> file with instructions</p>
          <p>• Optional companion scripts alongside SKILL.md</p>
          <p>• Load in chat: <code className="text-whale-glow">load_skill</code> tool or <code className="text-whale-glow">/skills</code> command</p>
          <p>• Skills inject their prompt as system context for the agent</p>
        </div>
      </Section>

      <Section title="Built-in Skill Categories">
        <div className="grid grid-cols-2 gap-2">
          {["gstack (dev workflow)", "investment-research", "clone-website", "design-review", "qa", "review", "benchmark", "fleet-manager", "mcp-builder", "documents", "presentations", "pdf"].map((s) => (
            <div key={s} className="cx-card p-2.5 flex items-center gap-2">
              <Cpu className="w-3 h-3 text-ink-500" />
              <span className="font-mono text-2xs text-ink-700">{s}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Plugins
   ═══════════════════════════════════════════════════════════════ */
function PluginsTab() {
  const pluginTypes = [
    { name: "TUI Themes", desc: "Custom color themes for the terminal UI", status: "built-in" },
    { name: "LSP Integration", desc: "Post-edit diagnostics (rust-analyzer, pyright, gopls, etc.)", status: "built-in" },
    { name: "MCP Client", desc: "Connect to external MCP tool servers", status: "built-in" },
    { name: "MCP Server", desc: "Run CodeWhale as an MCP server for other clients", status: "built-in" },
    { name: "ACP Adapter", desc: "Agent Client Protocol for editor integration", status: "built-in" },
    { name: "Telegram Bridge", desc: "Chat with CodeWhale via Telegram", status: "external" },
    { name: "Feishu Bridge", desc: "Chat with CodeWhale via Feishu/Lark", status: "external" },
    { name: "WeChat Bridge", desc: "Chat with CodeWhale via WeChat (experimental)", status: "experimental" },
    { name: "VS Code Extension", desc: "Embed CodeWhale in VS Code (Phase 0)", status: "external" },
    { name: "HTTP/SSE Runtime API", desc: "REST API for custom integrations", status: "built-in" },
    { name: "Voice/TTS", desc: "Speech input/output via MiMo", status: "built-in" },
    { name: "Image OCR", desc: "Screenshot and image analysis", status: "built-in" },
  ];

  return (
    <>
      <Section title="Plugins & Integrations" desc="CodeWhale extension points — all are built-in or optional external bridges">
        <div className="space-y-1.5">
          {pluginTypes.map((p) => (
            <div key={p.name} className="cx-card p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-ink-500" />
                  <span className="font-mono text-xs text-ink-800">{p.name}</span>
                  <span className={clsx("cx-badge-dim",
                    p.status === "built-in" && "border-ok/20 text-ok",
                    p.status === "experimental" && "border-warn/20 text-warn",
                  )}>{p.status}</span>
                </div>
                <p className="text-2xs text-ink-500 ml-5 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Hooks
   ═══════════════════════════════════════════════════════════════ */
function HooksTab() {
  const { config, updateConfig } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ event: "tool_call_before", command: "" });

  const events = [
    { value: "tool_call_before", label: "tool_call_before", desc: "Before tool execution — return JSON {allow|deny|ask}" },
    { value: "tool_call_after", label: "tool_call_after", desc: "After tool execution" },
    { value: "turn_start", label: "turn_start", desc: "When a conversation turn starts" },
    { value: "turn_end", label: "turn_end", desc: "When a conversation turn ends" },
  ];

  const add = async () => {
    if (!form.command) return;
    const h: HookConfig = { event: form.event, command: form.command, enabled: true };
    await addHook(h);
    updateConfig({ hooks: [...config.hooks, h] });
    setForm({ event: "tool_call_before", command: "" });
    setAdding(false);
  };

  const remove = async (i: number) => {
    await removeHook(i);
    updateConfig({ hooks: config.hooks.filter((_, idx) => idx !== i) });
  };

  return (
    <>
      <Section title="Hooks" desc="Hooks v2: tool_call_before returns JSON decisions, supports glob matchers and project-level .codewhale/hooks.toml">
        {adding && (
          <div className="cx-card p-4 mb-3 animate-slide-up">
            <Field label="event">
              <select className="cx-input" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}>
                {events.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Field>
            <Field label="command" hint="Environment: $TOOL_NAME, $TOOL_INPUT, $THREAD_ID">
              <input className="cx-input" value={form.command} onChange={(e) => setForm({ ...form, command: e.target.value })} placeholder="echo 'tool: $TOOL_NAME'" />
            </Field>
            <div className="flex gap-2 mt-2">
              <button onClick={add} className="cx-btn-primary text-xs"><Check className="w-3 h-3 inline mr-1" />save</button>
              <button onClick={() => setAdding(false)} className="cx-btn-ghost text-xs">cancel</button>
            </div>
          </div>
        )}
        <button onClick={() => setAdding(true)} className="cx-btn-ghost text-xs font-mono mb-3">
          <Plus className="w-3 h-3 inline mr-1" />add hook
        </button>

        {config.hooks.length === 0 ? (
          <div className="text-center py-8 text-ink-500 font-mono text-xs">No hooks configured</div>
        ) : (
          <div className="space-y-2">
            {config.hooks.map((h, i) => (
              <div key={i} className="cx-card p-3 flex items-center justify-between">
                <div>
                  <span className="cx-badge-live mr-2">{h.event}</span>
                  <span className="font-mono text-xs text-ink-700">{h.command}</span>
                </div>
                <button onClick={() => remove(i)} className="cx-btn-ghost text-err text-2xs">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Hook Events Reference">
        <div className="space-y-1.5">
          {events.map((e) => (
            <div key={e.value} className="cx-card p-2.5">
              <span className="font-mono text-xs text-ink-800">{e.label}</span>
              <p className="text-2xs text-ink-500 mt-0.5">{e.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sandbox
   ═══════════════════════════════════════════════════════════════ */
function SandboxTab() {
  const { config, updateConfig } = useAppStore();
  const set = (k: string, v: unknown) => { updateConfig({ [k]: v }); saveConfig({ ...config, [k]: v }); };

  const types = [
    { value: "auto", label: "Auto-detect", desc: "Choose best sandbox for current OS" },
    { value: "seatbelt", label: "macOS Seatbelt", desc: "sandbox-exec profile-based isolation" },
    { value: "landlock", label: "Linux Landlock", desc: "Kernel-level filesystem sandbox" },
    { value: "bwrap", label: "Bubblewrap", desc: "Linux namespace isolation" },
    { value: "seccomp", label: "seccomp", desc: "Linux syscall filtering" },
    { value: "none", label: "Disabled", desc: "No sandbox (not recommended)" },
  ];

  return (
    <>
      <Section title="Sandbox" desc="OS-level isolation for tool execution — file, shell, and network access control">
        <Toggle value={config.sandbox_enabled} onChange={(v) => set("sandbox_enabled", v)} label="Enable sandbox" />
      </Section>

      <Section title="Sandbox Type">
        <div className="space-y-1.5">
          {types.map((t) => (
            <button key={t.value} onClick={() => set("sandbox_type", t.value)}
              className={clsx(
                "w-full text-left cx-card p-3 flex items-center gap-3 transition-colors",
                config.sandbox_type === t.value ? "border-whale/30 bg-whale/5" : "hover:border-ink-400"
              )}>
              <div className={clsx(
                "w-3 h-3 rounded-full border-2",
                config.sandbox_type === t.value ? "border-whale bg-whale" : "border-ink-400"
              )} />
              <div>
                <span className="font-mono text-xs text-ink-800">{t.label}</span>
                <p className="text-2xs text-ink-500">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   General
   ═══════════════════════════════════════════════════════════════ */
function GeneralTab() {
  const { config, updateConfig } = useAppStore();
  const set = (k: string, v: unknown) => { updateConfig({ [k]: v }); saveConfig({ ...config, [k]: v }); };

  return (
    <>
      <Section title="Workspace" desc="Default working directory and limits">
        <Field label="workspace directory">
          <input className="cx-input" value={config.workspace} onChange={(e) => set("workspace", e.target.value)} />
        </Field>
        <Field label="max turns per conversation">
          <input className="cx-input w-32" type="number" value={config.max_turns}
            onChange={(e) => set("max_turns", parseInt(e.target.value) || 100)} />
        </Field>
      </Section>

      <Section title="Appearance">
        <Field label="locale">
          <select className="cx-input w-48" value={config.locale} onChange={(e) => set("locale", e.target.value)}>
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
            <option value="ja-JP">日本語</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </Field>
        <Field label="theme">
          <select className="cx-input w-48" value={config.theme} onChange={(e) => set("theme", e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </Field>
      </Section>

      <Section title="Execution Mode">
        <Toggle value={config.auto_approve} onChange={(v) => set("auto_approve", v)}
          label="YOLO mode — auto-approve all tool calls (no confirmation dialogs)" />
        <p className="text-2xs text-ink-500 font-mono mt-1 ml-7">
          Equivalent to codewhale's YOLO mode. All tools execute without approval gates.
        </p>
      </Section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Settings Page (tab router)
   ═══════════════════════════════════════════════════════════════ */
const tabMap: Record<string, React.FC> = {
  providers: ProvidersTab, mcp: McpTab, skills: SkillsTab,
  plugins: PluginsTab, hooks: HooksTab, sandbox: SandboxTab, general: GeneralTab,
};

export function SettingsPage() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const active = tab || "providers";
  const Tab = tabMap[active] || ProvidersTab;
  const currentTab = tabs.find((t) => t.id === active);

  return (
    <div className="flex h-full">
      {/* Tab sidebar */}
      <div className="w-52 border-r border-ink-200 bg-ink-50/50 py-3 px-2 flex-shrink-0">
        <div className="px-2 mb-3">
          <h2 className="text-xs font-semibold text-ink-800 font-mono">settings</h2>
        </div>
        <div className="space-y-0.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => navigate(`/settings/${t.id}`)}
                className={clsx(
                  "w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                  active === t.id ? "bg-ink-200 text-ink-900" : "text-ink-600 hover:bg-ink-100 hover:text-ink-800"
                )}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-ink-900">{currentTab?.label}</h2>
            <p className="text-xs text-ink-500 font-mono">{currentTab?.desc}</p>
          </div>
          <Tab />
        </div>
      </div>
    </div>
  );
}
