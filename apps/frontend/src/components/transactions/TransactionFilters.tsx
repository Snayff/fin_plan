import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountService } from '../../services/account.service';
import { categoryService } from '../../services/category.service';
import type { TransactionFilters as Filters } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface TransactionFiltersProps {
  onFilterChange: (filters: Filters) => void;
  currentFilters: Filters;
}

export default function TransactionFilters({ onFilterChange, currentFilters }: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const handleChange = (key: keyof Filters, value: any) => {
    onFilterChange({ ...currentFilters, [key]: value || undefined });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-foreground">Filters</h3>
          <div className="flex space-x-2">
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary-hover"
              >
                Clear All
              </Button>
            )}
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Type</Label>
              <select
                value={currentFilters.type || ''}
                onChange={(e) => handleChange('type', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Account</Label>
              <select
                value={currentFilters.accountId || ''}
                onChange={(e) => handleChange('accountId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Category</Label>
              <select
                value={currentFilters.categoryId || ''}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parentCategoryId && '  ↳ '}
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Search</Label>
              <Input
                type="text"
                value={currentFilters.search || ''}
                onChange={(e) => handleChange('search', e.target.value)}
                placeholder="Search description..."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Start Date</Label>
              <Input
                type="date"
                value={currentFilters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">End Date</Label>
              <Input
                type="date"
                value={currentFilters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Min Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={currentFilters.minAmount || ''}
                onChange={(e) => handleChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Max Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={currentFilters.maxAmount || ''}
                onChange={(e) => handleChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
                className="text-sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
