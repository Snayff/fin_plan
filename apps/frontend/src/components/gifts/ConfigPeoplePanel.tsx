import { useState } from "react";
import { useConfigPeople, useCreateGiftPerson, useDeleteGiftPerson } from "@/hooks/useGifts";

type Filter = "all" | "household" | "non-household";

type Props = { readOnly: boolean };

export function ConfigPeoplePanel({ readOnly }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [name, setName] = useState("");
  const { data, isLoading } = useConfigPeople(filter);
  const create = useCreateGiftPerson();
  const remove = useDeleteGiftPerson();

  const submit = () => {
    if (!name.trim()) return;
    create.mutate({ name: name.trim() });
    setName("");
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-3 flex gap-2">
        {(["all", "household", "non-household"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            data-active={filter === f}
            className="rounded px-2 py-1 text-xs text-foreground/50 data-[active=true]:bg-foreground/10 data-[active=true]:text-foreground"
          >
            {f === "all" ? "All" : f === "household" ? "Household" : "Non-household"}
          </button>
        ))}
      </div>
      {!readOnly && (
        <div className="mb-3 flex gap-2">
          <input
            placeholder="Add a person…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 rounded bg-foreground/5 px-2 py-1 text-sm text-foreground"
          />
        </div>
      )}
      {isLoading ? (
        <div className="text-sm text-foreground/40">Loading…</div>
      ) : (
        <ul className="divide-y divide-foreground/5">
          {(data ?? []).map((p: any) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">{p.name}</span>
              {p.memberId !== null && (
                <span className="text-[10px] uppercase tracking-wide text-foreground/40">
                  Household
                </span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove.mutate(p.id)}
                  className="text-[11px] text-foreground/40 hover:text-foreground"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
