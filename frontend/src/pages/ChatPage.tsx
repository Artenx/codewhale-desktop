import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Square, Loader2, Bot, User, Wrench, CheckCircle2,
  XCircle, Hash, Shrink, GitFork, RotateCcw,
  Paperclip, FileText, Image, X, FileCode, File,
} from "lucide-react";
import { useAppStore } from "../store";
import { sendMessage } from "../api";
import type { ChatMessage, ToolCall } from "../types";
import clsx from "clsx";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/* ─── Attachment types ─── */
interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;        // mime
  content: string;     // text content or base64 data-url
  isImage: boolean;
  preview?: string;    // data-url for images
}

function fileIcon(name: string, isImage: boolean) {
  if (isImage) return Image;
  if (/\.(rs|ts|tsx|js|py|go|java|c|cpp|h|rb|sh|toml|yaml|yml|json|md|html|css|sql)$/i.test(name)) return FileCode;
  if (/\.(txt|log|csv|xml|ini|conf|cfg|env)$/i.test(name)) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Attachment chip ─── */
function AttachmentChip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  const Icon = fileIcon(att.name, att.isImage);
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-ink-100 border border-ink-300 rounded-md
      text-2xs font-mono text-ink-700 group animate-fade-in max-w-[200px]">
      {att.isImage && att.preview ? (
        <img src={att.preview} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
      ) : (
        <Icon className="w-3 h-3 flex-shrink-0 text-ink-500" />
      )}
      <span className="truncate">{att.name}</span>
      <span className="text-ink-500 flex-shrink-0">{formatSize(att.size)}</span>
      <button onClick={onRemove} className="ml-0.5 text-ink-500 hover:text-err transition-colors flex-shrink-0">
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

/* ─── Read file to Attachment ─── */
function readAsAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);

    if (isImage) {
      reader.onload = () => {
        resolve({
          id: uid(), name: file.name, size: file.size, type: file.type,
          content: reader.result as string, isImage: true, preview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        resolve({
          id: uid(), name: file.name, size: file.size, type: file.type,
          content: reader.result as string, isImage: false,
        });
      };
      reader.readAsText(file);
    }
  });
}

/* ─── Tool execution card (terminal style) ─── */
function ToolCard({ tool }: { tool: ToolCall }) {
  const cfg = {
    pending:   { cls: "text-warn", icon: Loader2,      label: "pending" },
    running:   { cls: "text-live", icon: Loader2,      label: "running" },
    completed: { cls: "text-ok",   icon: CheckCircle2,  label: "done" },
    error:     { cls: "text-err",  icon: XCircle,       label: "error" },
    approved:  { cls: "text-ok",   icon: CheckCircle2,  label: "approved" },
    denied:    { cls: "text-err",  icon: XCircle,       label: "denied" },
  }[tool.status] || { cls: "text-ink-500", icon: Wrench, label: tool.status };
  const Icon = cfg.icon;

  return (
    <div className="my-1.5 border border-ink-200 rounded-md overflow-hidden animate-fade-in">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-ink-50 border-b border-ink-200">
        <Wrench className="w-3 h-3 text-ink-500" />
        <span className="font-mono text-xs text-ink-700">{tool.name}</span>
        <span className={clsx("font-mono text-2xs", cfg.cls)}>{cfg.label}</span>
        {tool.duration_ms != null && (
          <span className="font-mono text-2xs text-ink-500 ml-auto">{tool.duration_ms}ms</span>
        )}
      </div>
      {tool.input && Object.keys(tool.input).length > 0 && (
        <pre className="px-3 py-2 text-2xs font-mono text-ink-600 bg-ink overflow-x-auto max-h-28">
          {JSON.stringify(tool.input, null, 2)}
        </pre>
      )}
      {tool.output && (
        <pre className="px-3 py-2 text-2xs font-mono text-ink-700 bg-ink-50 border-t border-ink-200
          overflow-x-auto max-h-40">
          {tool.output}
        </pre>
      )}
      {tool.error && (
        <div className="px-3 py-1.5 text-2xs font-mono text-err bg-err/5 border-t border-err/20">
          ✕ {tool.error}
        </div>
      )}
    </div>
  );
}

