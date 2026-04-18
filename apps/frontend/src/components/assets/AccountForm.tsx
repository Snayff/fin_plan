import { useState } from "react";
import type { AccountType } from "@finplan/shared";
import { useHouseholdMembers, useSettings } from "../../hooks/useSettings.js";
import { formatCurrency } from "@/utils/format";

const GROWTH_RATE_SETTING_KEY: Partial<
  Record<AccountType, "currentRatePct" | "savingsRatePct" | "investmentRatePct" | "pensionRatePct">
> = {
  Current: "currentRatePct",
  Savings: "savingsRatePct",
  StocksAndShares: "investmentRatePct",
  Pension: "pensionRatePct",
};

interface Props {
  mode: "add" | "edit";
  type: AccountType;
  initialName?: string;
  initialMemberId?: string | null;
  initialGrowthRatePct?: number | null;
  isSaving?: boolean;
  isSavingConfirm?: boolean;
  isStale?: boolean;
  onSave: (data: {
    name: string;
    memberId: string | null;
    growthRatePct: number | null;
    initialValue?: number;
  }) => void;
  onCancel: () => void;
  onDeleteRequest?: () => void;
  onConfirm?: () => void;
}

const labelClass = "text-text-muted uppercase tracking-[0.07em] text-[10px]";
const inputClass =
  "rounded-md border border-foreground/10 bg-foreground/[0.04] px-3 py-1.5 text-sm text-text-secondary placeholder:italic placeholder:text-text-muted focus:outline-none focus:border-page-accent/60";

export function AccountForm({
  mode,
  type,
  initialName = "",
  initialMemberId = null,
  initialGrowthRatePct = null,
  isSaving,
  isSavingConfirm,
  isStale,
  onSave,
  onCancel,
  onDeleteRequest,
  onConfirm,
}: Props) {
  const [name, setName] = useState(initialName);
  const [memberId, setMemberId] = useState<string | null>(initialMemberId);
  const [growthRatePct, setGrowthRatePct] = useState(
    initialGrowthRatePct != null ? initialGrowthRatePct.toString() : ""
  );
  const [initialValue, setInitialValue] = useState<string>("");
  const [valueFocused, setValueFocused] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  const { data: members } = useHouseholdMembers();
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;

  const displayValue =
    !valueFocused && initialValue
      ? (() => {
          const n = parseFloat(initialValue.replace(/[£,\s]/g, ""));
          return isNaN(n) ? initialValue : formatCurrency(n, showPence);
        })()
      : initialValue;

  function parseValue(raw: string): number {
    return parseFloat(raw.replace(/[£,\s]/g, ""));
  }

  const settingKey = GROWTH_RATE_SETTING_KEY[type];
  const defaultRate =
    settingKey && settings ? (settings as Record<string, unknown>)[settingKey] : null;
  const rateLabel =
    defaultRate != null ? `Default: ${String(defaultRate)}%` : "No household default set";

  function handleSave() {
    let valid = true;

    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    } else {
      setNameError(null);
    }

    const parsedRate = growthRatePct !== "" ? parseFloat(growthRatePct) : null;
    if (parsedRate !== null && (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100)) {
      setRateError("Must be between 0 and 100");
      valid = false;
    } else {
      setRateError(null);
    }

    if (!valid) return;
    const parsedValue = initialValue.trim() === "" ? undefined : parseValue(initialValue);
    onSave({
      name: name.trim(),
      memberId,
      growthRatePct: parsedRate,
      ...(mode === "add" && parsedValue !== undefined && !isNaN(parsedValue)
        ? { initialValue: parsedValue }
        : {}),
    });
  }

  return (
    <div className="border-t border-foreground/5 bg-foreground/[0.02] py-3 pr-4 flex flex-col gap-3 border-l-2 border-page-accent pl-[30px]">
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelClass}>
            Name <span className="text-text-muted">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Vanguard SIPP"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            aria-label="Name"
            className={[inputClass, nameError ? "border-amber-400/60" : ""].join(" ")}
          />
          {nameError && <p className="-mt-0.5 text-xs text-amber-400">{nameError}</p>}
        </div>

        {/* Current value (add mode only) */}
        {mode === "add" && (
          <div className="col-span-2 flex flex-col gap-1">
            <label className={labelClass}>Current value</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="£0.00"
              value={displayValue}
              onChange={(e) => setInitialValue(e.target.value)}
              onFocus={() => setValueFocused(true)}
              onBlur={() => setValueFocused(false)}
              aria-label="Current value"
              className={[inputClass, "font-numeric"].join(" ")}
            />
            <p className="text-[11px] text-text-muted">Optional — leave blank to record later.</p>
          </div>
        )}

        {/* Assigned to */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelClass}>Assigned to</label>
          <select
            value={memberId ?? ""}
            onChange={(e) => setMemberId(e.target.value || null)}
            aria-label="Assigned to"
            className={inputClass}
          >
            <option value="">Household</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName}
              </option>
            ))}
          </select>
        </div>

        {/* Growth rate override */}
        {settingKey && (
          <div className="col-span-2 flex flex-col gap-1">
            <label className={labelClass}>Growth rate override (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={growthRatePct}
              onChange={(e) => {
                setGrowthRatePct(e.target.value);
                setRateError(null);
              }}
              placeholder={rateLabel}
              aria-label="Growth rate override"
              className={[inputClass, rateError ? "border-amber-400/60" : ""].join(" ")}
            />
            {rateError ? (
              <p className="-mt-0.5 text-xs text-amber-400">{rateError}</p>
            ) : (
              <p className="text-[11px] text-text-muted">
                Leave blank to use household default ({rateLabel})
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-foreground/10 px-3 py-1 text-xs text-text-tertiary hover:bg-foreground/5 transition-colors"
        >
          Cancel
        </button>

        <span className="flex-1" />

        {mode === "edit" && onDeleteRequest && (
          <button
            type="button"
            onClick={onDeleteRequest}
            className="text-xs text-text-muted hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
        {mode === "edit" && onConfirm && isStale && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSavingConfirm}
            className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400 hover:bg-teal-500/20 transition-colors disabled:opacity-40"
          >
            Still correct ✓
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="rounded-md px-3 py-1 text-xs font-medium transition-colors bg-page-accent/20 text-page-accent hover:bg-page-accent/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
