import { useState } from "react";
import { useSetGiftMode } from "@/hooks/useGifts";
import { ModeSwitchConfirmDialog } from "./ModeSwitchConfirmDialog";
import { InfoTip } from "@/components/ui/InfoTip";
import type { GiftPlannerMode } from "@finplan/shared";

type Props = { currentMode: GiftPlannerMode; readOnly: boolean };

export function ConfigPlannerModePanel({ currentMode, readOnly }: Props) {
  const [pending, setPending] = useState<GiftPlannerMode | null>(null);
  const setMode = useSetGiftMode();

  const choose = (mode: GiftPlannerMode) => {
    if (mode === currentMode) return;
    setPending(mode);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 flex items-center border-b border-foreground/5">
        <h2 className="font-heading text-base font-bold text-foreground">Mode</h2>
      </div>
      <div className="flex-1 p-6">
        <fieldset className="flex flex-col gap-2 text-sm text-foreground">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="planner-mode"
              checked={currentMode === "synced"}
              disabled={readOnly}
              onChange={() => choose("synced")}
            />
            <InfoTip text="The gift planner creates and manages a 'Gifts' item in your Discretionary waterfall tier. Your annual gift budget is deducted from your surplus automatically.">
              Synced
            </InfoTip>{" "}
            — annual budget flows into the waterfall
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="planner-mode"
              checked={currentMode === "independent"}
              disabled={readOnly}
              onChange={() => choose("independent")}
            />
            <InfoTip text="The gift planner runs standalone with no connection to your waterfall. Useful if you track gifts separately or haven't set up a waterfall yet.">
              Independent
            </InfoTip>{" "}
            — planner runs standalone, no waterfall link
          </label>
        </fieldset>
        {pending && (
          <ModeSwitchConfirmDialog
            fromMode={currentMode}
            toMode={pending}
            onCancel={() => setPending(null)}
            onConfirm={() => {
              setMode.mutate({ mode: pending });
              setPending(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
