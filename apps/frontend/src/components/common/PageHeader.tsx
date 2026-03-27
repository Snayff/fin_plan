import { toGBP } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";

interface PageHeaderProps {
  title: string;
  colorClass?: string;
  total?: number | null;
  totalColorClass?: string;
}

export function PageHeader({
  title,
  colorClass = "text-page-accent",
  total,
  totalColorClass,
}: PageHeaderProps) {
  return (
    <div className="shrink-0 px-4 pt-4 pb-3">
      <div className="flex items-center justify-between">
        <h1 className={`font-heading text-lg font-bold uppercase tracking-tier ${colorClass}`}>
          {title}
        </h1>
        {total != null && (
          <span className={`font-numeric text-lg font-semibold ${totalColorClass ?? colorClass}`}>
            {formatCurrency(toGBP(total))}
          </span>
        )}
      </div>
    </div>
  );
}
