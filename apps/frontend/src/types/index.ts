// Import shared types from the shared package
import type {
  AccountType as SharedAccountType,
  CreateAccountInput as SharedCreateAccountInput,
  CategoryType as SharedCategoryType,
  CreateCategoryInput as SharedCreateCategoryInput,
  TransactionType as SharedTransactionType,
  RecurrenceType as SharedRecurrenceType,
  CreateTransactionInput as SharedCreateTransactionInput,
  RecurringFrequency as SharedRecurringFrequency,
  UpdateScope as SharedUpdateScope,
  TemplateTransaction as SharedTemplateTransaction,
  CreateRecurringRuleInput as SharedCreateRecurringRuleInput,
  UpdateRecurringRuleInput as SharedUpdateRecurringRuleInput,
  PreviewOccurrencesInput as SharedPreviewOccurrencesInput,
  AssetType as SharedAssetType,
  LiquidityType as SharedLiquidityType,
  ValueSource as SharedValueSource,
  CreateAssetInput as SharedCreateAssetInput,
  UpdateAssetInput as SharedUpdateAssetInput,
  UpdateAssetValueInput as SharedUpdateAssetValueInput,
  LiabilityType as SharedLiabilityType,
  InterestType as SharedInterestType,
  CreateLiabilityInput as SharedCreateLiabilityInput,
  UpdateLiabilityInput as SharedUpdateLiabilityInput,
  GoalType as SharedGoalType,
  Priority as SharedPriority,
  GoalStatus as SharedGoalStatus,
  CreateGoalInput as SharedCreateGoalInput,
  UpdateGoalInput as SharedUpdateGoalInput,
  CreateGoalContributionInput as SharedCreateGoalContributionInput,
  LinkTransactionToGoalInput as SharedLinkTransactionToGoalInput,
  BudgetPeriod as SharedBudgetPeriod,
  CreateBudgetInput as SharedCreateBudgetInput,
  UpdateBudgetInput as SharedUpdateBudgetInput,
  AddBudgetItemInput as SharedAddBudgetItemInput,
  UpdateBudgetItemInput as SharedUpdateBudgetItemInput,
} from '@finplan/shared';

// Re-export for backward compatibility
export type AccountType = SharedAccountType;
export type CreateAccountInput = SharedCreateAccountInput;
export type CategoryType = SharedCategoryType;
export type CreateCategoryInput = SharedCreateCategoryInput;
export type TransactionType = SharedTransactionType;
export type RecurrenceType = SharedRecurrenceType;
export type CreateTransactionInput = SharedCreateTransactionInput;
export type RecurringFrequency = SharedRecurringFrequency;
export type UpdateScope = SharedUpdateScope;
export type TemplateTransaction = SharedTemplateTransaction;
export type CreateRecurringRuleInput = SharedCreateRecurringRuleInput;
export type UpdateRecurringRuleInput = SharedUpdateRecurringRuleInput;
export type PreviewOccurrencesInput = SharedPreviewOccurrencesInput;
export type AssetType = SharedAssetType;
export type LiquidityType = SharedLiquidityType;
export type ValueSource = SharedValueSource;
export type CreateAssetInput = SharedCreateAssetInput;
export type UpdateAssetInput = SharedUpdateAssetInput;
export type UpdateAssetValueInput = SharedUpdateAssetValueInput;
export type LiabilityType = SharedLiabilityType;
export type InterestType = SharedInterestType;
export type CreateLiabilityInput = SharedCreateLiabilityInput;
export type UpdateLiabilityInput = SharedUpdateLiabilityInput;
export type GoalType = SharedGoalType;
export type Priority = SharedPriority;
export type GoalStatus = SharedGoalStatus;
export type CreateGoalInput = SharedCreateGoalInput;
export type UpdateGoalInput = SharedUpdateGoalInput;
export type CreateGoalContributionInput = SharedCreateGoalContributionInput;
export type LinkTransactionToGoalInput = SharedLinkTransactionToGoalInput;
export type BudgetPeriod = SharedBudgetPeriod;
export type CreateBudgetInput = SharedCreateBudgetInput;
export type UpdateBudgetInput = SharedUpdateBudgetInput;
export type AddBudgetItemInput = SharedAddBudgetItemInput;
export type UpdateBudgetItemInput = SharedUpdateBudgetItemInput;

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


export interface RecurringRule {
  id: string;
  userId: string;
  frequency: RecurringFrequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  occurrences: number | null;
  lastGeneratedDate: string | null;
  isActive: boolean;
  templateTransaction: TemplateTransaction;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  liabilityId?: string | null;
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
  isGenerated: boolean;
  overriddenFields: string[];
  generatedAt: string | null;
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
  liability?: {
    id: string;
    name: string;
    type: LiabilityType;
  } | null;
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
  interestRate: number;
  interestType: InterestType;
  openDate: string;
  termEndDate: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedLiability extends Liability {
  transactions: Array<{
    id: string;
    date: string;
    amount: number;
    name: string | null;
  }>;
  monthsRemaining: number;
  projectedBalanceAtTermEnd: number;
  projectedInterestAccrued: number;
  projectedTransactionImpact: number;
  projectionSchedule: ProjectionEntry[];
}

export interface ProjectionEntry {
  date: string;
  balance: number;
  accruedInterest: number;
  paymentApplied: number;
  interestPaid: number;
  principalPaid: number;
}

export interface PayoffProjection {
  liabilityId: string;
  currentBalance: number;
  interestRate: number;
  openDate: string;
  termEndDate: string;
  monthsRemaining: number;
  projectedBalanceAtTermEnd: number;
  projectedInterestAccrued: number;
  projectedTransactionImpact: number;
  totalInterestPaidByTransactions: number;
  totalPrincipalPaidByTransactions: number;
  schedule: ProjectionEntry[];
}

export interface LiabilitySummary {
  totalDebt: number;
  totalInterestRate: number;
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
    totalCash: number;
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
  cash?: number;
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
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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

// Budget types
export interface BudgetItem {
  id: string;
  budgetId: string;
  categoryId: string;
  allocatedAmount: number;
  carryover: boolean;
  rolloverAmount: number | null;
  notes: string | null;
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  };
}

export interface BudgetSummary {
  id: string;
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalAllocated: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudgetGroup {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  items: BudgetItem[];
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export interface EnhancedBudget {
  id: string;
  userId: string;
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryGroups: CategoryBudgetGroup[];
  expectedIncome: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  unallocated: number;
}
