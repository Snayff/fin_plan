import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Section } from "./Section";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function DisplaySection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const showPence = settings?.showPence ?? false;

  function handleToggle() {
    updateSettings.mutate(
      { showPence: !showPence },
      { onSuccess: () => toast.success(showPence ? "Showing whole pounds" : "Showing pence") }
    );
  }

  return (
    <Section id="display" title="Display">
      <div className="flex items-start gap-3">
        <Checkbox
          id="show-pence"
          checked={showPence}
          onCheckedChange={handleToggle}
          disabled={updateSettings.isPending}
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor="show-pence" className="text-sm font-medium cursor-pointer">
            Show pence
          </Label>
          <p className="text-sm text-muted-foreground">
            Display pence on all financial values for full precision. When off, values are rounded
            to the nearest pound.
          </p>
        </div>
      </div>
    </Section>
  );
}
