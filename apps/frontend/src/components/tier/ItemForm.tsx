import { useState } from "react";
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

interface EditItem extends ItemData {
  id: string;
  lastReviewedAt: Date;
}

type AddModeProps = {
  mode: "add";
  item?: undefined;
  onConfirm?: undefined;
  onDelete?: undefined;
};

type EditModeProps = {
  mode: "edit";
  item: EditItem;
  onConfirm: () => void;
  onDelete: () => void;
};

type Props = (AddModeProps | EditModeProps) & {
  config: TierConfig;
  subcategories: SubcategoryOption[];
  initialSubcategoryId: string;
  onSave: (data: ItemData) => void;
  onCancel: () => void;
  isSaving?: boolean;
};

export default function ItemForm({
  mode,
  item,
  config: _config,
  subcategories,
  initialSubcategoryId,
  onSave,
  onCancel,
  onConfirm,
  onDelete,
  isSaving,
}: Props) {
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item?.amount?.toString() ?? "");
  const [spendType, setSpendType] = useState<SpendType>(item?.spendType ?? "monthly");
  const [subcategoryId, setSubcategoryId] = useState(item?.subcategoryId ?? initialSubcategoryId);
  const [notes, setNotes] = useState(item?.notes ?? "");

  function handleSave() {
    onSave({
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      spendType,
      subcategoryId,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="border-t border-foreground/5 bg-foreground/[0.03] px-4 py-3 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Name"
          className="col-span-2 rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-page-accent/40"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Amount"
          min={0}
          step={0.01}
          className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-page-accent/40"
        />
        <select
          value={spendType}
          onChange={(e) => setSpendType(e.target.value as SpendType)}
          aria-label="Spend type"
          className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-page-accent/40"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="one_off">One-off</option>
        </select>
        <select
          value={subcategoryId}
          onChange={(e) => setSubcategoryId(e.target.value)}
          aria-label="Subcategory"
          className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-page-accent/40"
        >
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        aria-label="Notes"
        rows={2}
        maxLength={500}
        className="w-full rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground placeholder-foreground/30 resize-none focus:outline-none focus:ring-1 focus:ring-page-accent/40"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-foreground/10 px-3 py-1 text-xs text-foreground/60 hover:bg-foreground/5 transition-colors"
        >
          Cancel
        </button>
        {mode === "edit" && onConfirm && (
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
            "ml-auto rounded-md px-3 py-1 text-xs font-medium transition-colors",
            "bg-page-accent/20 text-page-accent hover:bg-page-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-40",
          ].join(" ")}
        >
          Save
        </button>
        {mode === "edit" && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-2 text-xs text-foreground/30 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
