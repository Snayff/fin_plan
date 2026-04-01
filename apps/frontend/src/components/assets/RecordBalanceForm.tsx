import { useState } from "react";
import { useRecordAssetBalance, useRecordAccountBalance } from "../../hooks/useAssets.js";

interface Props {
  itemId: string;
  itemKind: "asset" | "account";
  onClose: () => void;
}

function todayISO() {
  return new Date().toISOString().split("T")[0]!;
}

export function RecordBalanceForm({ itemId, itemKind, onClose }: Props) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recordAsset = useRecordAssetBalance();
  const recordAccount = useRecordAccountBalance();

  const isPending = recordAsset.isPending || recordAccount.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError("Value must be a positive number");
      return;
    }
    if (date > todayISO()) {
      setError("Date cannot be in the future");
      return;
    }
    try {
      if (itemKind === "asset") {
        await recordAsset.mutateAsync({
          assetId: itemId,
          data: { value: numValue, date, note: note || null },
        });
      } else {
        await recordAccount.mutateAsync({
          accountId: itemId,
          data: { value: numValue, date, note: note || null },
        });
      }
      onClose();
    } catch {
      setError("Failed to record balance. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0d1024] border border-[#1a1f35] rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
      >
        <h2 className="text-base font-semibold text-[rgba(238,242,255,0.92)]">Record Balance</h2>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rbf-value"
            className="text-[11px] uppercase tracking-wider text-[rgba(238,242,255,0.4)]"
          >
            Value (£)
          </label>
          <input
            id="rbf-value"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            className="bg-[rgba(238,242,255,0.04)] border border-[#1a1f35] rounded-md px-3 py-2 text-sm text-[rgba(238,242,255,0.92)] placeholder:text-[rgba(238,242,255,0.2)] focus:outline-none focus:border-[#8b5cf6]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rbf-date"
            className="text-[11px] uppercase tracking-wider text-[rgba(238,242,255,0.4)]"
          >
            Date
          </label>
          <input
            id="rbf-date"
            type="date"
            required
            max={todayISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[rgba(238,242,255,0.04)] border border-[#1a1f35] rounded-md px-3 py-2 text-sm text-[rgba(238,242,255,0.92)] focus:outline-none focus:border-[#8b5cf6]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rbf-note"
            className="text-[11px] uppercase tracking-wider text-[rgba(238,242,255,0.4)]"
          >
            Note (optional)
          </label>
          <input
            id="rbf-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. end of year valuation"
            className="bg-[rgba(238,242,255,0.04)] border border-[#1a1f35] rounded-md px-3 py-2 text-sm text-[rgba(238,242,255,0.92)] placeholder:text-[rgba(238,242,255,0.2)] focus:outline-none focus:border-[#8b5cf6]"
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-[rgba(238,242,255,0.5)] hover:text-[rgba(238,242,255,0.8)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 rounded-md px-4 py-1.5 text-sm text-white font-medium transition-colors"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
