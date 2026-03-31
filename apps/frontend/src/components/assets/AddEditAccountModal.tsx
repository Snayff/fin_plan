import { useState } from "react";
import type { AccountType } from "@finplan/shared";
import { useCreateAccount, useUpdateAccount, useDeleteAccount } from "../../hooks/useAssets.js";
import { useHouseholdMembers, useSettings } from "../../hooks/useSettings.js";
import type { AccountItem } from "../../services/assets.service.js";

const GROWTH_RATE_SETTING_KEY: Partial<
  Record<AccountType, "savingsRatePct" | "investmentRatePct" | "pensionRatePct">
> = {
  Savings: "savingsRatePct",
  StocksAndShares: "investmentRatePct",
  Pension: "pensionRatePct",
};

interface Props {
  type: AccountType;
  item?: AccountItem;
  onClose: () => void;
}

export function AddEditAccountModal({ type, item, onClose }: Props) {
  const [name, setName] = useState(item?.name ?? "");
  const [memberUserId, setMemberUserId] = useState<string | null>(item?.memberUserId ?? null);
  const [growthRatePct, setGrowthRatePct] = useState(item?.growthRatePct?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: members } = useHouseholdMembers();
  const { data: settings } = useSettings();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const isPending = createAccount.isPending || updateAccount.isPending || deleteAccount.isPending;
  const isEdit = !!item;

  const settingKey = GROWTH_RATE_SETTING_KEY[type];
  const defaultRate =
    settingKey && settings ? (settings as Record<string, unknown>)[settingKey] : null;
  const rateLabel = defaultRate != null ? `Default: ${defaultRate}%` : "No household default set";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const parsedRate = growthRatePct !== "" ? parseFloat(growthRatePct) : null;
    if (parsedRate !== null && (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100)) {
      setError("Growth rate must be between 0 and 100");
      return;
    }
    try {
      if (isEdit) {
        await updateAccount.mutateAsync({
          accountId: item.id,
          data: { name: name.trim(), memberUserId, growthRatePct: parsedRate },
        });
      } else {
        await createAccount.mutateAsync({
          name: name.trim(),
          type,
          memberUserId: memberUserId ?? undefined,
          growthRatePct: parsedRate ?? undefined,
        });
      }
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    }
  }

  async function handleDelete() {
    if (!item) return;
    try {
      await deleteAccount.mutateAsync(item.id);
      onClose();
    } catch {
      setError("Failed to delete. Please try again.");
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
        <h2 className="text-base font-semibold text-[rgba(238,242,255,0.92)]">
          {isEdit ? "Edit" : "Add"} {type === "StocksAndShares" ? "Stocks & Shares" : type}
        </h2>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="aeac-name"
            className="text-[11px] uppercase tracking-wider text-[rgba(238,242,255,0.4)]"
          >
            Name
          </label>
          <input
            id="aeac-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vanguard SIPP"
            className="bg-[rgba(238,242,255,0.04)] border border-[#1a1f35] rounded-md px-3 py-2 text-sm text-[rgba(238,242,255,0.92)] placeholder:text-[rgba(238,242,255,0.2)] focus:outline-none focus:border-[#8b5cf6]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="aeac-member"
            className="text-[11px] uppercase tracking-wider text-[rgba(238,242,255,0.4)]"
          >
            Assigned to
          </label>
          <select
            id="aeac-member"
            value={memberUserId ?? ""}
            onChange={(e) => setMemberUserId(e.target.value || null)}
            className="bg-[rgba(238,242,255,0.04)] border border-[#1a1f35] rounded-md px-3 py-2 text-sm text-[rgba(238,242,255,0.92)] focus:outline-none focus:border-[#8b5cf6]"
          >
            <option value="">Household</option>
            {members?.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.firstName}
              </option>
            ))}
          </select>
        </div>

        {settingKey && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="aeac-growth"
              className="text-[11px] uppercase tracking-wider text-[rgba(238,242,255,0.4)]"
            >
              Growth rate override (%)
            </label>
            <input
              id="aeac-growth"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={growthRatePct}
              onChange={(e) => setGrowthRatePct(e.target.value)}
              placeholder={rateLabel}
              className="bg-[rgba(238,242,255,0.04)] border border-[#1a1f35] rounded-md px-3 py-2 text-sm text-[rgba(238,242,255,0.92)] placeholder:text-[rgba(238,242,255,0.3)] focus:outline-none focus:border-[#8b5cf6]"
            />
            <p className="text-[11px] text-[rgba(238,242,255,0.3)]">
              Leave blank to use household default ({rateLabel})
            </p>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex justify-between items-center mt-1">
          {isEdit && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Delete
            </button>
          )}
          {isEdit && confirmDelete && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isPending}
              className="text-xs text-red-400 font-semibold hover:text-red-300 transition-colors"
            >
              Confirm delete
            </button>
          )}
          {!isEdit && <span />}
          <div className="flex gap-2">
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
              {isPending ? "Saving…" : isEdit ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
