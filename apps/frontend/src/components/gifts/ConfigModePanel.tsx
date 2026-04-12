import { useState } from "react";
import { ConfigPeoplePanel } from "./ConfigPeoplePanel";
import { ConfigEventsPanel } from "./ConfigEventsPanel";
import { ConfigPlannerModePanel } from "./ConfigPlannerModePanel";
import { QuickAddPanel } from "./QuickAddPanel";
import type { GiftPlannerMode } from "@finplan/shared";

type Drill = "list" | "people" | "events" | "mode" | "quickadd";
type Props = { currentMode: GiftPlannerMode; readOnly: boolean; year: number };

export function ConfigModePanel({ currentMode, readOnly, year }: Props) {
  const [drill, setDrill] = useState<Drill>("list");

  if (drill === "list") {
    return (
      <div className="flex h-full flex-col">
        <div className="px-6 py-4 flex items-center border-b border-foreground/5">
          <h2 className="font-heading text-base font-bold text-foreground">Config</h2>
        </div>
        <ul className="divide-y divide-foreground/5">
          {[
            { id: "people" as Drill, label: "People" },
            { id: "events" as Drill, label: "Events" },
            { id: "mode" as Drill, label: "Mode" },
            { id: "quickadd" as Drill, label: "Quick add" },
          ].map((row) => (
            <li
              key={row.id}
              role="button"
              tabIndex={0}
              onClick={() => setDrill(row.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDrill(row.id);
                }
              }}
              className="cursor-pointer px-6 py-3 text-sm text-foreground hover:bg-foreground/5"
            >
              {row.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={() => setDrill("list")}
        className="px-6 py-3 text-left text-xs text-foreground/50 hover:text-foreground"
      >
        ← Config / {labelFor(drill)}
      </button>
      {drill === "people" && <ConfigPeoplePanel readOnly={readOnly} year={year} />}
      {drill === "events" && <ConfigEventsPanel readOnly={readOnly} />}
      {drill === "mode" && <ConfigPlannerModePanel currentMode={currentMode} readOnly={readOnly} />}
      {drill === "quickadd" && <QuickAddPanel year={year} readOnly={readOnly} />}
    </div>
  );
}

function labelFor(drill: Drill): string {
  switch (drill) {
    case "people":
      return "People";
    case "events":
      return "Events";
    case "mode":
      return "Mode";
    case "quickadd":
      return "Quick add";
    default:
      return "";
  }
}
