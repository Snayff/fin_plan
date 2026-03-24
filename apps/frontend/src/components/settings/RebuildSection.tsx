import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { waterfallService } from "@/services/waterfall.service";
import { Section } from "./Section";

export function RebuildSection() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRebuild() {
    setDeleting(true);
    try {
      await waterfallService.deleteAll();
      toast.success("Waterfall cleared — set it up again from Overview");
      window.location.href = "/overview";
    } catch {
      toast.error("Failed to clear waterfall");
      setDeleting(false);
    }
  }

  return (
    <Section id="rebuild" title="Waterfall rebuild">
      <p className="text-sm text-muted-foreground">
        Remove all income, bills, discretionary categories, and savings allocations. This cannot be
        undone.
      </p>
      {!confirming ? (
        <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
          Rebuild from scratch
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Are you sure? All waterfall data will be deleted.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleRebuild} disabled={deleting}>
              {deleting ? "Clearing…" : "Yes, delete everything"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}
