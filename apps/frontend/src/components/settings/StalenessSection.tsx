import { Input } from "@/components/ui/input";
import type { StalenessThresholds } from "@finplan/shared";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { SettingsSection } from "./SettingsSection";
import { AutoSaveField } from "./AutoSaveField";
import { useAutoSave } from "@/hooks/useAutoSave";

// Labels adapted to match the actual StalenessThresholds keys from @finplan/shared
const LABELS: Record<keyof StalenessThresholds, string> = {
  income_source: "Income sources",
  committed_item: "Committed items",
  discretionary_item: "Discretionary items",
  asset_item: "Asset items",
  account_item: "Wealth accounts",
};

const DEFAULTS: Required<StalenessThresholds> = {
  income_source: 12,
  committed_item: 6,
  discretionary_item: 12,
  asset_item: 12,
  account_item: 3,
};

function ThresholdField({
  thresholdKey,
  current,
  onUpdate,
}: {
  thresholdKey: keyof StalenessThresholds;
  current: Required<StalenessThresholds>;
  onUpdate: (next: StalenessThresholds) => Promise<void>;
}) {
  const { value, setValue, status, errorMessage } = useAutoSave<number>({
    initialValue: current[thresholdKey],
    onSave: async (next) => onUpdate({ ...current, [thresholdKey]: next }),
  });
  return (
    <AutoSaveField
      label={LABELS[thresholdKey]}
      htmlFor={`staleness-${thresholdKey}`}
      status={status}
      errorMessage={errorMessage}
    >
      <Input
        id={`staleness-${thresholdKey}`}
        type="number"
        min={1}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10) || 1)}
        aria-invalid={status === "error"}
      />
    </AutoSaveField>
  );
}

export function StalenessSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  // Merge server values with defaults so all keys are always present
  const current: Required<StalenessThresholds> = {
    ...DEFAULTS,
    ...settings?.stalenessThresholds,
  };

  const save = async (next: StalenessThresholds) => {
    await updateSettings.mutateAsync({ stalenessThresholds: next });
  };

  return (
    <SettingsSection
      id="staleness"
      title="Staleness thresholds"
      description="Number of months before each item type is considered stale."
    >
      <div className="grid grid-cols-2 gap-3 max-w-lg">
        {(Object.keys(LABELS) as Array<keyof StalenessThresholds>).map((k) => (
          <ThresholdField key={k} thresholdKey={k} current={current} onUpdate={save} />
        ))}
      </div>
    </SettingsSection>
  );
}
