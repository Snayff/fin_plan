type Props = { kind: "planned" | "spent"; amountOver: number };

export function OverBudgetSignal({ kind, amountOver }: Props) {
  if (amountOver <= 0) return null;
  const label = kind === "planned" ? "planned more than budget by" : "spent more than budget by";
  return (
    <div className="flex items-center gap-2 text-xs text-attention">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-attention" />
      <span>{`${label} £${amountOver.toLocaleString()}`}</span>
    </div>
  );
}
