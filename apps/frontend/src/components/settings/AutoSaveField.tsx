import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AutoSaveStatus } from "@/hooks/useAutoSave";

interface AutoSaveFieldProps {
  label?: string;
  htmlFor?: string;
  status: AutoSaveStatus;
  errorMessage: string | null;
  children: ReactNode;
  className?: string;
  inline?: boolean;
}

export function AutoSaveField({
  label,
  htmlFor,
  status,
  errorMessage,
  children,
  className,
  inline = false,
}: AutoSaveFieldProps) {
  return (
    <div
      data-status={status}
      className={cn("flex flex-col gap-1.5 max-w-sm", className, "autosave-field")}
    >
      {!inline && label && (
        <div className="flex items-center gap-2 min-h-4">
          <label htmlFor={htmlFor} className="text-xs font-medium text-foreground/75">
            {label}
          </label>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="autosave-saved-flash text-[10.5px] font-medium text-success"
          >
            {status === "saved" ? "✓ saved" : ""}
          </span>
        </div>
      )}
      {inline && label && <span className="sr-only">{label}</span>}
      {children}
      {status === "error" && errorMessage && (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
