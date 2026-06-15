import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PiIcon, SpinnerIcon, CheckIcon } from "../icons";
import * as appService from "../../services/app";

export function ToolsSettingsSection() {
  const [piAvailable, setPiAvailable] = useState<boolean | null>(null);
  const [piVersion, setPiVersion] = useState<string | null>(null);

  useEffect(() => {
    appService
      .checkPi()
      .then((ok) => {
        setPiAvailable(ok);
        if (ok) {
          appService.getPiVersion().then(setPiVersion).catch(() => {});
        }
      })
      .catch(() => setPiAvailable(false));
  }, []);

  const handleCheck = async () => {
    setPiAvailable(null);
    try {
      const ok = await appService.checkPi();
      setPiAvailable(ok);
      toast.success(ok ? "Pi detected" : "Pi not found");
        if (ok) {
          appService.getPiVersion().then(setPiVersion).catch(() => {});
        } else {
          setPiVersion(null);
        }
    } catch {
      setPiAvailable(false);
      toast.error("Detection failed");
    }
  };

  return (
    <div className="space-y-8 py-8">
      <section>
        <h2 className="text-xl font-medium mb-0.5">AI Tools</h2>
        <p className="text-sm text-text-muted mb-4">
          Use AI assistant for inline text generation
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-[10px] border border-border">
            <div className="flex items-center gap-2.5">
              <PiIcon className="w-4.5 h-4.5 text-text-muted" />
              <div>
                <span className="text-sm font-medium">
                  Pi Coding Agent
                  {piVersion !== null ? (
                    <span className="text-text-muted font-normal"> ({piVersion})</span>
                  ) : (
                    <SpinnerIcon className="w-3 h-3 animate-spin inline-block ml-1.5 text-text-muted" />
                  )}
                </span>
              </div>
            </div>
            {piAvailable === null ? (
              <span className="flex items-center gap-1.5 text-sm text-text-muted">
                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                Detecting…
              </span>
            ) : piAvailable ? (
              <span className="flex items-center gap-1.5 text-sm text-text-muted">
                Installed
                <span className="h-4.5 w-4.5 bg-bg-emphasis rounded-full flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 stroke-[2.2]" />
                </span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-500">Not detected</span>
                <button
                  onClick={handleCheck}
                  className="text-xs text-text-muted hover:text-text underline cursor-pointer"
                >
                  Recheck
                </button>
              </div>
            )}
          </div>

          {piAvailable && (
            <div className="text-sm space-y-1 p-3 bg-bg-muted rounded-md">
              <span className="font-medium text-text">How to use</span>
              <ul className="text-text-muted list-disc pl-5 space-y-0.5 mt-1">
                <li>
                  Open via "Edit with Pi" in the command palette
                </li>
                <li>Select text before opening to use it as AI context</li>
                <li>Insert generated text at cursor or replace current selection</li>
              </ul>
            </div>
          )}

          {piAvailable === false && (
            <div className="text-sm p-3 bg-orange-500/10 rounded-md">
              <p className="font-medium text-orange-700 dark:text-orange-400">
                Pi not installed
              </p>
              <p className="text-orange-700/80 dark:text-orange-400/80 mt-0.5">
                Run{" "}
                <code className="font-mono text-xs bg-orange-500/10 px-1.5 py-0.5 rounded">
                  npm install -g @earendil-works/pi-coding-agent
                </code>{" "}
                in your terminal, then recheck.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
