import { toast } from "sonner";
import { format } from "date-fns";
import { useEndedIncome, useReactivateIncome } from "@/hooks/useSettings";
import { Section } from "./Section";

export function EndedIncomeSection() {
  const { data: ended = [] } = useEndedIncome();
  const reactivate = useReactivateIncome();

  return (
    <Section id="income-ended" title="Ended income sources">
      {ended.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No ended income sources</p>
      )}
      <div className="space-y-0.5">
        {(ended as any[]).map((source) => (
          <div
            key={source.id as string}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <div>
              <p className="text-sm font-medium">{source.name as string}</p>
              {source.endedAt && (
                <p className="text-xs text-muted-foreground">
                  Ended {format(new Date(source.endedAt as string), "dd MMM yyyy")}
                </p>
              )}
            </div>
            <button
              className="text-xs text-primary hover:underline disabled:opacity-50"
              disabled={reactivate.isPending}
              onClick={() =>
                reactivate.mutate(source.id as string, {
                  onSuccess: () => toast.success("Income source reactivated"),
                })
              }
            >
              Reactivate
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}
