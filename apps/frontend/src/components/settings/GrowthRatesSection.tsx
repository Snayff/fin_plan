import { useState } from "react";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings.js";
import type { UpdateSettingsInput } from "@finplan/shared";

export function GrowthRatesSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const settingsRecord = settings as Record<string, unknown> | undefined;

  const [current, setCurrent] = useState<string>(
    settingsRecord?.currentRatePct != null ? String(settingsRecord.currentRatePct) : ""
  );
  const [savings, setSavings] = useState<string>(
    settingsRecord?.savingsRatePct != null ? String(settingsRecord.savingsRatePct) : ""
  );
  const [investment, setInvestment] = useState<string>(
    settingsRecord?.investmentRatePct != null ? String(settingsRecord.investmentRatePct) : ""
  );
  const [pension, setPension] = useState<string>(
    settingsRecord?.pensionRatePct != null ? String(settingsRecord.pensionRatePct) : ""
  );
  const [inflation, setInflation] = useState<string>(
    settingsRecord?.inflationRatePct != null ? String(settingsRecord.inflationRatePct) : "2.5"
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const toNum = (s: string) => (s !== "" ? parseFloat(s) : null);
    const inflationNum = inflation !== "" ? parseFloat(inflation) : 2.5;
    if (
      [current, savings, investment, pension].some(
        (s) => s !== "" && (isNaN(parseFloat(s)) || parseFloat(s) < 0 || parseFloat(s) > 100)
      )
    ) {
      setError("Rates must be between 0 and 100");
      return;
    }
    try {
      await updateSettings.mutateAsync({
        currentRatePct: toNum(current),
        savingsRatePct: toNum(savings),
        investmentRatePct: toNum(investment),
        pensionRatePct: toNum(pension),
        inflationRatePct: inflationNum,
      } as UpdateSettingsInput);
      setSaved(true);
    } catch {
      setError("Failed to save growth rates.");
    }
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-[rgba(238,242,255,0.65)] uppercase tracking-wider">
        Growth Rates
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Default current account rate (%)", value: current, onChange: setCurrent },
          { label: "Default savings rate (%)", value: savings, onChange: setSavings },
          { label: "Default investment rate (%)", value: investment, onChange: setInvestment },
          { label: "Default pension rate (%)", value: pension, onChange: setPension },
          {
            label: "Inflation rate (%)",
            value: inflation,
            onChange: setInflation,
            placeholder: "2.5",
          },
        ].map(({ label, value, onChange, placeholder }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-[rgba(238,242,255,0.4)]">
              {label}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? "Not set"}
              className="bg-[rgba(238,242,255,0.04)] border border-[#1a1f35] rounded-md px-3 py-2 text-sm text-[rgba(238,242,255,0.92)] placeholder:text-[rgba(238,242,255,0.2)] focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {saved && <p className="text-green-400 text-xs">Saved.</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 rounded-md px-4 py-1.5 text-sm text-white font-medium transition-colors"
        >
          {updateSettings.isPending ? "Saving…" : "Save Growth Rates"}
        </button>
      </div>
    </form>
  );
}
