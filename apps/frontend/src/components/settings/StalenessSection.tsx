import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StalenessThresholds } from "@finplan/shared";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Section } from "./Section";

const STALENESS_LABELS: Record<string, string> = {
  income_source: "Income sources",
  committed_bill: "Monthly bills",
  yearly_bill: "Yearly bills",
  discretionary_category: "Discretionary categories",
  savings_allocation: "Savings allocations",
  wealth_account: "Wealth accounts",
};

export function StalenessSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const defaults: StalenessThresholds = settings?.stalenessThresholds ?? {
    income_source: 12,
    committed_bill: 6,
    yearly_bill: 12,
    discretionary_category: 12,
    savings_allocation: 12,
    wealth_account: 3,
  };

  const [values, setValues] = useState<StalenessThresholds>(defaults);

  function handleSave() {
    updateSettings.mutate(
      { stalenessThresholds: values },
      { onSuccess: () => toast.success("Thresholds saved") }
    );
  }

  return (
    <Section id="staleness" title="Staleness thresholds">
      <p className="text-sm text-muted-foreground">
        Number of months before each item type is considered stale.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        {Object.entries(STALENESS_LABELS).map(([key, label]) => (
          <div key={key} className="space-y-1">
            <label htmlFor={`staleness-${key}`} className="text-xs text-muted-foreground">
              {label}
            </label>
            <Input
              id={`staleness-${key}`}
              type="number"
              min={1}
              value={values[key as keyof StalenessThresholds] ?? 12}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  [key as keyof StalenessThresholds]: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>
        ))}
      </div>
      <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving…" : "Save"}
      </Button>
    </Section>
  );
}
