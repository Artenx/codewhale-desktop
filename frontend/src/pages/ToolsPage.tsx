import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Terminal,
  GitBranch,
  Globe,
  Beaker,
  Users,
  ListChecks,
  Brain,
  Database,
  BarChart3,
  Cpu,
  Wrench,
} from "lucide-react";
import { useAppStore } from "../store";
import { listTools } from "../api";
import type { ToolDef } from "../types";
import clsx from "clsx";

const categoryIcons: Record<string, React.FC<{ className?: string }>> = {
  file: FileText,
  shell: Terminal,
  git: GitBranch,
  web: Globe,
  test: Beaker,
  subagent: Users,
  planning: ListChecks,
  task: ListChecks,
  rlm: Brain,
  skill: Cpu,
  meta: Search,
  data: Database,
  finance: BarChart3,
  sandbox: Terminal,
  ui: Wrench,
};

const categoryLabels: Record<string, string> = {
  file: "文件操作",
  shell: "Shell 命令",
  git: "Git 操作",
  web: "网络请求",
  test: "测试运行",
  subagent: "子 Agent",
  planning: "规划工具",
  task: "任务管理",
  rlm: "RLM 会话",
  skill: "技能加载",
  meta: "元工具",
  data: "数据验证",
  finance: "金融数据",
  sandbox: "沙箱执行",
  ui: "用户交互",
};

export function ToolsPage() {
  const { tools, setTools } = useAppStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    listTools()
      .then(setTools)
      .catch(() => {
        // Use default tools if engine not available
      });
  }, []);

  const categories = Array.from(new Set(tools.map((t) => t.category)));

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      !search ||
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-100 mb-3">工具管理</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="input-field pl-10"
              placeholder="搜索工具..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="px-6 py-3 border-b border-gray-800 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={clsx(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
            !selectedCategory
              ? "bg-whale-600/20 text-whale-400 border border-whale-600/30"
              : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
          )}
        >
          全部 ({tools.length})
        </button>
        {categories.map((cat) => {
          const Icon = categoryIcons[cat] || Wrench;
          const count = tools.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                selectedCategory === cat
                  ? "bg-whale-600/20 text-whale-400 border border-whale-600/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
              )}
            >
              <Icon className="w-3 h-3" />
              {categoryLabels[cat] || cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Tools grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Wrench className="w-12 h-12 mb-3 text-gray-700" />
            <p className="text-sm">未找到匹配的工具</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTools.map((tool) => {
              const Icon = categoryIcons[tool.category] || Wrench;
              return (
                <div key={tool.name} className="tool-card">
                  <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono font-medium text-gray-200 truncate">
                      {tool.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {tool.description}
                    </div>
                    <span className="badge-gray text-[10px] mt-1">
                      {categoryLabels[tool.category] || tool.category}
                    </span>
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
