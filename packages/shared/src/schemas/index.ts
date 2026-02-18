/**
 * Shared validation schemas and types
 * 
 * This package provides a single source of truth for validation logic
 * that can be used across both frontend and backend applications.
 */

// Transaction schemas and types
export {
  createTransactionSchema,
  updateTransactionSchema,
  TransactionTypeEnum,
  RecurrenceTypeEnum,
  type TransactionType,
  type RecurrenceType,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from './transaction.schemas';

// Recurring transaction schemas and types
export {
  createRecurringRuleSchema,
  updateRecurringRuleSchema,
  previewOccurrencesSchema,
  templateTransactionSchema,
  RecurringFrequencyEnum,
  UpdateScopeEnum,
  type RecurringFrequency,
  type UpdateScope,
  type TemplateTransaction,
  type CreateRecurringRuleInput,
  type UpdateRecurringRuleInput,
  type PreviewOccurrencesInput,
} from './recurring.schemas';

// Account schemas and types
export {
  createAccountSchema,
  updateAccountSchema,
  AccountTypeEnum,
  type AccountType,
  type CreateAccountInput,
  type UpdateAccountInput,
} from './account.schemas';

// Category schemas and types
export {
  createCategorySchema,
  updateCategorySchema,
  CategoryTypeEnum,
  type CategoryType,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from './category.schemas';

// Asset schemas and types
export {
  createAssetSchema,
  updateAssetSchema,
  updateAssetValueSchema,
  AssetTypeEnum,
  LiquidityTypeEnum,
  ValueSourceEnum,
  type AssetType,
  type LiquidityType,
  type ValueSource,
  type CreateAssetInput,
  type UpdateAssetInput,
  type UpdateAssetValueInput,
} from './asset.schemas';

// Liability schemas and types
export {
  createLiabilitySchema,
  updateLiabilitySchema,
  LiabilityTypeEnum,
  InterestTypeEnum,
  type LiabilityType,
  type InterestType,
  type CreateLiabilityInput,
  type UpdateLiabilityInput,
} from './liability.schemas';

// Goal schemas and types
export {
  createGoalSchema,
  updateGoalSchema,
  createGoalContributionSchema,
  linkTransactionToGoalSchema,
  GoalTypeEnum,
  PriorityEnum,
  GoalStatusEnum,
  type GoalType,
  type Priority,
  type GoalStatus,
  type CreateGoalInput,
  type UpdateGoalInput,
  type CreateGoalContributionInput,
  type LinkTransactionToGoalInput,
} from './goal.schemas';

// Budget schemas and types
export {
  createBudgetSchema,
  updateBudgetSchema,
  addBudgetItemSchema,
  updateBudgetItemSchema,
  BudgetPeriodEnum,
  type BudgetPeriod,
  type CreateBudgetInput,
  type UpdateBudgetInput,
  type AddBudgetItemInput,
  type UpdateBudgetItemInput,
} from './budget.schemas';
