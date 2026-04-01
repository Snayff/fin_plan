import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Section } from "./Section";

export function SurplusSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [pct, setPct] = useState(settings?.surplusBenchmarkPct ?? 10);

  function handleSave() {
    updateSettings.mutate(
      { surplusBenchmarkPct: pct },
      { onSuccess: () => toast.success("Benchmark saved") }
    );
  }

  return (
    <Section id="surplus" title="Surplus benchmark">
      <p className="text-sm text-muted-foreground">
        Percentage of net income that should remain as surplus before a warning is shown.
      </p>
      <div className="flex items-center gap-2 max-w-sm">
        <label htmlFor="surplus-pct" className="sr-only">
          Surplus benchmark percentage
        </label>
        <Input
          id="surplus-pct"
          type="number"
          min={0}
          max={100}
          step={0.1}
          className="w-24"
          value={pct}
          onChange={(e) => setPct(parseFloat(e.target.value) || 0)}
        />
        <span className="text-sm">%</span>
      </div>
      <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving…" : "Save"}
      </Button>
    </Section>
  );
}
