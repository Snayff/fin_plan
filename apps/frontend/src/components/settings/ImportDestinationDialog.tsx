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
import { Button } from "@/components/ui/button";

interface ImportDestinationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: "overwrite" | "create_new") => void;
  isPending: boolean;
}

export function ImportDestinationDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: ImportDestinationDialogProps) {
  const [step, setStep] = useState<"choose" | "confirm-overwrite">("choose");

  function handleClose() {
    setStep("choose");
    onClose();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        {step === "choose" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Import data</AlertDialogTitle>
              <AlertDialogDescription>Choose where to import the data.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onConfirm("create_new")}
                disabled={isPending}
              >
                Create new household
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive"
                onClick={() => setStep("confirm-overwrite")}
                disabled={isPending}
              >
                Overwrite this household
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        )}
        {step === "confirm-overwrite" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Overwrite this household?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently replace all data in your current household with the imported
                data. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStep("choose")}>Back</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onConfirm("overwrite")}
                disabled={isPending}
              >
                {isPending ? "Importing…" : "Overwrite"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
