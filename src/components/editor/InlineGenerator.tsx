import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { inlineGenerate } from "../../services/app";
import { SparkleIcon, SpinnerIcon } from "../icons";

interface InlineGeneratorProps {
  editor: TiptapEditor;
  open: boolean;
  cwd?: string;
  onClose: () => void;
}

interface DebugPayload {
  msg: string;
}

export function InlineGenerator({
  editor,
  open,
  cwd = ".",
  onClose,
}: InlineGeneratorProps) {
  const [input, setInput] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetCursorRef = useRef<number>(0);
  const selectionFromRef = useRef<number>(0);
  const selectionToRef = useRef<number>(0);
  const selectedTextRef = useRef("");

  const unlistenRef = useRef<UnlistenFn[]>([]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    const { from, to } = editor.state.selection;
    targetCursorRef.current = from;
    selectedTextRef.current = "";
    selectionFromRef.current = from;
    selectionToRef.current = to;

    if (from !== to) {
      selectedTextRef.current = editor.state.doc.textBetween(from, to, "\n");
      selectionFromRef.current = from;
      selectionToRef.current = to;
    }

    setInput("");
    setGeneratedText("");
    setIsGenerating(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      unlistenRef.current.forEach((fn) => fn());
      unlistenRef.current = [];
    };
  }, []);

  // Global Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isGenerating) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, isGenerating, onClose]);

  // Global Enter to insert
  useEffect(() => {
    if (!open || isGenerating || !generatedText) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        doInsert();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, isGenerating, generatedText]);

  const submit = useCallback(async () => {
    const userInput = input.trim();
    if (!userInput || isGenerating) return;

    setIsGenerating(true);
    setGeneratedText("");

    let message = userInput;
    if (selectedTextRef.current) {
      message = `用户选中了以下文本作为参考上下文：\n\n---\n${selectedTextRef.current}\n---\n\n请根据以上上下文，执行以下指令：${userInput}`;
    }
    message +=
      "\n\n直接输出生成结果。格式紧凑，不使用不必要的标题、列表、引用和其他复杂格式。不要反问用户、不要请求用户做选择、不要等待用户确认。";

    try {
      const unDebug = await listen<DebugPayload>("inline:debug", () => {});
      unlistenRef.current = [unDebug];

      const text = await inlineGenerate(message, cwd);
      setGeneratedText(text);
      setIsGenerating(false);
    } catch (err) {
      toast.error(String(err));
      setIsGenerating(false);
    }
  }, [input, isGenerating, cwd]);

  const doInsert = useCallback(() => {
    if (!generatedText) return;
    const pos = targetCursorRef.current;
    editor
      .chain()
      .focus()
      .insertContentAt(pos, generatedText)
      .setTextSelection({ from: pos, to: pos + generatedText.length })
      .run();
    onClose();
  }, [generatedText, editor, onClose]);

  const doReplace = useCallback(() => {
    if (!generatedText) return;
    const from = selectionFromRef.current;
    const to = selectionToRef.current;
    if (from !== to) {
      const current = editor.state.doc.textBetween(from, to, "\n");
      if (current === selectedTextRef.current || current.trim() === selectedTextRef.current) {
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, generatedText)
          .setTextSelection({ from, to: from + generatedText.length })
          .run();
        onClose();
        return;
      }
    }
    doInsert();
  }, [generatedText, editor, onClose, doInsert]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (generatedText && !isGenerating) doInsert();
        else submit();
      }
    },
    [generatedText, isGenerating, doInsert, submit],
  );

  const truncatedSelection = selectedTextRef.current
    ? selectedTextRef.current.replace(/\s+/g, " ").trim().slice(0, 30) +
      (selectedTextRef.current.length > 30 ? "…" : "")
    : null;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center py-11 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-bg rounded-xl shadow-2xl overflow-hidden border border-border animate-slide-down">
        {/* Input */}
        <div className="border-b border-border">
          <div className="flex items-center gap-3 px-4.5 py-3.5">
            <SparkleIcon className="w-5 h-5 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你想让 AI 生成的内容…"
              disabled={isGenerating}
              readOnly={!!generatedText}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="flex-1 text-[17px] bg-transparent outline-none text-text placeholder:text-text-muted/50 disabled:opacity-50"
            />
            {isGenerating && (
              <SpinnerIcon className="w-5 h-5 animate-spin text-text-muted shrink-0" />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4.5 space-y-3">
          {isGenerating ? (
            <div className="text-sm text-text-muted">
              Pi 正在处理中…
            </div>
          ) : generatedText ? (
            <>
              <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-bg-secondary p-3 text-sm text-text whitespace-pre-wrap leading-relaxed">
                {generatedText}
              </div>
              <div className="w-full flex justify-between">
                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                  <kbd className="text-xs px-1.5 py-0.5 rounded-md bg-bg-muted text-text-muted">
                    Enter
                  </kbd>
                  <span>插入</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTextRef.current && (
                    <button
                      onClick={doReplace}
                      className="px-3 py-1.5 text-xs font-medium bg-bg-muted text-text hover:bg-bg-emphasis rounded-md transition-colors cursor-pointer"
                    >
                      替换选区
                    </button>
                  )}
                  <button
                    onClick={doInsert}
                    className="px-3 py-1.5 text-xs font-medium bg-accent text-text-inverse hover:bg-accent/85 rounded-md transition-colors cursor-pointer"
                  >
                    插入
                  </button>
                </div>
              </div>
            </>
          ) : truncatedSelection ? (
            <div className="text-sm p-3 bg-bg-muted rounded-md">
              <div className="font-medium text-text mb-1">
                已选中上下文
              </div>
              <div className="text-text-muted text-xs truncate">
                {truncatedSelection}
              </div>
            </div>
          ) : null}

          {!generatedText && !isGenerating && (
            <div className="w-full flex justify-between">
              <div className="flex items-center gap-1.5 text-sm text-text-muted">
                <kbd className="text-xs px-1.5 py-0.5 rounded-md bg-bg-muted text-text-muted">
                  Esc
                </kbd>
                <span>关闭</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-text-muted">
                <kbd className="text-xs px-1.5 py-0.5 rounded-md bg-bg-muted text-text-muted">
                  Enter
                </kbd>
                <span>提交</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
