import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { waterfallService } from "@/services/waterfall.service";
import { WATERFALL_KEYS } from "@/hooks/useWaterfall";
import { formatCurrency } from "@/utils/format";
import { MONTH_OPTIONS } from "./quick-picks";

interface TierAddFormProps {
  phase: "income" | "committed" | "discretionary";
  /** Pre-filled name from quick-pick chip click */
  prefillName: string | null;
  /** Whether we're in the savings sub-section of discretionary */
  isSavings?: boolean;
  /** Lock the frequency toggle for committed phase to a specific value */
  lockedFrequency?: "monthly" | "yearly";
}

export function TierAddForm({
  phase,
  prefillName,
  isSavings,
  lockedFrequency,
}: TierAddFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "yearly">(
    lockedFrequency ?? "monthly"
  );
  const [incomeFrequency, setIncomeFrequency] = useState<"monthly" | "annual" | "one_off">(
    "monthly"
  );
  const [dueMonth, setDueMonth] = useState(1);
  const [adding, setAdding] = useState(false);
  const lastPrefill = useRef<string | null>(null);

  // Consume prefill from quick-pick chips
  useEffect(() => {
    if (prefillName && prefillName !== lastPrefill.current && !adding) {
      lastPrefill.current = prefillName;
      setName(prefillName);
    }
  }, [prefillName, adding]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || !parsedAmount || parsedAmount <= 0) return;

    setAdding(true);
    try {
      if (phase === "income") {
        await waterfallService.createIncome({
          name: name.trim(),
          amount: parsedAmount,
          frequency: incomeFrequency,
        });
      } else if (phase === "committed") {
        if (frequency === "yearly") {
          await waterfallService.createYearly({
            name: name.trim(),
            amount: parsedAmount,
            dueMonth,
          });
        } else {
          await waterfallService.createCommitted({
            name: name.trim(),
            amount: parsedAmount,
          });
        }
      } else if (phase === "discretionary") {
        if (isSavings) {
          await waterfallService.createSavings({
            name: name.trim(),
            monthlyAmount: parsedAmount,
          });
        } else {
          await waterfallService.createDiscretionary({
            name: name.trim(),
            monthlyBudget: parsedAmount,
          });
        }
      }

      void queryClient.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
      setName("");
      setAmount("");
      setFrequency("monthly");
      setDueMonth(1);
    } catch {
      toast.error("Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  const amountLabel =
    phase === "income"
      ? incomeFrequency === "annual"
        ? "Annual amount (£)"
        : "Monthly amount (£)"
      : phase === "committed" && frequency === "yearly"
        ? "Annual amount (£)"
        : isSavings
          ? "Monthly amount (£)"
          : "Monthly budget (£)";

  const parsedPreview = parseFloat(amount) || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-dashed p-3 mt-2">
      {/* Name */}
      <Input
        placeholder={isSavings ? "Savings name…" : "Item name…"}
        aria-label={isSavings ? "Savings name" : "Item name"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 text-sm"
        autoFocus
      />

      {/* Frequency toggle for committed tier (hidden when frequency is locked) */}
      {phase === "committed" && !lockedFrequency && (
        <div role="group" aria-label="Frequency" className="flex gap-1">
          <button
            type="button"
            aria-pressed={frequency === "monthly"}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              frequency === "monthly"
                ? "bg-tier-committed/15 text-tier-committed font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setFrequency("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={frequency === "yearly"}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              frequency === "yearly"
                ? "bg-tier-committed/15 text-tier-committed font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setFrequency("yearly")}
          >
            Yearly
          </button>
        </div>
      )}

      {/* Frequency toggle for income tier */}
      {phase === "income" && (
        <div role="group" aria-label="Frequency" className="flex gap-1">
          {(["monthly", "annual", "one_off"] as const).map((freq) => (
            <button
              key={freq}
              type="button"
              aria-pressed={incomeFrequency === freq}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                incomeFrequency === freq
                  ? "bg-tier-income/15 text-tier-income font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setIncomeFrequency(freq)}
            >
              {freq === "monthly" ? "Monthly" : freq === "annual" ? "Annual" : "One-off"}
            </button>
          ))}
        </div>
      )}

      {/* Amount + due month */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            placeholder={amountLabel}
            aria-label={amountLabel}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            className="h-8 text-sm font-mono"
          />
        </div>
        {phase === "committed" && frequency === "yearly" && (
          <select
            aria-label="Month due"
            value={dueMonth}
            onChange={(e) => setDueMonth(parseInt(e.target.value))}
            className="rounded border px-2 py-1 text-xs bg-background"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Monthly equivalent preview for yearly/annual */}
      {parsedPreview > 0 &&
        ((phase === "committed" && frequency === "yearly") ||
          (phase === "income" && incomeFrequency === "annual")) && (
          <p role="status" className="text-xs text-muted-foreground">
            ≈ {formatCurrency(parsedPreview / 12)}/mo
          </p>
        )}

      <Button type="submit" size="sm" disabled={adding || !name.trim() || !parseFloat(amount)}>
        {adding ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
