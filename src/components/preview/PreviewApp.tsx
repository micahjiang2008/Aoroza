import { useState, useCallback, useRef, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { toast } from "sonner";
import { Editor, type PreviewModeData } from "../editor/Editor";
import * as filesService from "../../services/files";
import { XIcon } from "../icons";

interface PreviewAppProps {
  filePath: string;
}

// ── Helper components ──────────────────────────────────────────────────

function CloseButton() {
  return (
    <button
      onClick={() => getCurrentWindow().close().catch(console.error)}
      className="fixed top-3 right-3 z-50 w-8 h-8 flex items-center justify-center rounded-lg
        bg-bg/80 hover:bg-surface text-text-secondary hover:text-text
        border border-border/50 hover:border-border
        backdrop-blur-sm transition-colors cursor-pointer"
      title="Close (Cmd+W)"
    >
      <XIcon className="w-4 h-4 stroke-[2]" />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────

export function PreviewApp({ filePath }: PreviewAppProps) {
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [modified, setModified] = useState(0);
  const [hasExternalChanges, setHasExternalChanges] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const recentlySavedRef = useRef(false);

  useEffect(() => {
    filesService
      .readFileDirect(filePath)
      .then((result) => {
        setContent(result.content);
        setTitle(result.title);
        setModified(result.modified);
      })
      .catch((error) => {
        console.error("Failed to load file:", error);
        toast.error(`Failed to load file: ${error}`);
      });
  }, [filePath]);

  useEffect(() => {
    const handleFocus = async () => {
      if (recentlySavedRef.current) {
        recentlySavedRef.current = false;
        return;
      }
      try {
        const result = await filesService.readFileDirect(filePath);
        if (result.modified !== modified && content !== null) {
          setHasExternalChanges(true);
        }
      } catch {
        // File may have been deleted
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [filePath, modified, content]);

  const save = useCallback(
    async (newContent: string) => {
      try {
        const result = await filesService.saveFileDirect(filePath, newContent);
        recentlySavedRef.current = true;
        setModified(result.modified);
        setTitle(result.title);
        setHasExternalChanges(false);
      } catch (error) {
        console.error("Failed to save file:", error);
        toast.error(`Failed to save: ${error}`);
      }
    },
    [filePath],
  );

  const reload = useCallback(async () => {
    try {
      const result = await filesService.readFileDirect(filePath);
      setContent(result.content);
      setTitle(result.title);
      setModified(result.modified);
      setHasExternalChanges(false);
      setReloadVersion((v) => v + 1);
    } catch (error) {
      console.error("Failed to reload file:", error);
      toast.error(`Failed to reload: ${error}`);
    }
  }, [filePath]);

  useEffect(() => {
    const unlisten = listen<string>("preview-file-change", () => {
      setHasExternalChanges(true);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Keyboard shortcuts for preview mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modKey = e.metaKey || e.ctrlKey;

      // Cmd+Shift+Enter: Toggle focus mode
      if (modKey && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
        return;
      }

      // Cmd+Shift+M: Toggle markdown source mode
      if (modKey && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle-source-mode"));
        return;
      }

      // Cmd+R: Reload file from disk
      if (modKey && e.key === "r") {
        e.preventDefault();
        reload();
        return;
      }

      // Escape: Exit focus mode
      if (e.key === "Escape" && focusMode) {
        e.preventDefault();
        setFocusMode(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusMode, reload]);

  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  const handleSaveToFolder = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      await filesService.importFileToFolder(filePath);
      await getCurrentWindow().close();
    } catch (error) {
      console.error("Failed to save to folder:", error);
      toast.error(`Failed to save to folder: ${error}`);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [filePath]);

  const previewData: PreviewModeData = {
    content,
    title,
    filePath,
    modified,
    hasExternalChanges,
    reloadVersion,
    save,
    reload,
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-bg text-text">
      <CloseButton />
      <Editor
        focusMode={focusMode}
        previewMode={previewData}
        onSaveToFolder={handleSaveToFolder}
        saveToFolderDisabled={isSaving}
      />
    </div>
  );
}
