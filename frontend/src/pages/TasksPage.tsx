import { useState, useEffect } from "react";
import {
  Plus,
  XCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "../store";
import { runtimeApi } from "../api";
import type { Task } from "../types";
import clsx from "clsx";

const statusConfig: Record<string, { icon: React.FC<{ className?: string }>; color: string; label: string }> = {
  queued: { icon: Clock, color: "text-yellow-400", label: "排队中" },
  running: { icon: Loader2, color: "text-blue-400", label: "运行中" },
  completed: { icon: CheckCircle2, color: "text-green-400", label: "已完成" },
  failed: { icon: XCircle, color: "text-red-400", label: "失败" },
  canceled: { icon: XCircle, color: "text-gray-400", label: "已取消" },
};

export function TasksPage() {
  const { tasks, setTasks } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await runtimeApi.listTasks();
      setTasks(data);
    } catch {
      // Runtime API not available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async () => {
    if (!newPrompt.trim()) return;
    try {
      await runtimeApi.createTask({ prompt: newPrompt });
      setNewPrompt("");
      setShowCreate(false);
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await runtimeApi.cancelTask(id);
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-100">任务管理</h2>
        <div className="flex gap-2">
          <button onClick={fetchTasks} className="btn-ghost text-sm flex items-center gap-1">
            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
            刷新
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> 创建任务
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50 animate-slide-up">
          <h4 className="text-sm font-semibold text-gray-200 mb-3">创建新任务</h4>
          <textarea
            className="input-field resize-none"
            rows={3}
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="输入任务描述..."
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="btn-primary text-sm">创建</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <CheckCircle2 className="w-12 h-12 mb-3 text-gray-700" />
            <p className="text-sm">暂无任务</p>
            <p className="text-xs text-gray-600 mt-1">创建任务让 CodeWhale 在后台执行</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const cfg = statusConfig[task.status] || statusConfig.queued;
              const Icon = cfg.icon;
              return (
                <div key={task.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={clsx("w-4 h-4", cfg.color)} />
                        <span className={clsx("text-xs", cfg.color)}>{cfg.label}</span>
                        <span className="text-xs text-gray-600 font-mono">{task.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{task.prompt}</p>
                      {task.checklist && task.checklist.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {task.checklist.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {item.status === "completed" ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : item.status === "in_progress" ? (
                                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                              ) : (
                                <Clock className="w-3 h-3 text-gray-500" />
                              )}
                              <span className="text-gray-400">{item.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {task.status === "running" && (
                      <button onClick={() => handleCancel(task.id)} className="btn-ghost text-red-400 text-xs ml-3">
                        取消
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
