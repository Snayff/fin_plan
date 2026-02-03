// Account types
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'asset' | 'liability';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  subtype: string | null;
  balance: number;
  currency: string;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  subtype?: string;
  balance: number;
  currency: string;
  metadata?: {
    institution?: string;
    accountNumber?: string;
    interestRate?: number;
    creditLimit?: number;
  };
}

// Category types
export type CategoryType = 'income' | 'expense';

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

// Transaction types
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  date: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  description: string;
  memo: string | null;
  tags: string[];
  isRecurring: boolean;
  recurringRuleId: string | null;
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

export interface CreateTransactionInput {
  accountId: string;
  date: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  memo?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringRuleId?: string;
  metadata?: Record<string, any>;
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
