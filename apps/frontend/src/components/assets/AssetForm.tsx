import { useState } from "react";
import { useHouseholdMembers } from "../../hooks/useSettings.js";

interface Props {
  mode: "add" | "edit";
  initialName?: string;
  initialMemberUserId?: string | null;
  isSaving?: boolean;
  isSavingConfirm?: boolean;
  isStale?: boolean;
  onSave: (data: { name: string; memberUserId: string | null }) => void;
  onCancel: () => void;
  onDeleteRequest?: () => void;
  onConfirm?: () => void;
}

const labelClass = "text-text-muted uppercase tracking-[0.07em] text-[10px]";
const inputClass =
  "rounded-md border border-foreground/10 bg-foreground/[0.04] px-3 py-1.5 text-sm text-text-secondary placeholder:italic placeholder:text-text-muted focus:outline-none focus:border-page-accent/60";

export function AssetForm({
  mode,
  initialName = "",
  initialMemberUserId = null,
  isSaving,
  isSavingConfirm,
  isStale,
  onSave,
  onCancel,
  onDeleteRequest,
  onConfirm,
}: Props) {
  const [name, setName] = useState(initialName);
  const [memberUserId, setMemberUserId] = useState<string | null>(initialMemberUserId);
  const [nameError, setNameError] = useState<string | null>(null);

  const { data: members } = useHouseholdMembers();

  function handleSave() {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError(null);
    onSave({ name: name.trim(), memberUserId });
  }

  return (
    <div className="border-t border-foreground/5 bg-foreground/[0.02] py-3 pr-4 flex flex-col gap-3 border-l-2 border-page-accent/40 pl-[30px]">
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelClass}>
            Name <span className="text-text-muted">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Family Home"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            aria-label="Name"
            className={[inputClass, "col-span-2", nameError ? "border-amber-400/60" : ""].join(" ")}
          />
          {nameError && <p className="-mt-0.5 text-xs text-amber-400">{nameError}</p>}
        </div>

        {/* Assigned to */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelClass}>Assigned to</label>
          <select
            value={memberUserId ?? ""}
            onChange={(e) => setMemberUserId(e.target.value || null)}
            aria-label="Assigned to"
            className={inputClass}
          >
            <option value="">Household</option>
            {members
              ?.filter((m): m is typeof m & { userId: string } => m.userId !== null)
              .map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.firstName}
                </option>
              ))}
          </select>
        </div>
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
