import type { ReactNode } from "react";
import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";

interface CashflowEmptyCalloutProps {
  variant: "no-accounts" | "no-income" | "no-spend";
}

const COPY: Record<CashflowEmptyCalloutProps["variant"], ReactNode> = {
  "no-accounts": (
    <>
      <GlossaryTermMarker entryId="cashflow">Cashflow</GlossaryTermMarker> is running from a £0
      starting balance — <GlossaryTermMarker entryId="linked-account">link</GlossaryTermMarker> a
      Current or Savings account to anchor it to your real funds.
    </>
  ),
  "no-income": (
    <>
      No income added yet — your{" "}
      <GlossaryTermMarker entryId="projection">projection</GlossaryTermMarker> has no inflows. Add
      income to see balance growth.
    </>
  ),
  "no-spend": (
    <>
      No committed or discretionary spend yet — your{" "}
      <GlossaryTermMarker entryId="projection">projection</GlossaryTermMarker> has no outflows. Add
      bills and budgets to see the full shape.
    </>
  ),
};

export function CashflowEmptyCallout({ variant }: CashflowEmptyCalloutProps) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 text-xs text-text-secondary">
      {COPY[variant]}
    </div>
  );
}
