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
  allocatePaymentSchema,
  LiabilityTypeEnum,
  InterestTypeEnum,
  PaymentFrequencyEnum,
  type LiabilityType,
  type InterestType,
  type PaymentFrequency,
  type CreateLiabilityInput,
  type UpdateLiabilityInput,
  type AllocatePaymentInput,
} from './liability.schemas';
