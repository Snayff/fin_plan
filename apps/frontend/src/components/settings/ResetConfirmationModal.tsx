import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { WaterfallTier } from "@finplan/shared";

interface NonDefaultSub {
  id: string;
  tier: WaterfallTier;
  name: string;
  itemCount: number;
}

interface ResetConfirmationModalProps {
  isOpen: boolean;
  nonDefaultSubs: NonDefaultSub[];
  defaultDestinations: Record<WaterfallTier, Array<{ id: string; name: string }>>;
  onConfirm: (reassignments: Array<{ fromSubcategoryId: string; toSubcategoryId: string }>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ResetConfirmationModal({
  isOpen,
  nonDefaultSubs,
  defaultDestinations,
  onConfirm,
  onCancel,
  isLoading,
}: ResetConfirmationModalProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const subsWithItems = nonDefaultSubs.filter((s) => s.itemCount > 0);
  const subsWithoutItems = nonDefaultSubs.filter((s) => s.itemCount === 0);

  const allAssigned = subsWithItems.every((s) => assignments[s.id]);

  function handleConfirm() {
    const reassignments = subsWithItems
      .filter((s) => assignments[s.id])
      .map((s) => ({
        fromSubcategoryId: s.id,
        toSubcategoryId: assignments[s.id]!,
      }));
    onConfirm(reassignments);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset subcategories to defaults</AlertDialogTitle>
          <AlertDialogDescription>
            This will restore all three tiers to their original subcategories.
            {nonDefaultSubs.length === 0 &&
              " No custom subcategories found — defaults are already in place."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {subsWithItems.length > 0 && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The following subcategories have items that need to be reassigned:
            </p>
            {subsWithItems.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sub.itemCount} item{sub.itemCount !== 1 ? "s" : ""} — {sub.tier}
                  </p>
                </div>
                <Select
                  value={assignments[sub.id] ?? ""}
                  onValueChange={(v) => setAssignments((prev) => ({ ...prev, [sub.id]: v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Move to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultDestinations[sub.tier]?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {subsWithoutItems.length > 0 && (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              The following will be removed (no items assigned):
            </p>
            <ul className="list-disc list-inside text-sm mt-1">
              {subsWithoutItems.map((sub) => (
                <li key={sub.id}>
                  {sub.name} <span className="text-muted-foreground">({sub.tier})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!allAssigned || isLoading}
            className="bg-attention hover:bg-attention/90 text-foreground"
          >
            {isLoading ? "Resetting..." : "Reset to defaults"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
