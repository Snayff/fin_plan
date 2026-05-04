import { Input } from "@/components/ui/input";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { SettingsSection } from "./SettingsSection";
import { AutoSaveField } from "./AutoSaveField";
import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";
import { useAutoSave } from "@/hooks/useAutoSave";

export function SurplusSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const initial = settings?.surplusBenchmarkPct ?? 10;
  const { value, setValue, status, errorMessage } = useAutoSave<number>({
    initialValue: initial,
    onSave: async (next) => updateSettings.mutateAsync({ surplusBenchmarkPct: next }),
  });

  return (
    <SettingsSection
      id="surplus"
      title="Surplus benchmark"
      description={
        <>
          Percentage of <GlossaryTermMarker entryId="net-income">net income</GlossaryTermMarker>{" "}
          that should remain as <GlossaryTermMarker entryId="surplus">surplus</GlossaryTermMarker>{" "}
          before a <GlossaryTermMarker entryId="cashflow">cashflow</GlossaryTermMarker> attention is
          surfaced.
        </>
      }
    >
      <AutoSaveField
        label="Benchmark"
        htmlFor="surplus-pct"
        status={status}
        errorMessage={errorMessage}
      >
        <div className="flex items-center gap-2 max-w-sm">
          <Input
            id="surplus-pct"
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="w-24"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            aria-invalid={status === "error"}
          />
          <span className="text-sm">%</span>
        </div>
      </AutoSaveField>
    </SettingsSection>
  );
}
