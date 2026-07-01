import { useState, useEffect } from "react";
import {
  Plus,
  Layers,
  RefreshCw,
  GitFork,
  RotateCcw,
} from "lucide-react";
import { useAppStore } from "../store";
import { runtimeApi } from "../api";
import clsx from "clsx";

export function SessionsPage() {
  const { threads, setThreads, currentThreadId, setCurrentThreadId } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<unknown[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [threadsData, sessionsData] = await Promise.all([
        runtimeApi.listThreads().catch(() => []),
        runtimeApi.listSessions().catch(() => []),
      ]);
      setThreads(threadsData);
      setSessions(sessionsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewThread = async () => {
    try {
      const thread = await runtimeApi.createThread();
      setCurrentThreadId(thread.id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFork = async (id: string) => {
    try {
      const forked = await runtimeApi.forkThread(id);
      setCurrentThreadId(forked.id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompact = async (id: string) => {
    try {
      await runtimeApi.compactThread(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
        <h2 className="text-lg font-semibold text-ink-900">会话管理</h2>
        <div className="flex gap-2">
          <button onClick={fetchData} className="cx-btn-ghost text-sm flex items-center gap-1">
            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
            刷新
          </button>
          <button onClick={handleNewThread} className="cx-btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> 新建线程
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Threads */}
        <h3 className="text-sm font-semibold text-ink-700 mb-3">线程</h3>
        {threads.length === 0 ? (
          <div className="cx-card p-4 text-center text-ink-500 text-sm mb-6">
            暂无线程
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={clsx(
                  "cx-card p-4 cursor-pointer transition-colors",
                  currentThreadId === thread.id && "border-whale/40 bg-whale-muted/10"
                )}
                onClick={() => setCurrentThreadId(thread.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-ink-500" />
                      <h4 className="text-sm font-medium text-ink-800 truncate">
                        {thread.title || `线程 ${thread.id.slice(0, 8)}`}
                      </h4>
                      {currentThreadId === thread.id && (
                        <span className="cx-badge-ok text-xs">当前</span>
                      )}
                    </div>
                    <div className="text-xs text-ink-500">
                      {thread.message_count} 条消息 · {thread.model} · {thread.status}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFork(thread.id); }}
                      className="cx-btn-ghost p-1.5"
                      title="分叉"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCompact(thread.id); }}
                      className="cx-btn-ghost p-1.5"
                      title="压缩上下文"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saved Sessions */}
        <h3 className="text-sm font-semibold text-ink-700 mb-3">保存的会话</h3>
        {sessions.length === 0 ? (
          <div className="cx-card p-4 text-center text-ink-500 text-sm">
            暂无保存的会话
          </div>
        ) : (
          <div className="space-y-2">
            {(sessions as Array<{ id: string; title?: string; created_at?: string }>).map((session) => (
              <div key={session.id} className="cx-card p-4">
                <div className="text-sm text-ink-800">{session.title || session.id}</div>
                <div className="text-xs text-ink-500 mt-1">{session.created_at}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
