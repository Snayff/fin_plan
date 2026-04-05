import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/utils/format";
import type { TierConfig } from "./tierConfig";
import type { SpendType } from "./formatAmount";

interface SubcategoryOption {
  id: string;
  name: string;
}

interface ItemData {
  name: string;
  amount: number;
  spendType: SpendType;
  subcategoryId: string;
  notes: string | null;
}

interface ItemPeriod {
  id: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  amount: number;
}

interface EditItem extends ItemData {
  id: string;
  lastReviewedAt: Date;
  periods?: ItemPeriod[];
}

type AddModeProps = {
  mode: "add";
  item?: undefined;
  onConfirm?: undefined;
  onDelete?: undefined;
  isStale?: undefined;
};

type EditModeProps = {
  mode: "edit";
  item: EditItem;
  onConfirm: () => void;
  onDelete: () => void;
  isStale: boolean;
};

type Props = (AddModeProps | EditModeProps) & {
  config: TierConfig;
  subcategories: SubcategoryOption[];
  initialSubcategoryId: string;
  onSave: (data: ItemData) => void;
  onCancel: () => void;
  isSaving?: boolean;
  onDeletePeriod?: (periodId: string) => void;
  onAddPeriod?: () => void;
};

export default function ItemForm({
  mode,
  item,
  config,
  subcategories,
  initialSubcategoryId,
  onSave,
  onCancel,
  onConfirm,
  onDelete,
  isSaving,
  isStale,
  onDeletePeriod,
  onAddPeriod,
}: Props) {
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item?.amount?.toString() ?? "");
  const [spendType, setSpendType] = useState<SpendType>(item?.spendType ?? "monthly");
  const [subcategoryId, setSubcategoryId] = useState(item?.subcategoryId ?? initialSubcategoryId);
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [amountFocused, setAmountFocused] = useState(false);

  const displayAmount =
    !amountFocused && amount
      ? (() => {
          const n = parseFloat(amount);
          return isNaN(n) ? amount : formatCurrency(n);
        })()
      : amount;

  function parseAmount(raw: string): number {
    return parseFloat(raw.replace(/[£,\s]/g, ""));
  }

  function handleSave() {
    const parsed = parseAmount(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAmountError("Amount must be greater than 0");
      return;
    }
    setAmountError(null);
    onSave({
      name: name.trim(),
      amount: parsed,
      spendType,
      subcategoryId,
      notes: notes.trim() || null,
    });
  }

  const labelClass = "text-text-muted uppercase tracking-[0.07em] text-[10px]";
  const inputClass =
    "rounded-md border border-foreground/10 bg-foreground/[0.04] px-3 py-1.5 text-sm text-text-secondary placeholder:italic placeholder:text-text-muted focus:outline-none focus:border-page-accent/60";

  return (
    <div
      className={[
        "border-t border-foreground/5 bg-foreground/[0.02] py-3 pr-4 flex flex-col gap-3",
        `border-l-2 ${config.borderClass}`,
        "pl-[30px]",
      ].join(" ")}
    >
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelClass}>
            Name <span className="text-text-muted">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Netflix, Council Tax"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Name"
            autoFocus={mode === "add"}
            className={`${inputClass} col-span-2`}
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            Amount <span className="text-text-muted">*</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={displayAmount}
            onChange={(e) => {
              setAmount(e.target.value);
              setAmountError(null);
            }}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            aria-label="Amount"
            className={[
              inputClass,
              "font-numeric",
              amountError ? "border-amber-400/60 focus:border-amber-400" : "",
            ].join(" ")}
          />
          {amountError && <p className="-mt-0.5 text-xs text-amber-400">{amountError}</p>}
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Frequency</label>
          <Select value={spendType} onValueChange={(v) => setSpendType(v as SpendType)}>
            <SelectTrigger
              aria-label="Spend type"
              className="h-auto rounded-md border-foreground/10 bg-foreground/[0.04] py-1.5 text-sm focus:ring-page-accent/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="one_off">One-off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelClass}>Category</label>
          <Select value={subcategoryId} onValueChange={setSubcategoryId}>
            <SelectTrigger
              aria-label="Subcategory"
              className="h-auto rounded-md border-foreground/10 bg-foreground/[0.04] py-1.5 text-sm focus:ring-page-accent/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelClass}>Notes</label>
          <textarea
            placeholder="Any details worth remembering"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Notes"
            rows={2}
            maxLength={500}
            className={`${inputClass} w-full resize-none`}
          />
        </div>

        {/* Period editor — edit mode only */}
        {mode === "edit" && item?.periods && item.periods.length > 0 && (
          <div className="col-span-2 flex flex-col gap-1">
            <label className={labelClass}>Value History</label>
            <div className="flex flex-col gap-1">
              {item.periods.map((period) => {
                const now = new Date();
                const startDate = new Date(period.startDate);
                const endDate = period.endDate ? new Date(period.endDate) : null;
                const isCurrent = startDate <= now && (endDate === null || endDate > now);
                const isFuture = startDate > now;
                return (
                  <div
                    key={period.id}
                    className={[
                      "flex items-center gap-3 px-3 py-2 rounded-md border",
                      isCurrent
                        ? "bg-surface-elevated border-surface-elevated-border"
                        : "bg-surface border-surface-border",
                    ].join(" ")}
                  >
                    <span className="font-numeric text-xs text-text-tertiary min-w-[80px]">
                      {startDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </span>
                    <span className="font-numeric text-sm text-text-secondary min-w-[70px]">
                      £{period.amount.toFixed(2)}
                    </span>
                    {isCurrent && (
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-[0.06em] ${config?.textClass ?? "text-text-secondary"} opacity-70`}
                      >
                        Current
                      </span>
                    )}
                    {isFuture && (
                      <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                        Scheduled
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeletePeriod?.(period.id)}
                      aria-label={`Remove period from ${startDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`}
                      className="ml-auto text-xs text-text-muted hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onAddPeriod}
              className="mt-1 rounded-md border border-dashed border-surface-border px-3.5 py-1.5 text-xs text-text-tertiary hover:text-text-secondary hover:border-surface-elevated-border transition-colors"
            >
              + Add period
            </button>
          </div>
        )}
      </div>

      {/* Actions: Cancel · [spacer] · Delete · Still correct · Save */}
      <div className="flex items-center gap-2" data-testid="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-foreground/10 px-3 py-1 text-xs text-text-tertiary hover:bg-foreground/5 transition-colors"
        >
          Cancel
        </button>

        <span className="flex-1" />

        {mode === "edit" && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-text-muted hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
        {mode === "edit" && onConfirm && isStale && (
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400 hover:bg-teal-500/20 transition-colors"
          >
            Still correct ✓
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className={[
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            "bg-page-accent/20 text-page-accent hover:bg-page-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-40",
          ].join(" ")}
        >
          Save
        </button>
      </div>
    </div>
  );
}
