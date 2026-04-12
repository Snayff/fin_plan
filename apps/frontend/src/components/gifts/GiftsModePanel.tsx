import { useState } from "react";
import { GiftPersonList } from "./GiftPersonList";
import { GiftPersonDetail } from "./GiftPersonDetail";
import type { GiftPersonRow } from "@finplan/shared";

type Props = { people: GiftPersonRow[]; year: number; readOnly: boolean };

export function GiftsModePanel({ people, year, readOnly }: Props) {
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  if (activePersonId) {
    return (
      <GiftPersonDetail
        personId={activePersonId}
        year={year}
        onBack={() => setActivePersonId(null)}
        readOnly={readOnly}
      />
    );
  }
  return <GiftPersonList people={people} onSelect={setActivePersonId} />;
}
