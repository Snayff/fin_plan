import type { AuditChange } from "@finplan/shared";

type Props = { changes: AuditChange[] | null; action: string };

export function ChangesCell({ changes, action }: Props) {
  if (!changes || changes.length === 0)
    return <span className="text-muted-foreground text-xs">—</span>;

  const isCreate = action.startsWith("CREATE_");
  const isDelete = action.startsWith("DELETE_");

  return (
    <div className="space-y-1">
      {changes.map((c, i) => (
        <div key={i} className="flex items-baseline gap-1 font-mono text-xs">
          <span className="text-muted-foreground">{c.field}</span>
          {isCreate && <span className="text-foreground">{String(c.after ?? "")}</span>}
          {isDelete && (
            <span className="text-muted-foreground line-through">{String(c.before ?? "")}</span>
          )}
          {!isCreate && !isDelete && (
            <>
              <span className="text-muted-foreground">{String(c.before ?? "")}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground">{String(c.after ?? "")}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
