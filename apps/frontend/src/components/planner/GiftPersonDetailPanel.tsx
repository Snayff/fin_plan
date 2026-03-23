import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import {
  useGiftPerson,
  useCreateGiftEvent,
  useDeleteGiftEvent,
  useUpsertGiftYearRecord,
  useUpdateGiftPerson,
} from "@/hooks/usePlanner";

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: "Birthday",
  christmas: "Christmas",
  mothers_day: "Mother's Day",
  fathers_day: "Father's Day",
  valentines_day: "Valentine's Day",
  anniversary: "Anniversary",
  custom: "Custom",
};

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);

const RECURRENCE_LABELS: Record<string, string> = {
  annual: "Annual",
  one_off: "One-off",
};

const DATE_MONTH_EVENTS = ["birthday", "anniversary", "custom"];

interface GiftPersonDetailPanelProps {
  personId: string;
  year: number;
  onBack: () => void;
  isReadOnly: boolean;
}

interface EventRowProps {
  event: any;
  year: number;
  personId: string;
  isReadOnly: boolean;
}

function EventRow({ event, year, personId: _personId, isReadOnly }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [budget, setBudget] = useState(String(event.yearRecords?.[0]?.budget ?? ""));
  const [notes, setNotes] = useState(event.yearRecords?.[0]?.notes ?? "");

  const upsertMutation = useUpsertGiftYearRecord(year);
  const deleteMutation = useDeleteGiftEvent(year);

  const eventLabel = EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;
  const displayName =
    event.eventType === "custom" && event.customName
      ? `${eventLabel} — ${event.customName}`
      : eventLabel;

  const budgetLabel =
    event.yearRecords?.[0]?.budget != null
      ? formatCurrency(event.yearRecords[0].budget)
      : "Set budget";

  function handleSaveRecord() {
    upsertMutation.mutate(
      {
        eventId: event.id,
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

  function handleDeleteEvent() {
    deleteMutation.mutate(event.id, {
      onSuccess: () => {
        toast.success("Event deleted");
        setExpanded(false);
      },
    });
  }

  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{displayName}</span>
          <span className="text-sm text-muted-foreground">{budgetLabel}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-4 pt-2 space-y-3 bg-accent/30">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Budget for {year}</label>
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
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleSaveRecord} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <button
                className="text-sm text-destructive hover:underline"
                onClick={handleDeleteEvent}
                disabled={deleteMutation.isPending}
                type="button"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete event"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AddEventFormProps {
  personId: string;
  year: number;
  onCancel: () => void;
}

function AddEventForm({ personId, year, onCancel }: AddEventFormProps) {
  const [eventType, setEventType] = useState("birthday");
  const [customName, setCustomName] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateDay, setDateDay] = useState("");
  const [recurrence, setRecurrence] = useState("annual");

  const createMutation = useCreateGiftEvent(year);

  const showDateFields = DATE_MONTH_EVENTS.includes(eventType);
  const showCustomName = eventType === "custom";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, unknown> = {
      eventType,
      recurrence,
    };
    if (showCustomName) data.customName = customName;
    if (showDateFields && dateMonth && dateDay) {
      data.dateMonth = parseInt(dateMonth);
      data.dateDay = parseInt(dateDay);
    }

    createMutation.mutate(
      { personId, data: data as any },
      {
        onSuccess: () => {
          toast.success("Event added");
          onCancel();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded-lg space-y-3 mt-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Event type</label>
        <select
          className="w-full border rounded px-2 py-1 text-sm bg-background"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {showCustomName && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Custom name</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm bg-background"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        </div>
      )}

      {showDateFields && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Month (1–12)</label>
            <input
              type="number"
              min={1}
              max={12}
              className="w-full border rounded px-2 py-1 text-sm bg-background"
              value={dateMonth}
              onChange={(e) => setDateMonth(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Day (1–31)</label>
            <input
              type="number"
              min={1}
              max={31}
              className="w-full border rounded px-2 py-1 text-sm bg-background"
              value={dateDay}
              onChange={(e) => setDateDay(e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Recurrence</label>
        <select
          className="w-full border rounded px-2 py-1 text-sm bg-background"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
        >
          {Object.entries(RECURRENCE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Adding…" : "Add event"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface EditPersonFormProps {
  person: any;
  onCancel: () => void;
}

function EditPersonForm({ person, onCancel }: EditPersonFormProps) {
  const [name, setName] = useState(person.name ?? "");
  const updateMutation = useUpdateGiftPerson();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(
      { id: person.id, data: { name } as any },
      {
        onSuccess: () => {
          toast.success("Person updated");
          onCancel();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded-lg space-y-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Name</label>
        <input
          className="w-full border rounded px-2 py-1 text-sm bg-background"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function GiftPersonDetailPanel({
  personId,
  year,
  onBack,
  isReadOnly,
}: GiftPersonDetailPanelProps) {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditPerson, setShowEditPerson] = useState(false);

  const { data: person, isLoading } = useGiftPerson(personId, year);

  if (isLoading) {
    return <SkeletonLoader variant="right-panel" />;
  }

  if (!person) {
    return <div className="text-sm text-muted-foreground italic p-4">Person not found.</div>;
  }

  const events: any[] = person.giftEvents ?? [];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <button onClick={onBack} className="hover:text-foreground transition-colors">
          ← Gifts
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{person.name}</span>
      </div>

      {/* Heading + edit */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{person.name}</h2>
        {!isReadOnly && !showEditPerson && (
          <button
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowEditPerson(true)}
          >
            Edit person
          </button>
        )}
      </div>

      {showEditPerson && (
        <EditPersonForm person={person} onCancel={() => setShowEditPerson(false)} />
      )}

      {/* Add event */}
      {!isReadOnly && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAddEvent((v) => !v)}
          disabled={showAddEvent}
        >
          + Add event
        </Button>
      )}

      {showAddEvent && (
        <AddEventForm personId={personId} year={year} onCancel={() => setShowAddEvent(false)} />
      )}

      {/* Event list */}
      {events.length === 0 && !showAddEvent && (
        <p className="text-sm text-muted-foreground italic text-center py-6">No events yet</p>
      )}

      {events.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              year={year}
              personId={personId}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
