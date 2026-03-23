import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateGiftPerson } from "@/hooks/usePlanner";

interface GiftPersonListPanelProps {
  year: number;
  persons: any[];
  isReadOnly: boolean;
  onSelectPerson: (person: any) => void;
  selectedPersonId: string | null;
}

interface AddPersonFormProps {
  onCancel: () => void;
}

function AddPersonForm({ onCancel }: AddPersonFormProps) {
  const [name, setName] = useState("");
  const createMutation = useCreateGiftPerson();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name } as any, {
      onSuccess: () => {
        toast.success("Person added");
        onCancel();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded-lg space-y-3 mt-3">
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
        <Button type="submit" size="sm" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Adding…" : "Add person"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function GiftPersonListPanel({
  year,
  persons,
  isReadOnly,
  onSelectPerson,
  selectedPersonId,
}: GiftPersonListPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gift people — {year}</h2>
        {!isReadOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddForm((v) => !v)}
            disabled={isReadOnly}
          >
            + Add person
          </Button>
        )}
      </div>

      {showAddForm && <AddPersonForm onCancel={() => setShowAddForm(false)} />}

      {persons.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground italic text-center py-8">No gift people yet</p>
      )}

      <div className="space-y-0.5">
        {persons.map((person) => {
          const isSelected = person.id === selectedPersonId;
          return (
            <button
              key={person.id}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded text-sm transition-colors hover:bg-accent text-left",
                isSelected && "bg-accent"
              )}
              onClick={() => onSelectPerson(person)}
            >
              <span className="font-medium truncate flex-1">{person.name}</span>
              <span className="ml-4 shrink-0 flex items-center gap-1 text-muted-foreground">
                {formatCurrency(person.budgetTotal ?? 0)}
                <span className="ml-1">→</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
