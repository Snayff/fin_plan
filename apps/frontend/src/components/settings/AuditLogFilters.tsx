import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResourceSlugEnum } from "@finplan/shared";
import type { HouseholdMember } from "@/services/household.service";

type Filters = {
  actorId?: string;
  resource?: string;
  dateRange?: string;
};

type Props = {
  filters: Filters;
  members: HouseholdMember[];
  onChange: (filters: Filters) => void;
};

const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const RESOURCE_OPTIONS = [
  { value: "all", label: "All resources" },
  ...ResourceSlugEnum.options.map((slug) => ({
    value: slug,
    label: slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  })),
];

export function AuditLogFilters({ filters, members, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filters.actorId ?? "all"}
        onValueChange={(v) => onChange({ ...filters, actorId: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="All members" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All members</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.userId} value={m.userId}>
              {m.user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.resource ?? "all"}
        onValueChange={(v) => onChange({ ...filters, resource: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="All resources" />
        </SelectTrigger>
        <SelectContent>
          {RESOURCE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.dateRange ?? "all"}
        onValueChange={(v) => onChange({ ...filters, dateRange: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="All time" />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGES.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
