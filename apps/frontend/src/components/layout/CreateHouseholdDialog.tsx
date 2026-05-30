import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateHouseholdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isPending: boolean;
}

export function CreateHouseholdDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: CreateHouseholdDialogProps) {
  const [name, setName] = useState("");

  function handleConfirm() {
    if (name.trim()) {
      onConfirm(name.trim());
      setName("");
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create new household</AlertDialogTitle>
          <AlertDialogDescription className="text-text-secondary">
            Give your new household a name. You can rename it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="household-name">Name</Label>
          <Input
            id="household-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Smith Household"
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!name.trim() || isPending}>
            {isPending ? "Creating…" : "Create"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
