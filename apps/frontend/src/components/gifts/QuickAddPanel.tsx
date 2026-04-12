import { useState } from "react";
import { useBulkUpsertAllocations, useConfigEvents, useConfigPeople } from "@/hooks/useGifts";

type Props = { year: number; readOnly: boolean };

export function QuickAddPanel({ year, readOnly }: Props) {
  const people = useConfigPeople("all", year);
  const events = useConfigEvents();
  const bulk = useBulkUpsertAllocations();
  const [cells, setCells] = useState<Record<string, string>>({});

  if (people.isLoading || events.isLoading || !people.data || !events.data) {
    return <div className="p-6 text-sm text-foreground/40">Loading…</div>;
  }

  const set = (eventId: string, personId: string, value: string) =>
    setCells((prev) => ({ ...prev, [`${eventId}-${personId}`]: value }));

  const save = () => {
    const payload = Object.entries(cells)
      .map(([key, value]) => {
        const [eventId, personId] = key.split("-");
        const planned = parseFloat(value);
        if (Number.isNaN(planned) || planned <= 0) return null;
        return { eventId: eventId!, personId: personId!, year, planned };
      })
      .filter(
        (c): c is { eventId: string; personId: string; year: number; planned: number } => c !== null
      );
    bulk.mutate({ cells: payload });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-4 flex items-center border-b border-foreground/5">
        <h2 className="font-heading text-base font-bold text-foreground">Quick Add</h2>
      </div>
      <div className="flex-1 flex flex-col p-6">
        <div className="mb-3 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th></th>
                {(people.data as { id: string; name: string }[]).map((p) => (
                  <th key={p.id} className="px-2 py-1 text-left text-[11px] text-foreground/50">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(events.data as { id: string; name: string }[]).map((e) => (
                <tr key={e.id}>
                  <td className="px-2 py-1 text-[11px] text-foreground/50">{e.name}</td>
                  {(people.data as { id: string; name: string }[]).map((p) => (
                    <td key={p.id}>
                      <input
                        type="number"
                        min={0}
                        data-testid={`cell-${e.id}-${p.id}`}
                        aria-label={`Planned amount for ${p.name} × ${e.name}`}
                        disabled={readOnly}
                        value={cells[`${e.id}-${p.id}`] ?? ""}
                        onChange={(ev) => set(e.id, p.id, ev.target.value)}
                        className="w-16 rounded bg-foreground/5 px-1 py-0.5 text-right font-mono tabular-nums text-foreground"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCells({})}
            className="rounded px-3 py-1 text-xs text-foreground/65 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={readOnly || bulk.isPending}
            className="rounded bg-foreground/10 px-3 py-1 text-xs text-foreground hover:bg-foreground/20"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
