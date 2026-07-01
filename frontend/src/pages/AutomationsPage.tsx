import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { runtimeApi } from "../api";
import clsx from "clsx";

export function AutomationsPage() {
  const [automations, setAutomations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newAuto, setNewAuto] = useState({ name: "", schedule: "", prompt: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runs, setRuns] = useState<Record<string, unknown>[]>([]);

  const fetchAutomations = async () => {
    setLoading(true);
    try {
      const data = await runtimeApi.listAutomations();
      setAutomations(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAutomations(); }, []);

  const handleCreate = async () => {
    if (!newAuto.name || !newAuto.prompt) return;
    try {
      await runtimeApi.createAutomation(newAuto);
      setNewAuto({ name: "", schedule: "", prompt: "" });
      setShowCreate(false);
      fetchAutomations();
    } catch {}
  };

  const handleToggle = async (auto: Record<string, unknown>) => {
    try {
      if (auto.enabled) {
        await runtimeApi.pauseAutomation(auto.id as string);
      } else {
        await runtimeApi.resumeAutomation(auto.id as string);
      }
      fetchAutomations();
    } catch {}
  };

  const handleRun = async (id: string) => {
    try { await runtimeApi.runAutomation(id); fetchAutomations(); } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await runtimeApi.deleteAutomation(id); fetchAutomations(); } catch {}
  };

  const handleShowRuns = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setRuns([]); return; }
    setExpandedId(id);
    try {
      const data = await runtimeApi.listAutomationRuns(id);
      setRuns(Array.isArray(data) ? data : []);
    } catch { setRuns([]); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
        <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-whale-glow" /> 自动化
        </h2>
        <div className="flex gap-2">
          <button onClick={fetchAutomations} className="cx-btn-ghost text-sm flex items-center gap-1">
            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} /> 刷新
          </button>
          <button onClick={() => setShowCreate(true)} className="cx-btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> 创建自动化
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="px-6 py-4 border-b border-ink-200 bg-ink-50/50 animate-slide-up">
          <h4 className="text-sm font-semibold text-ink-800 mb-3">创建自动化</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-600 font-mono mb-1 block">名称</label>
              <input className="cx-input" value={newAuto.name} onChange={(e) => setNewAuto({ ...newAuto, name: e.target.value })} placeholder="daily-report" />
            </div>
            <div>
              <label className="text-xs text-ink-600 font-mono mb-1 block">调度 (cron 表达式)</label>
              <input className="cx-input" value={newAuto.schedule} onChange={(e) => setNewAuto({ ...newAuto, schedule: e.target.value })} placeholder="0 9 * * *" />
            </div>
            <div>
              <label className="text-xs text-ink-600 font-mono mb-1 block">提示词</label>
              <textarea className="cx-input resize-none" rows={3} value={newAuto.prompt} onChange={(e) => setNewAuto({ ...newAuto, prompt: e.target.value })} placeholder="生成每日报告..." />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="cx-btn-primary text-sm">创建</button>
            <button onClick={() => setShowCreate(false)} className="cx-btn-ghost text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-500">
            <Calendar className="w-12 h-12 mb-3 text-ink-400" />
            <p className="text-sm">暂无自动化</p>
            <p className="text-xs text-ink-500 mt-1">创建定时任务让 CodeWhale 自动执行</p>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((auto) => (
              <div key={auto.id as string} className="cx-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-ink-500" />
                      <span className="text-sm font-semibold text-ink-800">{auto.name as string}</span>
                      <span className={clsx("cx-badge text-xs", auto.enabled ? "cx-badge-ok" : "cx-badge-err")}>
                        {auto.enabled ? "启用" : "暂停"}
                      </span>
                    </div>
                    <div className="text-xs text-ink-500">
                      调度: <code>{auto.schedule as string || "手动"}</code>
                    </div>
                    <p className="text-xs text-ink-600 mt-1 truncate">{auto.prompt as string}</p>
                    {(auto.last_run as string) && (
                      <div className="text-xs text-ink-500 mt-1">上次运行: {auto.last_run as string}</div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button onClick={() => handleToggle(auto)} className="cx-btn-ghost p-1.5" title={auto.enabled ? "暂停" : "恢复"}>
                      {auto.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleRun(auto.id as string)} className="cx-btn-ghost p-1.5 text-whale-glow" title="立即运行">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleShowRuns(auto.id as string)} className="cx-btn-ghost p-1.5" title="运行历史">
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(auto.id as string)} className="cx-btn-ghost p-1.5 text-err" title="删除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {expandedId === auto.id && (
                  <div className="mt-3 pt-3 border-t border-ink-200">
                    <h5 className="text-xs font-semibold text-ink-600 mb-2">运行历史</h5>
                    {runs.length === 0 ? (
                      <p className="text-xs text-ink-500">暂无运行记录</p>
                    ) : (
                      <div className="space-y-1">
                        {runs.map((run, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {run.status === "completed" ? <CheckCircle2 className="w-3 h-3 text-ok" /> :
                             run.status === "failed" ? <XCircle className="w-3 h-3 text-err" /> :
                             <Loader2 className="w-3 h-3 text-live animate-spin" />}
                            <span className="text-ink-600">{run.created_at as string || ""}</span>
                            <span className="text-ink-500">{run.status as string}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
