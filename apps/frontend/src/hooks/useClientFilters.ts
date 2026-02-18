import { useMemo, useState, useCallback } from 'react';
import type { FilterValues, FilterFieldConfig } from '../types';

interface UseClientFiltersOptions<T> {
  items: T[];
  fields: FilterFieldConfig[];
}

interface UseClientFiltersResult<T> {
  filteredItems: T[];
  filters: FilterValues;
  setFilter: (key: string, value: string | number | boolean | undefined) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  totalCount: number;
  filteredCount: number;
}

export function useClientFilters<T extends Record<string, any>>({
  items,
  fields,
}: UseClientFiltersOptions<T>): UseClientFiltersResult<T> {
  const [filters, setFilters] = useState<FilterValues>({});

  const setFilter = useCallback((key: string, value: string | number | boolean | undefined) => {
    setFilters(prev => {
      const next = { ...prev };
      if (value === undefined || value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  const activeFilterCount = Object.keys(filters).length;

  const filteredItems = useMemo(() => {
    if (activeFilterCount === 0) return items;

    return items.filter(item => {
      return fields.every(field => {
        const filterValue = filters[field.key];
        if (filterValue === undefined || filterValue === '') return true;

        if (field.type === 'search' && field.matchFields) {
          const searchTerm = String(filterValue).toLowerCase();
          return field.matchFields.some(fieldName => {
            const val = item[fieldName];
            return val && String(val).toLowerCase().includes(searchTerm);
          });
        }

        if (field.type === 'select' && field.matchField) {
          return item[field.matchField] === filterValue;
        }

        if (field.type === 'boolean-select' && field.matchField) {
          return item[field.matchField] === (filterValue === 'true');
        }

        return true;
      });
    });
  }, [items, filters, fields, activeFilterCount]);

  return {
    filteredItems,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    totalCount: items.length,
    filteredCount: filteredItems.length,
  };
}
