import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useDeleteAllWaterfall } from "@/hooks/useWaterfall";
import { Section } from "./Section";

export function RebuildWaterfallSection() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const deleteAll = useDeleteAllWaterfall();

  function handleConfirm() {
    deleteAll.mutate(undefined, {
      onSuccess: () => {
        toast.success("Waterfall cleared — build it again from scratch");
        setIsOpen(false);
        navigate("/waterfall");
      },
      onError: () => {
        toast.error("Could not clear the waterfall. Please try again.");
        setIsOpen(false);
      },
    });
  }

  return (
    <Section id="rebuild-waterfall" title="Rebuild waterfall">
      <p className="text-sm text-muted-foreground">
        Delete all income sources, committed spend, and discretionary items so you can start over.
        This cannot be undone.
      </p>
      <Button variant="destructive" size="sm" onClick={() => setIsOpen(true)}>
        Rebuild from scratch
      </Button>

      <AlertDialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rebuild from scratch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all income sources, committed spend, and discretionary
              items in your waterfall. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAll.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={deleteAll.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAll.isPending ? "Clearing…" : "Yes, clear everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}
