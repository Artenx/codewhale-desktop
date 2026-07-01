import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  Settings, Plus,
  Zap, ZapOff, Folder, Hash, PanelLeft,
  CheckSquare, Wrench, Ship, Calendar, Camera, Layers,
} from "lucide-react";
import { useAppStore } from "./store";
import { startEngine, stopEngine } from "./api";
import { ChatPage } from "./pages/ChatPage";
import { SettingsPage } from "./pages/SettingsPage";
import { FleetPage } from "./pages/FleetPage";
import { TasksPage } from "./pages/TasksPage";
import { SessionsPage } from "./pages/SessionsPage";
import { ToolsPage } from "./pages/ToolsPage";
import { AutomationsPage } from "./pages/AutomationsPage";
import { SnapshotsPage } from "./pages/SnapshotsPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import clsx from "clsx";

/* ─── Sidebar (Codex task-list style) ─── */
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sidebarOpen, engineRunning, setEngineRunning,
    config, threads, currentThreadId, setCurrentThreadId, setError,
  } = useAppStore();

  const handleEngine = async () => {
    try {
      if (engineRunning) { await stopEngine(); setEngineRunning(false); }
      else { await startEngine(); setEngineRunning(true); }
    } catch (e: unknown) { setError(String(e)); }
  };

  return (
    <aside className={clsx(
      "fixed inset-y-0 left-0 z-40 flex flex-col bg-ink-50 border-r border-ink-200 transition-all duration-200",
      sidebarOpen ? "w-72" : "w-0 overflow-hidden"
    )}>
      {/* Title bar drag region */}
      <div data-tauri-drag-region className="h-10 flex-shrink-0" />

      {/* New task button */}
      <div className="px-3 pb-2">
        <button
          onClick={() => { navigate("/chat"); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
            bg-ink-100 border border-ink-300 text-ink-700 hover:text-ink-900
            hover:bg-ink-200 transition-colors text-sm font-mono"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
          <span className="ml-auto text-2xs text-ink-500">⌘N</span>
        </button>
      </div>

      {/* Task list (Codex style) */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {threads.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-ink-500 font-mono">No tasks yet</p>
          </div>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => { setCurrentThreadId(t.id); navigate("/chat"); }}
            className={clsx(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors group",
              currentThreadId === t.id
                ? "bg-ink-200/80 text-ink-900"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-800"
            )}
          >
            <div className="flex items-center gap-2">
              <Hash className="w-3 h-3 flex-shrink-0 text-ink-500" />
              <span className="truncate font-mono text-xs">
                {t.title || t.id.slice(0, 12)}
              </span>
            </div>
            <div className="ml-5 text-2xs text-ink-500 truncate">
              {t.message_count} msgs · {t.model}
            </div>
          </button>
        ))}
      </div>

      {/* Nav links */}
      <div className="px-2 py-1 border-t border-ink-200/50 space-y-0.5">
        {[
          { path: "/sessions", label: "sessions", icon: Layers },
          { path: "/tasks", label: "tasks", icon: CheckSquare },
          { path: "/tools", label: "tools", icon: Wrench },
          { path: "/fleet", label: "fleet", icon: Ship },
          { path: "/automations", label: "automations", icon: Calendar },
          { path: "/workspace", label: "workspace", icon: Folder },
          { path: "/snapshots", label: "snapshots", icon: Camera },
        ].map(({ path, label, icon: Icon }) => (
          <button key={path} onClick={() => navigate(path)}
            className={clsx(
              "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors",
              location.pathname === path
                ? "bg-ink-200 text-ink-900"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            )}>
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ink-200 px-3 py-2 space-y-1.5">
        {/* Engine toggle */}
        <button
          onClick={handleEngine}
          className={clsx(
            "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors",
            engineRunning
              ? "text-ok hover:bg-ok/10"
              : "text-ink-500 hover:bg-ink-100 hover:text-ink-700"
          )}
        >
          {engineRunning ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
          {engineRunning ? "engine: running" : "engine: stopped"}
          {engineRunning && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
          )}
        </button>

        {/* Model indicator */}
        <div className="px-3 text-2xs text-ink-500 font-mono truncate">
          {config.current_provider}/{config.current_model}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className={clsx(
            "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors",
            location.pathname.startsWith("/settings")
              ? "text-ink-900 bg-ink-200"
              : "text-ink-500 hover:bg-ink-100 hover:text-ink-700"
          )}
        >
          <Settings className="w-3 h-3" />
          settings
        </button>
      </div>
    </aside>
  );
}

/* ─── Main Layout ─── */
export default function App() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const theme = useAppStore((s) => s.config.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="flex h-screen bg-ink text-ink-800 overflow-hidden">
      <Sidebar />

      <main className={clsx(
        "flex-1 flex flex-col min-w-0 transition-all duration-200",
        sidebarOpen ? "ml-72" : "ml-0"
      )}>
        {/* Collapsed sidebar toggle */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-3 left-3 z-50 p-1.5 rounded-md bg-ink-100 border border-ink-300
              text-ink-600 hover:text-ink-800 hover:bg-ink-200 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/fleet" element={<FleetPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/snapshots" element={<SnapshotsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:tab" element={<SettingsPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
