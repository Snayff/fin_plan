interface Props {
  onDismiss: () => void;
}

export function TipBanner({ onDismiss }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-foreground/10 bg-foreground/[0.02] px-4 py-3 text-sm text-text-secondary">
      <span className="flex-1">
        Start with your income — what arrives in your accounts each month.
      </span>
      <button
        type="button"
        aria-label="Dismiss tip"
        onClick={onDismiss}
        className="text-text-tertiary hover:text-text-secondary transition-colors text-xs"
      >
        ✕
      </button>
    </div>
  );
}
