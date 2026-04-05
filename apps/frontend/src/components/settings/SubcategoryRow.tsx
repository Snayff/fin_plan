import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SubcategoryRowProps {
  id: string;
  name: string;
  isLocked: boolean;
  isOther: boolean;
  error?: string;
  onNameChange: (name: string) => void;
  onRemove: () => void;
}

export function SubcategoryRow({
  id,
  name,
  isLocked,
  isOther,
  error,
  onNameChange,
  onRemove,
}: SubcategoryRowProps) {
  const isReadOnly = isLocked || isOther;
  const isDraggable = !isOther;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1.5">
      {isDraggable ? (
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${name}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <div className="w-4" />
      )}

      <div className="flex-1">
        <Input
          value={name}
          disabled={isReadOnly}
          maxLength={24}
          onChange={(e) => onNameChange(e.target.value)}
          className={`h-8 text-sm ${error ? "border-destructive" : ""} ${isReadOnly ? "opacity-60" : ""}`}
          aria-label={`Subcategory name: ${name}`}
        />
        {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      </div>

      {!isReadOnly && (
        <button
          type="button"
          data-testid="remove-sub"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive transition-colors"
          aria-label={`Remove ${name}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
