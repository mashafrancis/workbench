import { Loader2, RefreshCcw, Settings as SettingsIcon, X } from "lucide-react";
import { dismissToast, useToasts } from "../lib/toasts";

interface TitleBarProps {
  /** Optional right-side label, e.g. "Connected · 7 queues" */
  status?: string;
  onSwitchConnection?: () => void;
  onOpenSettings?: () => void;
  busy?: boolean;
}

/**
 * Overlay title bar used on every screen. On macOS the native traffic lights
 * are offset to align with the wordmark via `trafficLightPosition` in
 * `tauri.conf.json`. The full 40 px height is drag-region so the user can
 * grab anywhere outside interactive elements.
 */
export function TitleBar({
  status,
  onSwitchConnection,
  onOpenSettings,
  busy,
}: TitleBarProps): JSX.Element {
  const toasts = useToasts();

  return (
    <div className="titlebar-drag flex h-10 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2 pl-16 md:pl-20">
        <Wordmark />
      </div>
      <div className="titlebar-no-drag flex items-center gap-2">
        {busy && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
        {status && (
          <span className="text-xs text-muted-foreground">{status}</span>
        )}
        {onSwitchConnection && (
          <button
            type="button"
            onClick={onSwitchConnection}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <RefreshCcw className="mr-1 inline size-3" />
            Switch
          </button>
        )}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Settings"
          >
            <SettingsIcon className="size-3.5" />
          </button>
        )}
      </div>
      {toasts.length > 0 && (
        <div className="titlebar-no-drag absolute right-3 top-12 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex w-80 items-start gap-3 rounded-lg border border-border bg-background p-3 shadow-lg"
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{t.title}</div>
                {t.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t.description}
                  </div>
                )}
                {t.action && (
                  <button
                    type="button"
                    onClick={t.action.onClick}
                    className="mt-2 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              {t.dismissible !== false && (
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="text-muted-foreground transition hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Wordmark(): JSX.Element {
  return (
    <span className="flex select-none items-center gap-2 text-sm font-semibold tracking-tight">
      <img src="/icon.svg" alt="" className="h-4 w-4 shrink-0" />
      Workbench
    </span>
  );
}
