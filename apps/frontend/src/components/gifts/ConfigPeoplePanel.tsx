import { useState, useMemo } from "react";
import { useConfigPeople, useCreateGiftPerson, useDeleteGiftPerson } from "@/hooks/useGifts";

type Filter = "all" | "household" | "non-household";

type ConfigPerson = {
  id: string;
  name: string;
  notes: string | null;
  sortOrder: number;
  memberId: string | null;
  plannedCount: number;
  boughtCount: number;
};

type Props = { readOnly: boolean; year: number };

export function ConfigPeoplePanel({ readOnly, year }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showAddInput, setShowAddInput] = useState(false);
  const [name, setName] = useState("");
  const { data: rawData, isLoading } = useConfigPeople("all", year);
  const create = useCreateGiftPerson();
  const remove = useDeleteGiftPerson();

  const allPeople = useMemo<ConfigPerson[]>(
    () => (rawData as ConfigPerson[] | undefined) ?? [],
    [rawData]
  );

  const counts = useMemo(() => {
    const household = allPeople.filter((p) => p.memberId !== null).length;
    return { all: allPeople.length, household, "non-household": allPeople.length - household };
  }, [allPeople]);

  const filtered = useMemo(() => {
    if (filter === "household") return allPeople.filter((p) => p.memberId !== null);
    if (filter === "non-household") return allPeople.filter((p) => p.memberId === null);
    return allPeople;
  }, [allPeople, filter]);

  const submit = () => {
    if (!name.trim()) return;
    create.mutate({ name: name.trim() });
    setName("");
    setShowAddInput(false);
  };

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "household", label: "Household" },
    { id: "non-household", label: "Non-household" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-base font-bold text-foreground">People</h2>
          <span className="text-xs text-foreground/40">
            {counts.all} {counts.all === 1 ? "person" : "people"}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowAddInput(true)}
            disabled={showAddInput}
            className="rounded-md border px-3 py-1 text-xs font-medium transition-all duration-150 border-foreground/20 text-foreground/60 hover:border-page-accent/40 hover:bg-page-accent/8 hover:text-foreground/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        {/* Inline add input */}
        {!readOnly && showAddInput && (
          <div className="flex gap-2">
            <input
              autoFocus
              placeholder="Person name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") {
                  setShowAddInput(false);
                  setName("");
                }
              }}
              className="flex-1 rounded border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/30"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!name.trim()}
              className="rounded bg-tier-discretionary/20 px-3 py-1.5 text-xs font-medium text-tier-discretionary transition-colors hover:bg-tier-discretionary/30 disabled:opacity-40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddInput(false);
                setName("");
              }}
              className="rounded px-2 py-1.5 text-xs text-foreground/40 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Filter row */}
        <div className="flex items-center justify-between border-y border-foreground/5 py-2.5">
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                data-active={filter === f.id}
                className="rounded-md px-3 py-1 text-xs text-foreground/40 transition-colors data-[active=true]:border data-[active=true]:border-foreground/10 data-[active=true]:bg-foreground/5 data-[active=true]:font-medium data-[active=true]:text-foreground"
              >
                {f.label}{" "}
                <span className="font-mono text-[11px] text-foreground/40">{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Person list */}
        {isLoading ? (
          <div className="text-sm text-foreground/40">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-foreground/40">
            {filter === "all"
              ? "No people yet — add someone to get started."
              : `No ${filter} people.`}
          </div>
        ) : (
          <div>
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-foreground/[0.03] px-3.5 py-3.5 transition-colors hover:bg-tier-discretionary/[0.04]"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    {p.memberId !== null && (
                      <span className="rounded bg-tier-discretionary/12 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-tier-discretionary/70">
                        Household
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex gap-1.5 text-[11px]">
                    {p.plannedCount > 0 && (
                      <span className="font-mono text-foreground/40">{p.plannedCount} planned</span>
                    )}
                    {p.plannedCount > 0 && p.boughtCount > 0 && (
                      <span className="text-foreground/25">·</span>
                    )}
                    {p.boughtCount > 0 && (
                      <span className="font-mono font-medium text-foreground/65">
                        {p.boughtCount} bought
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => remove.mutate(p.id)}
                      className="text-[11px] text-foreground/0 transition-colors group-hover:text-foreground/40 group-hover:hover:text-foreground"
                    >
                      Delete
                    </button>
                  )}
                  <span className="text-foreground/25">›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
