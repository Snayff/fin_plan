import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import { useUpsertGiftYearRecord } from "@/hooks/usePlanner";

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: "Birthday",
  christmas: "Christmas",
  mothers_day: "Mother's Day",
  fathers_day: "Father's Day",
  valentines_day: "Valentine's Day",
  anniversary: "Anniversary",
  custom: "Custom",
};

interface GiftUpcomingPanelProps {
  year: number;
  gifts: any[];
  isReadOnly: boolean;
}

interface GiftRowProps {
  gift: any;
  year: number;
  isReadOnly: boolean;
}

function GiftRow({ gift, year, isReadOnly }: GiftRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [budget, setBudget] = useState(String(gift.yearRecord?.budget ?? ""));
  const [notes, setNotes] = useState(gift.yearRecord?.notes ?? "");

  const upsertMutation = useUpsertGiftYearRecord(year);

  const dateLabel = gift.nextDate ? format(new Date(gift.nextDate), "dd MMM") : "—";

  const budgetLabel =
    gift.yearRecord?.budget != null ? formatCurrency(gift.yearRecord.budget) : "No budget set";

  const eventLabel = EVENT_TYPE_LABELS[gift.eventType] ?? gift.eventType;

  function handleSave() {
    upsertMutation.mutate(
      {
        eventId: gift.eventId ?? gift.id,
        data: {
          budget: parseFloat(budget) || 0,
          notes: notes || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success("Budget saved");
          setExpanded(false);
        },
      }
    );
  }

  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-muted-foreground w-14 shrink-0">{dateLabel}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{gift.giftPerson?.name}</p>
            <p className="text-xs text-muted-foreground">{eventLabel}</p>
          </div>
          <span className="text-sm shrink-0">{budgetLabel}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-4 pt-2 space-y-3 bg-accent/30">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Budget</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm bg-background"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={isReadOnly}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notes</label>
            <textarea
              className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          {!isReadOnly && (
            <Button size="sm" onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function GiftUpcomingPanel({ year, gifts, isReadOnly }: GiftUpcomingPanelProps) {
  const upcoming = [...gifts]
    .filter((g) => !g.done)
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());

  const done = gifts.filter((g) => g.done);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Upcoming gifts — {year}</h2>

      {upcoming.length === 0 && done.length === 0 && (
        <GhostedListEmpty ctaText="Add gift recipients to see upcoming events" showCta={false} />
      )}

      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
            Coming up
          </p>
          <div className="rounded-lg border overflow-hidden">
            {upcoming.map((gift) => (
              <GiftRow key={gift.id} gift={gift} year={year} isReadOnly={isReadOnly} />
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
            Done this year
          </p>
          <div className="rounded-lg border overflow-hidden">
            {done.map((gift) => (
              <GiftRow key={gift.id} gift={gift} year={year} isReadOnly={isReadOnly} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
