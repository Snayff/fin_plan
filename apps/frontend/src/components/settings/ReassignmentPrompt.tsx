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

interface ReassignmentPromptProps {
  isOpen: boolean;
  subcategoryName: string;
  itemCount: number;
  destinations: Array<{ id: string; name: string }>;
  onConfirm: (destinationId: string) => void;
  onCancel: () => void;
}

export function ReassignmentPrompt({
  isOpen,
  subcategoryName,
  itemCount,
  destinations,
  onConfirm,
  onCancel,
}: ReassignmentPromptProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reassign items</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{subcategoryName}</strong> has {itemCount} item
            {itemCount !== 1 ? "s" : ""}. Choose where to move them before removing this
            subcategory.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination..." />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!selectedId}
            onClick={() => {
              onConfirm(selectedId);
              setSelectedId("");
            }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
