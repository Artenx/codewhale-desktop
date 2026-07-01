import { useState, useEffect } from "react";
import {
  Ship,
  Users,
  RefreshCw,
  StopCircle,
  RotateCcw,
} from "lucide-react";
import { runtimeApi } from "../api";
import clsx from "clsx";

const statusColors: Record<string, string> = {
  running: "text-live",
  completed: "text-ok",
  failed: "text-err",
  stopped: "text-ink-500",
  pending: "text-warn",
};

export function FleetPage() {
  const [runs, setRuns] = useState<Record<string, unknown>[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [workers, setWorkers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await runtimeApi.listFleetRuns();
      setRuns(Array.isArray(data) ? data : []);
    } catch { /* API not available */ }
    finally { setLoading(false); }
  };

  const fetchWorkers = async (runId: string) => {
    try {
      const data = await runtimeApi.listFleetRunWorkers(runId);
      setWorkers(Array.isArray(data) ? data : []);
    } catch { setWorkers([]); }
  };

  useEffect(() => { fetchRuns(); }, []);
  useEffect(() => { if (selectedRun) fetchWorkers(selectedRun); }, [selectedRun]);

  const handleStop = async (runId: string) => {
    try { await runtimeApi.stopFleetRun(runId); fetchRuns(); } catch {}
  };
  const handleInterruptWorker = async (workerId: string) => {
    try { await runtimeApi.interruptFleetWorker(workerId); if (selectedRun) fetchWorkers(selectedRun); } catch {}
  };
  const handleRestartWorker = async (workerId: string) => {
    try { await runtimeApi.restartFleetWorker(workerId); if (selectedRun) fetchWorkers(selectedRun); } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
        <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2">
          <Ship className="w-5 h-5 text-whale-glow" /> Fleet 编排
        </h2>
        <button onClick={fetchRuns} className="cx-btn-ghost text-sm flex items-center gap-1">
          <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} /> 刷新
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex">
        {/* Runs list */}
        <div className="w-1/3 border-r border-ink-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Fleet 运行</h3>
          {runs.length === 0 ? (
            <div className="text-center text-ink-500 text-sm py-8">暂无 Fleet 运行</div>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <div
                  key={run.id as string}
                  onClick={() => setSelectedRun(run.id as string)}
                  className={clsx(
                    "cx-card p-3 cursor-pointer transition-colors",
                    selectedRun === run.id && "border-whale/40 bg-whale-muted/10"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Ship className="w-4 h-4 text-ink-500" />
                    <span className="text-sm font-mono text-ink-800 truncate">{(run.id as string)?.slice(0, 12)}</span>
                    <span className={clsx("text-xs", statusColors[run.status as string] || "text-ink-500")}>{run.status as string}</span>
                  </div>
                  <p className="text-xs text-ink-500 truncate">{run.prompt as string || ""}</p>
                  <div className="flex gap-1 mt-2">
                    {run.status === "running" && (
                      <button onClick={(e) => { e.stopPropagation(); handleStop(run.id as string); }} className="cx-btn-ghost text-err text-xs p-1">
                        <StopCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workers detail */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> Workers
          </h3>
          {!selectedRun ? (
            <div className="text-center text-ink-500 text-sm py-8">选择一个 Fleet 运行查看 Workers</div>
          ) : workers.length === 0 ? (
            <div className="text-center text-ink-500 text-sm py-8">暂无 Workers</div>
          ) : (
            <div className="space-y-3">
              {workers.map((w) => (
                <div key={w.id as string} className="cx-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-ink-800">{w.name as string || w.id as string}</span>
                        <span className={clsx("text-xs", statusColors[w.status as string])}>{w.status as string}</span>
                      </div>
                      <div className="text-xs text-ink-500">模型: {w.model as string || "—"}</div>
                      <div className="text-xs text-ink-500 mt-1">{w.task as string || ""}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleInterruptWorker(w.id as string)} className="cx-btn-ghost text-warn text-xs" title="中断">
                        <StopCircle className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleRestartWorker(w.id as string)} className="cx-btn-ghost text-live text-xs" title="重启">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
