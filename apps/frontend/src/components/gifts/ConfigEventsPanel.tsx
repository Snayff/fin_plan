import { useState } from "react";
import { useConfigEvents, useCreateGiftEvent, useDeleteGiftEvent } from "@/hooks/useGifts";
import type { GiftDateType } from "@finplan/shared";

type Props = { readOnly: boolean };

export function ConfigEventsPanel({ readOnly }: Props) {
  const { data, isLoading } = useConfigEvents();
  const create = useCreateGiftEvent();
  const remove = useDeleteGiftEvent();
  const [name, setName] = useState("");
  const [dateType, setDateType] = useState<GiftDateType>("personal");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    const payload: Record<string, unknown> = { name: name.trim(), dateType };
    if (dateType === "shared") {
      payload.dateMonth = parseInt(month, 10);
      payload.dateDay = parseInt(day, 10);
    }
    create.mutate(payload as any);
    setName("");
    setMonth("");
    setDay("");
  };

  if (isLoading || !data) return <div className="p-6 text-sm text-foreground/40">Loading…</div>;
  const locked = data.filter((e: any) => e.isLocked);
  const custom = data.filter((e: any) => !e.isLocked);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <section>
        <h3 className="mb-2 text-[11px] uppercase tracking-wide text-foreground/40">Locked</h3>
        <ul className="divide-y divide-foreground/5">
          {locked.map((e: any) => (
            <li
              key={e.id}
              data-testid={`event-row-${e.id}`}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-foreground">
                <span aria-hidden className="mr-2 text-foreground/30">
                  🔒
                </span>
                {e.name}
              </span>
              <span className="text-[11px] text-foreground/40">
                {e.dateType === "shared" ? `${e.dateMonth}/${e.dateDay}` : "personal"}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6">
        <h3 className="mb-2 text-[11px] uppercase tracking-wide text-foreground/40">Custom</h3>
        <ul className="divide-y divide-foreground/5">
          {custom.map((e: any) => (
            <li
              key={e.id}
              data-testid={`event-row-${e.id}`}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-foreground">{e.name}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove.mutate(e.id)}
                  className="text-[11px] text-foreground/40 hover:text-foreground"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
        {!readOnly && (
          <div className="mt-3 space-y-2 rounded border border-foreground/5 p-3">
            <input
              placeholder="Event name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded bg-foreground/5 px-2 py-1 text-sm text-foreground"
            />
            <fieldset className="flex flex-col gap-1 text-[11px] text-foreground/65">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={dateType === "shared"}
                  onChange={() => setDateType("shared")}
                />
                Same date every year (e.g. Christmas)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={dateType === "personal"}
                  onChange={() => setDateType("personal")}
                />
                Different per person (e.g. Birthday)
              </label>
            </fieldset>
            {dateType === "shared" && (
              <div className="flex gap-2">
                <input
                  placeholder="Month"
                  aria-label="Month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-20 rounded bg-foreground/5 px-2 py-1 text-sm text-foreground"
                />
                <input
                  placeholder="Day"
                  aria-label="Day"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-20 rounded bg-foreground/5 px-2 py-1 text-sm text-foreground"
                />
              </div>
            )}
            <button
              type="button"
              onClick={submit}
              className="rounded bg-foreground/10 px-3 py-1 text-xs text-foreground hover:bg-foreground/20"
            >
              Add event
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
