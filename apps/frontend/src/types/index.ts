// Import shared types from the shared package
import type {
  AccountType as SharedAccountType,
  CreateAccountInput as SharedCreateAccountInput,
  CategoryType as SharedCategoryType,
  CreateCategoryInput as SharedCreateCategoryInput,
  TransactionType as SharedTransactionType,
  RecurrenceType as SharedRecurrenceType,
  CreateTransactionInput as SharedCreateTransactionInput,
} from '@finplan/shared';

// Re-export for backward compatibility
export type AccountType = SharedAccountType;
export type CreateAccountInput = SharedCreateAccountInput;
export type CategoryType = SharedCategoryType;
export type CreateCategoryInput = SharedCreateCategoryInput;
export type TransactionType = SharedTransactionType;
export type RecurrenceType = SharedRecurrenceType;
export type CreateTransactionInput = SharedCreateTransactionInput;

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  subtype: string | null;
  balance: number;
  currency: string;
  isActive: boolean;
  description: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}


export interface Category {
  id: string;
  userId: string | null;
  name: string;
  type: CategoryType;
  parentCategoryId: string | null;
  color: string;
  icon: string | null;
  isSystemCategory: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  subcategories?: Category[];
}


export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  date: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  name: string | null;
  description: string | null;
  memo: string | null;
  tags: string[];
  isRecurring: boolean;
  recurringRuleId: string | null;
  recurrence: RecurrenceType;
  recurrence_end_date: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
    type: AccountType;
  };
  category?: {
    id: string;
    name: string;
    type: CategoryType;
    color: string;
  };
  subcategory?: {
    id: string;
    name: string;
    color: string;
  } | null;
}


export interface TransactionFilters {
  accountId?: string;
  type?: TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TransactionSummary {
  income: {
    total: number;
    count: number;
  };
  expense: {
    total: number;
    count: number;
  };
  netCashFlow: number;
  totalTransactions: number;
}

// Dashboard types
export interface DashboardSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalBalance: number;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpense: number;
    netCashFlow: number;
    savingsRate: string;
  };
  accounts: Account[];
  recentTransactions: Transaction[];
  topCategories: {
    category: {
      id: string;
      name: string;
      color: string;
    } | undefined;
    amount: number;
  }[];
  transactionCounts: {
    income: number;
    expense: number;
    total: number;
  };
}

export interface TrendData {
  month: string;
  balance?: number;
  income?: number;
  expense?: number;
  net?: number;
}
