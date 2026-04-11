/**
 * Shared validation schemas and types
 */

// Household schemas and types
export {
  createHouseholdSchema,
  renameHouseholdSchema,
  createHouseholdInviteSchema,
  acceptInviteSchema,
  updateMemberRoleSchema,
  createMemberSchema,
  updateMemberSchema,
  deleteMemberSchema,
  type CreateHouseholdInput,
  type RenameHouseholdInput,
  type CreateHouseholdInviteInput,
  type AcceptInviteInput,
  type UpdateMemberRoleInput,
  type CreateMemberInput,
  type UpdateMemberInput,
  type DeleteMemberInput,
} from "./household.schemas";

// Waterfall schemas and types
export {
  IncomeFrequencyEnum,
  IncomeTypeEnum,
  WaterfallItemTypeEnum,
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
  createCommittedBillSchema,
  updateCommittedBillSchema,
  createYearlyBillSchema,
  updateYearlyBillSchema,
  createDiscretionaryCategorySchema,
  updateDiscretionaryCategorySchema,
  createSavingsAllocationSchema,
  updateSavingsAllocationSchema,
  confirmBatchSchema,
  deleteAllWaterfallSchema,
  SpendTypeEnum,
  WaterfallTierEnum,
  createCommittedItemSchema,
  updateCommittedItemSchema,
  createDiscretionaryItemSchema,
  updateDiscretionaryItemSchema,
  type IncomeFrequency,
  type IncomeType,
  type WaterfallItemType,
  type CreateIncomeSourceInput,
  type UpdateIncomeSourceInput,
  type CreateCommittedBillInput,
  type UpdateCommittedBillInput,
  type CreateYearlyBillInput,
  type UpdateYearlyBillInput,
  type CreateDiscretionaryCategoryInput,
  type UpdateDiscretionaryCategoryInput,
  type CreateSavingsAllocationInput,
  type UpdateSavingsAllocationInput,
  type ConfirmBatchInput,
  type DeleteAllWaterfallInput,
  type SpendType,
  type WaterfallTier,
  type SubcategoryRow,
  type SubcategoryTotal,
  type CreateCommittedItemInput,
  type UpdateCommittedItemInput,
  type CreateDiscretionaryItemInput,
  type UpdateDiscretionaryItemInput,
  type WaterfallSummary,
  type IncomeByType,
  type IncomeSourceRow,
  type CommittedBillRow,
  type YearlyBillRow,
  type DiscretionaryCategoryRow,
  type SavingsAllocationRow,
  type CashflowMonth,
  ItemLifecycleStateEnum,
  type ItemLifecycleState,
  PeriodItemTypeEnum,
  type PeriodItemType,
  createPeriodSchema,
  updatePeriodSchema,
  type CreatePeriodInput,
  type UpdatePeriodInput,
  type PeriodRow,
  batchSaveSubcategoriesSchema,
  resetSubcategoriesSchema,
  type BatchSaveSubcategoriesInput,
  type SubcategoryEntry,
  type SubcategoryReassignment,
  type ResetSubcategoriesInput,
} from "./waterfall.schemas";

// Settings schemas and types
export {
  stalenessThresholdsSchema,
  updateSettingsSchema,
  type StalenessThresholds,
  type UpdateSettingsInput,
} from "./settings.schemas";

// Snapshot schemas and types
export {
  createSnapshotSchema,
  renameSnapshotSchema,
  FinancialSummarySchema,
  SparklinePointSchema,
  type CreateSnapshotInput,
  type RenameSnapshotInput,
  type FinancialSummary,
  type SparklinePoint,
} from "./snapshot.schemas";

// Review session schemas and types
export {
  confirmedItemsSchema,
  updatedItemsSchema,
  updateReviewSessionSchema,
  type UpdateReviewSessionInput,
} from "./review-session.schemas";

// Setup session schemas and types
export { updateSetupSessionSchema, type UpdateSetupSessionInput } from "./setup-session.schemas";

// Assets schemas and types
export * from "./assets.schemas.js";

// Audit schemas and types
export * from "./audit.schemas";

// Planner schemas and types
export {
  PurchasePriorityEnum,
  PurchaseStatusEnum,
  GiftEventTypeEnum,
  GiftRecurrenceEnum,
  createPurchaseSchema,
  updatePurchaseSchema,
  upsertYearBudgetSchema,
  createGiftPersonSchema,
  updateGiftPersonSchema,
  createGiftEventSchema,
  updateGiftEventSchema,
  upsertGiftYearRecordSchema,
  type PurchasePriority,
  type PurchaseStatus,
  type GiftEventType,
  type GiftRecurrence,
  type CreatePurchaseInput,
  type UpdatePurchaseInput,
  type UpsertYearBudgetInput,
  type CreateGiftPersonInput,
  type UpdateGiftPersonInput,
  type CreateGiftEventInput,
  type UpdateGiftEventInput,
  type UpsertGiftYearRecordInput,
} from "./planner.schemas";

// Export/Import schemas and types
export {
  householdExportSchema,
  importOptionsSchema,
  importResultSchema,
  CURRENT_EXPORT_SCHEMA_VERSION,
  type HouseholdExport,
  type ImportOptions,
  type ImportResult,
} from "./export-import.schemas";

// Cashflow schemas and types
export * from "./cashflow.schemas";

// Forecast schemas and types
export {
  ForecastHorizonSchema,
  ForecastQuerySchema,
  NetWorthPointSchema,
  SurplusPointSchema,
  RetirementPointSchema,
  RetirementMemberProjectionSchema,
  ForecastProjectionSchema,
  type ForecastHorizon,
  type ForecastQuery,
  type NetWorthPoint,
  type SurplusPoint,
  type RetirementPoint,
  type RetirementMemberProjection,
  type ForecastProjection,
} from "./forecast.schemas";
