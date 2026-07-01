import { useState, useEffect } from "react";
import {
  Camera,
  RotateCcw,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { runtimeApi } from "../api";
import clsx from "clsx";

export function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const data = await runtimeApi.listSnapshots();
      setSnapshots(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSnapshots(); }, []);

  const handleRestore = async (id: string) => {
    if (!confirm("确认恢复到此快照？当前工作区文件将被覆盖。")) return;
    setRestoring(id);
    try {
      await runtimeApi.restoreSnapshot(id);
      fetchSnapshots();
    } catch {}
    finally { setRestoring(null); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
        <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-whale-glow" /> 快照管理
        </h2>
        <button onClick={fetchSnapshots} className="cx-btn-ghost text-sm flex items-center gap-1">
          <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} /> 刷新
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="cx-card p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-600">
              快照是 codewhale 在每轮工具执行前/后自动创建的 side-git 工作区快照。
              恢复快照会将工作区文件回滚到该时间点，但不会修改对话历史或你的 git 提交。
            </p>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-500">
            <Camera className="w-12 h-12 mb-3 text-ink-400" />
            <p className="text-sm">暂无快照</p>
            <p className="text-xs text-ink-500 mt-1">使用 Agent/YOLO 模式时会自动创建快照</p>
          </div>
        ) : (
          <div className="space-y-2">
            {snapshots.map((snap) => (
              <div key={snap.id as string} className="cx-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className="w-4 h-4 text-ink-500" />
                      <span className="text-sm font-mono text-ink-800">{snap.id as string}</span>
                    </div>
                    <div className="text-xs text-ink-500 space-y-0.5">
                      <div>线程: {snap.thread_id as string || "—"}</div>
                      <div>轮次: {snap.turn_id as string || "—"}</div>
                      <div>创建: {snap.created_at as string || "—"}</div>
                      {(snap.description as string) && <div>描述: {snap.description as string}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(snap.id as string)}
                    disabled={restoring === snap.id}
                    className={clsx(
                      "cx-btn-ghost text-sm flex items-center gap-1.5",
                      restoring === snap.id && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {restoring === snap.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    恢复
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
