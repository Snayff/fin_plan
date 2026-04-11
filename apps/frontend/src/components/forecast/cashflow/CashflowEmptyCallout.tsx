interface CashflowEmptyCalloutProps {
  variant: "no-accounts" | "no-income" | "no-spend";
}

const COPY: Record<CashflowEmptyCalloutProps["variant"], string> = {
  "no-accounts":
    "Cashflow is running from a £0 starting balance — link a Current or Savings account to anchor it to your real funds.",
  "no-income":
    "No income added yet — your projection has no inflows. Add income to see balance growth.",
  "no-spend":
    "No committed or discretionary spend yet — your projection has no outflows. Add bills and budgets to see the full shape.",
};

export function CashflowEmptyCallout({ variant }: CashflowEmptyCalloutProps) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 text-xs text-text-secondary">
      {COPY[variant]}
    </div>
  );
}
