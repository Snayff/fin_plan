import { Plus, Pencil, Trash2, UserPlus, type LucideIcon } from "lucide-react";

type Props = { action: string };

function getVerb(action: string): {
  label: string;
  Icon: LucideIcon;
} {
  if (action.startsWith("CREATE_")) return { label: "created", Icon: Plus };
  if (action.startsWith("UPDATE_")) return { label: "updated", Icon: Pencil };
  if (action.startsWith("DELETE_")) return { label: "deleted", Icon: Trash2 };
  if (action.startsWith("INVITE_")) return { label: "invited", Icon: UserPlus };
  return { label: action.toLowerCase(), Icon: Pencil };
}

export function ActionBadge({ action }: Props) {
  const { label, Icon } = getVerb(action);
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px]"
      style={{ background: "rgba(238,242,255,0.06)" }}
    >
      <Icon size={11} strokeWidth={2.5} className="text-page-accent" />
      <span className="text-page-accent">{label}</span>
    </span>
  );
}
