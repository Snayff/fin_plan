// Import shared types from the shared package
import type {
  AccountType as SharedAccountType,
  CreateAccountInput as SharedCreateAccountInput,
  CategoryType as SharedCategoryType,
  CreateCategoryInput as SharedCreateCategoryInput,
  TransactionType as SharedTransactionType,
  RecurrenceType as SharedRecurrenceType,
  CreateTransactionInput as SharedCreateTransactionInput,
  AssetType as SharedAssetType,
  LiquidityType as SharedLiquidityType,
  ValueSource as SharedValueSource,
  CreateAssetInput as SharedCreateAssetInput,
  UpdateAssetInput as SharedUpdateAssetInput,
  UpdateAssetValueInput as SharedUpdateAssetValueInput,
  LiabilityType as SharedLiabilityType,
  InterestType as SharedInterestType,
  PaymentFrequency as SharedPaymentFrequency,
  CreateLiabilityInput as SharedCreateLiabilityInput,
  UpdateLiabilityInput as SharedUpdateLiabilityInput,
  AllocatePaymentInput as SharedAllocatePaymentInput,
  GoalType as SharedGoalType,
  Priority as SharedPriority,
  GoalStatus as SharedGoalStatus,
  CreateGoalInput as SharedCreateGoalInput,
  UpdateGoalInput as SharedUpdateGoalInput,
  CreateGoalContributionInput as SharedCreateGoalContributionInput,
  LinkTransactionToGoalInput as SharedLinkTransactionToGoalInput,
} from '@finplan/shared';

// Re-export for backward compatibility
export type AccountType = SharedAccountType;
export type CreateAccountInput = SharedCreateAccountInput;
export type CategoryType = SharedCategoryType;
export type CreateCategoryInput = SharedCreateCategoryInput;
export type TransactionType = SharedTransactionType;
export type RecurrenceType = SharedRecurrenceType;
export type CreateTransactionInput = SharedCreateTransactionInput;
export type AssetType = SharedAssetType;
export type LiquidityType = SharedLiquidityType;
export type ValueSource = SharedValueSource;
export type CreateAssetInput = SharedCreateAssetInput;
export type UpdateAssetInput = SharedUpdateAssetInput;
export type UpdateAssetValueInput = SharedUpdateAssetValueInput;
export type LiabilityType = SharedLiabilityType;
export type InterestType = SharedInterestType;
export type PaymentFrequency = SharedPaymentFrequency;
export type CreateLiabilityInput = SharedCreateLiabilityInput;
export type UpdateLiabilityInput = SharedUpdateLiabilityInput;
export type AllocatePaymentInput = SharedAllocatePaymentInput;
export type GoalType = SharedGoalType;
export type Priority = SharedPriority;
export type GoalStatus = SharedGoalStatus;
export type CreateGoalInput = SharedCreateGoalInput;
export type UpdateGoalInput = SharedUpdateGoalInput;
export type CreateGoalContributionInput = SharedCreateGoalContributionInput;
export type LinkTransactionToGoalInput = SharedLinkTransactionToGoalInput;

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

export interface EnhancedAccount extends Account {
  balanceHistory: Array<{
    date: string;
    balance: number;
  }>;
  monthlyFlow: {
    income: number;
    expense: number;
  };
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

// ---- Generic filter system types ----

export type FilterFieldType = 'search' | 'select' | 'boolean-select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  options?: FilterOption[];
  allLabel?: string;
  /** For client-side search: which string fields to match against */
  matchFields?: string[];
  /** For client-side select/boolean-select: which field to match */
  matchField?: string;
}

export interface FilterBarConfig {
  entityName: string;
  fields: FilterFieldConfig[];
}

export type FilterValues = Record<string, string | number | boolean | undefined>;

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

// Asset types
export interface Asset {
  id: string;
  userId: string;
  name: string;
  type: AssetType;
  currentValue: number;
  purchaseValue: number | null;
  purchaseDate: string | null;
  expectedGrowthRate: number;
  liquidityType: LiquidityType;
  accountId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AssetValueHistory {
  id: string;
  assetId: string;
  value: number;
  date: string;
  source: ValueSource;
  createdAt: string;
}

export interface EnhancedAsset extends Asset {
  valueHistory: AssetValueHistory[];
  totalGain: number | null;
  totalGainPercent: number | null;
}

export interface AssetSummary {
  totalValue: number;
  totalAssets: number;
  totalGain: number;
  totalGainPercent: number;
  byType: Array<{
    type: AssetType;
    value: number;
    count: number;
  }>;
}

// Liability types
export interface Liability {
  id: string;
  userId: string;
  name: string;
  type: LiabilityType;
  currentBalance: number;
  originalAmount: number;
  interestRate: number;
  interestType: InterestType;
  minimumPayment: number;
  paymentFrequency: PaymentFrequency;
  payoffDate: string | null;
  accountId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LiabilityPayment {
  id: string;
  liabilityId: string;
  transactionId: string;
  principalAmount: number;
  interestAmount: number;
  paymentDate: string;
  createdAt: string;
  transaction?: Transaction;
}

export interface EnhancedLiability extends Liability {
  payments: LiabilityPayment[];
  totalPaid: number;
  totalInterestPaid: number;
  projectedPayoffDate: string | null;
}

export interface AmortizationEntry {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface PayoffProjection {
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number;
  projectedPayoffDate: string | null;
  totalInterestToPay: number;
  schedule: AmortizationEntry[];
}

export interface LiabilitySummary {
  totalDebt: number;
  totalLiabilities: number;
  monthlyMinimumPayment: number;
  weightedAverageInterestRate: number;
  byType: Array<{
    type: LiabilityType;
    balance: number;
    count: number;
  }>;
}

// Dashboard types
export interface DashboardSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalBalance: number;
    totalAssets: number;
    totalLiabilities: number;
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
  assets?: number;
  liabilities?: number;
  netWorth?: number;
  income?: number;
  expense?: number;
  net?: number;
}

// Goal types
export interface Goal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  priority: Priority;
  status: GoalStatus;
  icon: string | null;
  linkedAccountId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  linkedAccount?: Account;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  transactionId: string | null;
  amount: number;
  date: string;
  notes: string | null;
  transaction?: {
    id: string;
    name: string | null;
    amount: number;
    date: string;
    type?: TransactionType;
  };
}

export interface EnhancedGoal extends Goal {
  contributions: GoalContribution[];
  progressPercentage: number;
  daysRemaining: number | null;
  averageMonthlyContribution: number;
  projectedCompletionDate: string | null;
  recommendedMonthlyContribution: number | null;
  isOnTrack: boolean;
}

export interface GoalSummary {
  totalSaved: number;
  totalTarget: number;
  activeGoals: number;
  completedGoals: number;
  byType: Array<{
    type: GoalType;
    saved: number;
    target: number;
    count: number;
  }>;
  byPriority: Array<{
    priority: Priority;
    saved: number;
    target: number;
    count: number;
  }>;
}
