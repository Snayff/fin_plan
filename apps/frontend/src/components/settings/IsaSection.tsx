import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Section } from "./Section";

export function IsaSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [limit, setLimit] = useState(settings?.isaAnnualLimit ?? 20000);

  function handleSave() {
    updateSettings.mutate(
      { isaAnnualLimit: limit },
      { onSuccess: () => toast.success("ISA settings saved") }
    );
  }

  return (
    <Section id="isa" title="ISA settings">
      <div className="max-w-xs space-y-1">
        <label htmlFor="isa-limit" className="text-xs text-muted-foreground">
          Annual limit (£)
        </label>
        <Input
          id="isa-limit"
          type="number"
          min={0}
          value={limit}
          onChange={(e) => setLimit(parseFloat(e.target.value) || 0)}
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving…" : "Save"}
      </Button>
    </Section>
  );
}