/* ─── Message bubble ─── */
function Msg({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={clsx("flex gap-3 px-4 py-3 animate-fade-in", isUser && "flex-row-reverse")}>
      <div className={clsx(
        "w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-2xs",
        isUser ? "bg-ink-200 text-ink-700" : "bg-whale/10 text-whale-glow"
      )}>
        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
      </div>
      <div className={clsx("flex-1 min-w-0 max-w-[85%]", isUser && "flex flex-col items-end")}>
        <div className={clsx(
          "rounded-lg px-3 py-2 text-sm",
          isUser ? "bg-ink-200 text-ink-900 border border-ink-300" : "bg-ink-50 text-ink-800 border border-ink-200"
        )}>
          {msg.thinking && (
            <div className="text-2xs text-ink-500 italic mb-2 pb-1.5 border-b border-ink-200">
              💭 {msg.thinking}
            </div>
          )}
          {/* Attachments in message */}
          {(msg as unknown as { attachments?: Attachment[] }).attachments?.map((att) => (
            <div key={att.id} className="mb-2">
              {att.isImage && att.preview ? (
                <img src={att.preview} alt={att.name} className="max-w-xs max-h-48 rounded border border-ink-300" />
              ) : (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-ink rounded border border-ink-200 text-2xs font-mono text-ink-600">
                  <FileText className="w-3 h-3" />
                  <span>{att.name}</span>
                  <span className="text-ink-500">{formatSize(att.size)}</span>
                </div>
              )}
            </div>
          ))}
          <div className="whitespace-pre-wrap break-words md">{msg.content}</div>
          {msg.tool_calls?.map((t) => <ToolCard key={t.id} tool={t} />)}
        </div>
        <div className="text-2xs text-ink-500 mt-0.5 px-0.5 font-mono">
          {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour12: false })}
          {msg.is_streaming && <span className="ml-1.5 text-live animate-cursor-blink">▊</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Chat Page ─── */
export function ChatPage() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const {
    messages, addMessage, updateMessage, clearMessages,
    isStreaming, setIsStreaming, config, engineRunning,
    currentThreadId, setCurrentThreadId,
  } = useAppStore();

  const scroll = useCallback(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), []);
  useEffect(() => { scroll(); }, [messages, scroll]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  /* ── File handling ── */
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const newAtts: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 10 * 1024 * 1024) continue; // 10MB limit
      try {
        newAtts.push(await readAsAttachment(f));
      } catch { /* skip unreadable */ }
    }
    setAttachments((prev) => [...prev, ...newAtts]);
  }, []);

  const removeAtt = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  // Drag-and-drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  // Paste handler (images from clipboard)
  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  }, [addFiles]);

  /* ── Send ── */
  const buildMessageContent = (text: string, atts: Attachment[]): string => {
    if (atts.length === 0) return text;
    const parts: string[] = [];
    for (const att of atts) {
      if (att.isImage) {
        parts.push(`[Image: ${att.name}]`);
      } else {
        // Include file content with path hint for the agent
        parts.push(`\n\n--- File: ${att.name} (${formatSize(att.size)}) ---\n${att.content}`);
      }
    }
    return text + parts.join("");
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || isStreaming) return;

    const msgContent = buildMessageContent(text, attachments);
    const msgAttachments = [...attachments];
    setInput("");
    setAttachments([]);

    addMessage({
      id: uid(), role: "user", content: text || "(attachment)",
      timestamp: Date.now(), attachments: msgAttachments,
    } as ChatMessage & { attachments: Attachment[] });

    const aid = uid();
    addMessage({ id: aid, role: "assistant", content: "", timestamp: Date.now(), is_streaming: true });
    setIsStreaming(true);

    try {
      const resp = await sendMessage(msgContent, currentThreadId || undefined);
      try {
        const p = JSON.parse(resp);
        if (p.thread_id) setCurrentThreadId(p.thread_id);
        updateMessage(aid, { content: p.content || p.message || resp, is_streaming: false });
      } catch {
        updateMessage(aid, { content: resp, is_streaming: false });
      }
    } catch (e: unknown) {
      updateMessage(aid, { content: `error: ${String(e)}`, is_streaming: false });
    } finally {
      setIsStreaming(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-full" ref={dropRef} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center pointer-events-none">
          <div className="cx-card px-8 py-6 border-whale/40 bg-ink-50/95 flex flex-col items-center gap-3">
            <Paperclip className="w-8 h-8 text-whale-glow" />
            <p className="text-sm font-mono text-ink-800">Drop files here</p>
            <p className="text-2xs text-ink-500">Max 10MB per file</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div data-tauri-drag-region className="h-10 flex items-center justify-between px-4
        border-b border-ink-200 bg-ink flex-shrink-0">
        <div className="flex items-center gap-2">
          {currentThreadId ? (
            <>
              <Hash className="w-3 h-3 text-ink-500" />
              <span className="font-mono text-xs text-ink-600">{currentThreadId.slice(0, 12)}</span>
            </>
          ) : (
            <span className="font-mono text-xs text-ink-500">codewhale</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearMessages} className="cx-btn-ghost text-2xs font-mono" title="New">+ new</button>
          <button className="cx-btn-ghost text-2xs font-mono" title="Compact"><Shrink className="w-3 h-3" /></button>
          <button className="cx-btn-ghost text-2xs font-mono" title="Fork"><GitFork className="w-3 h-3" /></button>
          <button className="cx-btn-ghost text-2xs font-mono" title="Retry"><RotateCcw className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="font-mono text-ink-500 text-center space-y-3">
              <div className="text-2xl text-ink-400">⌂</div>
              <p className="text-sm text-ink-600">{engineRunning ? "Ready." : "Start the engine to begin."}</p>
              <p className="text-xs text-ink-500 max-w-sm">
                Type a prompt or drop files below.
                Use <kbd className="px-1 py-0.5 bg-ink-100 border border-ink-300 rounded text-2xs">Enter</kbd> to send,
                <kbd className="px-1 py-0.5 bg-ink-100 border border-ink-300 rounded text-2xs ml-1">⌘V</kbd> to paste images.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((m) => <Msg key={m.id} msg={m} />)}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-ink-200 bg-ink px-4 py-3 flex-shrink-0">
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-ink-200/50">
            {attachments.map((att) => (
              <AttachmentChip key={att.id} att={att} onRemove={() => removeAtt(att.id)} />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="p-1.5 rounded-md text-ink-500 hover:text-ink-700 hover:bg-ink-100
              transition-colors flex-shrink-0 mb-0.5"
            title="Attach file (or drag & drop)"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          />

          {/* Prompt */}
          <span className="text-ink-500 font-mono text-sm pb-2 select-none">❯</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            onPaste={onPaste}
            placeholder={engineRunning ? "Enter a prompt... (or drop files)" : "Start engine first..."}
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-ink-800 placeholder-ink-500 font-mono text-sm
              resize-none min-h-[36px] max-h-[200px] focus:outline-none py-2"
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
            }}
          />
          <button
            onClick={isStreaming ? undefined : send}
            disabled={isStreaming || (!input.trim() && attachments.length === 0)}
            className={clsx(
              "p-2 rounded-md transition-colors flex-shrink-0 mb-0.5",
              isStreaming
                ? "bg-err/10 text-err hover:bg-err/20"
                : (input.trim() || attachments.length > 0)
                ? "bg-ink-200 text-ink-800 hover:bg-ink-300 border border-ink-400"
                : "text-ink-500 cursor-not-allowed"
            )}
          >
            {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 pl-5">
          <span className="text-2xs text-ink-500 font-mono">
            {config.current_provider}/{config.current_model}
          </span>
          <span className="text-2xs text-ink-500 font-mono">
            {attachments.length > 0 && `${attachments.length} file${attachments.length > 1 ? "s" : ""} · `}
            {messages.length} messages
          </span>
        </div>
      </div>
    </div>
  );
}
