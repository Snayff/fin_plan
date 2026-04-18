import { Input } from "@/components/ui/input";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useAutoSave } from "@/hooks/useAutoSave";
import { SettingsSection } from "./SettingsSection";
import { AutoSaveField } from "./AutoSaveField";

interface RateValues {
  currentRatePct: number;
  savingsRatePct: number;
  investmentRatePct: number;
  pensionRatePct: number;
  inflationRatePct: number;
}

const DEFAULTS: RateValues = {
  currentRatePct: 0,
  savingsRatePct: 4,
  investmentRatePct: 7,
  pensionRatePct: 6,
  inflationRatePct: 2.5,
};

const LABELS: Record<keyof RateValues, string> = {
  currentRatePct: "Default current account rate (%)",
  savingsRatePct: "Default savings rate (%)",
  investmentRatePct: "Default investment rate (%)",
  pensionRatePct: "Default pension rate (%)",
  inflationRatePct: "Inflation rate (%)",
};

function RateField({
  rateKey,
  current,
  onUpdate,
}: {
  rateKey: keyof RateValues;
  current: RateValues;
  onUpdate: (next: RateValues) => Promise<void>;
}) {
  const { value, setValue, status, errorMessage } = useAutoSave<number>({
    initialValue: current[rateKey],
    onSave: async (next) => onUpdate({ ...current, [rateKey]: next }),
  });

  return (
    <AutoSaveField
      label={LABELS[rateKey]}
      htmlFor={`rate-${rateKey}`}
      status={status}
      errorMessage={errorMessage}
    >
      <Input
        id={`rate-${rateKey}`}
        type="number"
        step={0.1}
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
        aria-invalid={status === "error"}
      />
    </AutoSaveField>
  );
}

export function GrowthRatesSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const current: RateValues = {
    currentRatePct: settings?.currentRatePct ?? DEFAULTS.currentRatePct,
    savingsRatePct: settings?.savingsRatePct ?? DEFAULTS.savingsRatePct,
    investmentRatePct: settings?.investmentRatePct ?? DEFAULTS.investmentRatePct,
    pensionRatePct: settings?.pensionRatePct ?? DEFAULTS.pensionRatePct,
    inflationRatePct: settings?.inflationRatePct ?? DEFAULTS.inflationRatePct,
  };

  const save = async (next: RateValues) => {
    await updateSettings.mutateAsync(next);
  };

  return (
    <SettingsSection
      id="growth-rates"
      title="Growth rates"
      description="Default annual growth rates used for projections."
    >
      <div className="grid grid-cols-2 gap-3 max-w-lg">
        {(Object.keys(LABELS) as Array<keyof RateValues>).map((k) => (
          <RateField key={k} rateKey={k} current={current} onUpdate={save} />
        ))}
      </div>
    </SettingsSection>
  );
}
