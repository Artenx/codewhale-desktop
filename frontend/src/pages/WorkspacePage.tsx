import { useState, useEffect } from "react";
import {
  FolderOpen,
  GitBranch,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { runtimeApi } from "../api";
import clsx from "clsx";

export function WorkspacePage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ws, ri] = await Promise.all([
        runtimeApi.workspaceStatus().catch(() => null),
        runtimeApi.runtimeInfo().catch(() => null),
      ]);
      setStatus(ws);
      setInfo(ri);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
        <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-whale-glow" /> 工作区状态
        </h2>
        <button onClick={fetchData} className="cx-btn-ghost text-sm flex items-center gap-1">
          <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} /> 刷新
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Runtime Info */}
        <div className="cx-card p-4">
          <h3 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ok" /> 运行时信息
          </h3>
          {info ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(info).map(([key, value]) => (
                <div key={key}>
                  <span className="text-xs text-ink-500">{key}</span>
                  <div className="text-sm text-ink-800 font-mono truncate">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">无法获取运行时信息（引擎可能未启动）</p>
          )}
        </div>

        {/* Workspace Status */}
        <div className="cx-card p-4">
          <h3 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-whale-glow" /> 工作区 Git 状态
          </h3>
          {status ? (
            <div className="space-y-3">
              {Object.entries(status).map(([key, value]) => (
                <div key={key} className="flex items-start gap-3">
                  <span className="text-xs text-ink-500 w-32 flex-shrink-0 pt-0.5">{key}</span>
                  <div className="text-sm text-ink-800 font-mono break-all">
                    {typeof value === "object" ? (
                      <pre className="text-xs bg-ink-50/50 rounded p-2 overflow-x-auto max-h-48">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <AlertCircle className="w-4 h-4" />
              无法获取工作区状态（引擎可能未启动）
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
