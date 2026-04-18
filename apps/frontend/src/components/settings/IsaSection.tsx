import { Input } from "@/components/ui/input";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useAutoSave } from "@/hooks/useAutoSave";
import { SettingsSection } from "./SettingsSection";
import { AutoSaveField } from "./AutoSaveField";

export function IsaSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const { value, setValue, status, errorMessage } = useAutoSave<number>({
    initialValue: settings?.isaAnnualLimit ?? 20000,
    onSave: async (next) => {
      await updateSettings.mutateAsync({ isaAnnualLimit: next });
    },
  });

  return (
    <SettingsSection id="isa" title="ISA settings">
      <AutoSaveField
        label="Annual limit (£)"
        htmlFor="isa-limit"
        status={status}
        errorMessage={errorMessage}
        className="max-w-xs"
      >
        <Input
          id="isa-limit"
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          aria-invalid={status === "error"}
        />
      </AutoSaveField>
    </SettingsSection>
  );
}
