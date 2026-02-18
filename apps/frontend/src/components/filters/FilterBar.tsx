import { SearchIcon, XIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import type { FilterBarConfig, FilterValues } from '../../types';

interface FilterBarProps {
  config: FilterBarConfig;
  filters: FilterValues;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  totalCount: number;
  filteredCount: number;
}

export default function FilterBar({
  config,
  filters,
  onFilterChange,
  onClearAll,
  activeFilterCount,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {config.fields.map(field => {
          if (field.type === 'search') {
            return (
              <div key={field.key} className="relative flex-1 min-w-[200px] w-full sm:w-auto">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={(filters[field.key] as string) || ''}
                  onChange={(e) => onFilterChange(field.key, e.target.value || undefined)}
                  placeholder={field.placeholder || `Search ${config.entityName}...`}
                  className="pl-9 h-10 text-sm"
                  aria-label={field.label}
                />
              </div>
            );
          }

          if (field.type === 'select' || field.type === 'boolean-select') {
            return (
              <Select
                key={field.key}
                value={(filters[field.key] as string) || '__all__'}
                onValueChange={(val) => onFilterChange(field.key, val === '__all__' ? undefined : val)}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-10" aria-label={field.label}>
                  <SelectValue placeholder={field.allLabel || `All ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{field.allLabel || `All ${field.label}`}</SelectItem>
                  {field.options?.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          return null;
        })}

        <div className="flex items-center gap-3 sm:ml-auto">
          {activeFilterCount > 0 && (
            <Button
              onClick={onClearAll}
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary-hover gap-1"
            >
              <XIcon className="h-3 w-3" />
              Clear all
            </Button>
          )}
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {activeFilterCount > 0
                ? `Showing ${filteredCount} of ${totalCount}`
                : `${totalCount} ${config.entityName}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
