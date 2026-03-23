interface NudgeCardProps {
  message: string;
  options?: string[];
  actionLabel?: string;
  onAction?: () => void;
}

export function NudgeCard({ message, options, actionLabel, onAction }: NudgeCardProps) {
  return (
    <div
      className="rounded-md p-3 text-xs space-y-2"
      style={{
        background: "rgba(245, 158, 11, 0.04)",
        border: "1px solid rgba(245, 158, 11, 0.08)",
      }}
    >
      <div className="flex items-start gap-1.5">
        <span
          className="mt-0.5 h-[5px] w-[5px] rounded-full shrink-0"
          style={{ background: "#f59e0b" }}
          aria-hidden
        />
        <p style={{ color: "inherit" }}>{message}</p>
      </div>
      {options && options.length > 0 && (
        <ul className="pl-4 space-y-0.5 list-disc" style={{ color: "inherit" }}>
          {options.map((opt) => (
            <li key={opt}>{opt}</li>
          ))}
        </ul>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="underline underline-offset-2 hover:no-underline text-xs"
          style={{ color: "#f59e0b" }}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
