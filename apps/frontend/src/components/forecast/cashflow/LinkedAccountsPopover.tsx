import { useState, useEffect, useMemo } from "react";
import { useLinkableAccounts, useBulkUpdateLinkedAccounts } from "@/hooks/useCashflow";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";

interface LinkedAccountsPopoverProps {
  onClose: () => void;
}

const EMPTY_ACCOUNTS: never[] = [];

export function LinkedAccountsPopover({ onClose }: LinkedAccountsPopoverProps) {
  const { data, isLoading } = useLinkableAccounts();
  const accounts = data ?? EMPTY_ACCOUNTS;
  const bulkUpdate = useBulkUpdateLinkedAccounts();
  const [draft, setDraft] = useState<Record<string, boolean>>({});

  // Use a stable signature so this effect only fires when accounts actually
  // change — not on every render due to a new array reference from React Query.
  const signature = useMemo(
    () => accounts.map((a) => `${a.id}:${a.isCashflowLinked ? 1 : 0}`).join("|"),
    [accounts]
  );

  useEffect(() => {
    setDraft(Object.fromEntries(accounts.map((a) => [a.id, a.isCashflowLinked])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // Close on Escape — popover acts as a lightweight dialog.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const allSelected = accounts.length > 0 && accounts.every((a) => draft[a.id]);

  function commit(next: Record<string, boolean>) {
    setDraft(next);
    const updates = accounts
      .filter((a) => next[a.id] !== a.isCashflowLinked)
      .map((a) => ({ accountId: a.id, isCashflowLinked: !!next[a.id] }));
    if (updates.length > 0) bulkUpdate.mutate({ updates });
  }

  function toggle(id: string) {
    commit({ ...draft, [id]: !draft[id] });
  }

  function toggleAll() {
    const next = Object.fromEntries(accounts.map((a) => [a.id, !allSelected]));
    commit(next);
  }

  if (isLoading)
    return (
      <div className="rounded-md border border-surface-border bg-surface p-4 w-80">Loading…</div>
    );

  return (
    <div
      role="dialog"
      aria-label="Select linked accounts"
      className="rounded-md border border-surface-border bg-surface p-3 w-80 shadow-lg"
    >
      <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer">
        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
        <span className="text-xs uppercase tracking-widest text-text-tertiary">Select all</span>
      </label>
      <div className="border-t border-surface-border my-2" />
      <ul className="space-y-1 max-h-64 overflow-y-auto">
        {accounts.map((a) => (
          <li key={a.id}>
            <label className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-accent/30 cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!draft[a.id]}
                  onChange={() => toggle(a.id)}
                  aria-label={a.name}
                />
                <span className="text-sm">{a.name}</span>
                <span className="text-[10px] uppercase tracking-widest text-text-tertiary">
                  {a.type}
                </span>
              </span>
              <span className="text-xs text-text-tertiary font-numeric">
                {a.latestBalance != null ? formatCurrency(a.latestBalance) : "—"}
                {a.latestBalanceDate && (
                  <span className="ml-2">{format(new Date(a.latestBalanceDate), "d MMM")}</span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="border-t border-surface-border mt-2 pt-2 flex justify-end">
        <button type="button" onClick={onClose} className="text-xs text-text-secondary">
          Close
        </button>
      </div>
    </div>
  );
}
