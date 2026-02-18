import type { FilterBarConfig, FilterOption } from '../types';

function formatLabel(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function enumToOptions(values: readonly string[]): FilterOption[] {
  return values.map(v => ({ value: v, label: formatLabel(v) }));
}

export const accountFilterConfig: FilterBarConfig = {
  entityName: 'accounts',
  fields: [
    {
      key: 'search',
      label: 'Search accounts',
      type: 'search',
      placeholder: 'Search accounts...',
      matchFields: ['name', 'description'],
    },
    {
      key: 'type',
      label: 'Account type',
      type: 'select',
      allLabel: 'All Types',
      matchField: 'type',
      options: enumToOptions([
        'current', 'savings', 'isa', 'stocks_and_shares_isa',
        'credit', 'investment', 'loan', 'asset', 'liability',
      ]),
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'boolean-select',
      allLabel: 'All Statuses',
      matchField: 'isActive',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ],
};

export const assetFilterConfig: FilterBarConfig = {
  entityName: 'assets',
  fields: [
    {
      key: 'search',
      label: 'Search assets',
      type: 'search',
      placeholder: 'Search assets...',
      matchFields: ['name'],
    },
    {
      key: 'type',
      label: 'Asset type',
      type: 'select',
      allLabel: 'All Types',
      matchField: 'type',
      options: enumToOptions([
        'housing', 'investment', 'vehicle', 'business', 'personal_property', 'crypto',
      ]),
    },
    {
      key: 'liquidityType',
      label: 'Liquidity',
      type: 'select',
      allLabel: 'All Liquidity',
      matchField: 'liquidityType',
      options: enumToOptions(['liquid', 'semi_liquid', 'illiquid']),
    },
  ],
};

export const liabilityFilterConfig: FilterBarConfig = {
  entityName: 'liabilities',
  fields: [
    {
      key: 'search',
      label: 'Search liabilities',
      type: 'search',
      placeholder: 'Search liabilities...',
      matchFields: ['name'],
    },
    {
      key: 'type',
      label: 'Liability type',
      type: 'select',
      allLabel: 'All Types',
      matchField: 'type',
      options: enumToOptions([
        'mortgage', 'auto_loan', 'student_loan', 'credit_card', 'personal_loan', 'line_of_credit',
      ]),
    },
    {
      key: 'interestType',
      label: 'Interest type',
      type: 'select',
      allLabel: 'All Interest Types',
      matchField: 'interestType',
      options: enumToOptions(['fixed', 'variable']),
    },
  ],
};

export const goalFilterConfig: FilterBarConfig = {
  entityName: 'goals',
  fields: [
    {
      key: 'search',
      label: 'Search goals',
      type: 'search',
      placeholder: 'Search goals...',
      matchFields: ['name', 'description'],
    },
    {
      key: 'type',
      label: 'Goal type',
      type: 'select',
      allLabel: 'All Types',
      matchField: 'type',
      options: enumToOptions([
        'savings', 'debt_payoff', 'net_worth', 'purchase', 'investment', 'income',
      ]),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      allLabel: 'All Statuses',
      matchField: 'status',
      options: enumToOptions(['active', 'completed', 'archived']),
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      allLabel: 'All Priorities',
      matchField: 'priority',
      options: enumToOptions(['high', 'medium', 'low']),
    },
  ],
};

export function buildTransactionFilterConfig(
  accounts: Array<{ id: string; name: string }>,
  categories: Array<{ id: string; name: string; parentCategoryId: string | null }>,
): FilterBarConfig {
  return {
    entityName: 'transactions',
    fields: [
      {
        key: 'search',
        label: 'Search transactions',
        type: 'search',
        placeholder: 'Search transactions...',
        matchFields: ['description', 'memo', 'name'],
      },
      {
        key: 'type',
        label: 'Transaction type',
        type: 'select',
        allLabel: 'All Types',
        matchField: 'type',
        options: enumToOptions(['income', 'expense', 'transfer']),
      },
      {
        key: 'accountId',
        label: 'Account',
        type: 'select',
        allLabel: 'All Accounts',
        matchField: 'accountId',
        options: accounts.map(a => ({ value: a.id, label: a.name })),
      },
      {
        key: 'categoryId',
        label: 'Category',
        type: 'select',
        allLabel: 'All Categories',
        matchField: 'categoryId',
        options: categories.map(c => ({
          value: c.id,
          label: c.parentCategoryId ? `  ↳ ${c.name}` : c.name,
        })),
      },
      {
        key: 'isGenerated',
        label: 'Recurring',
        type: 'boolean-select',
        allLabel: 'All Transactions',
        matchField: 'isGenerated',
        options: [
          { value: 'true', label: 'Recurring only' },
          { value: 'false', label: 'One-time only' },
        ],
      },
    ],
  };
}
