import { useGiftsUpcoming } from "@/hooks/useGifts";
import type { GiftUpcomingResponse } from "@finplan/shared";

const MONTH_NAMES = [
  "Dateless",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Props = { year: number };

export function UpcomingModePanel({ year }: Props) {
  const { data, isLoading } = useGiftsUpcoming(year);
  if (isLoading || !data) return <div className="p-6 text-sm text-foreground/40">Loading…</div>;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <CalloutGrid callouts={data.callouts} />
      <div className="mt-6 space-y-6">
        {data.groups.map((g) => (
          <section key={g.month}>
            <h3 className="mb-2 text-[11px] uppercase tracking-wide text-foreground/40">
              {MONTH_NAMES[g.month]}
            </h3>
            <ul className="space-y-1">
              {g.rows.length === 0 && (
                <li className="text-xs text-foreground/30">Nothing scheduled.</li>
              )}
              {g.rows.map((row) => (
                <li
                  key={`${row.eventId}-${row.day ?? "x"}-${row.recipients[0]?.personId ?? ""}`}
                  className="flex items-center justify-between rounded bg-foreground/[0.02] px-3 py-2"
                >
                  <div>
                    <div className="text-sm text-foreground">
                      {row.eventName}
                      {row.day ? <span className="ml-1 text-foreground/40">{row.day}</span> : null}
                    </div>
                    <div className="text-[11px] text-foreground/50">
                      {row.recipients.map((r) => r.personName).join(", ")}
                    </div>
                  </div>
                  <div className="font-mono text-sm tabular-nums text-foreground/65">
                    £{row.plannedTotal.toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function CalloutGrid({ callouts }: { callouts: GiftUpcomingResponse["callouts"] }) {
  const cards: { id: keyof GiftUpcomingResponse["callouts"]; label: string }[] = [
    { id: "thisMonth", label: "This month" },
    { id: "nextThreeMonths", label: "Next 3 months" },
    { id: "restOfYear", label: "Rest of year" },
    { id: "dateless", label: "Dateless" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.id}
          data-testid={`callout-${c.id}`}
          className="rounded border border-foreground/5 bg-foreground/[0.02] p-3"
        >
          <div className="text-[10px] uppercase tracking-wide text-foreground/40">{c.label}</div>
          <div className="font-mono text-base tabular-nums text-foreground">
            £{callouts[c.id].total.toLocaleString()}
          </div>
          <div className="text-[10px] text-foreground/40">
            {callouts[c.id].count} {callouts[c.id].count === 1 ? "gift" : "gifts"}
          </div>
        </div>
      ))}
    </div>
  );
}
