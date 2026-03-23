/**
 * Shared validation schemas and types
 */

// Household schemas and types
export {
  createHouseholdSchema,
  renameHouseholdSchema,
  createHouseholdInviteSchema,
  acceptInviteSchema,
  type CreateHouseholdInput,
  type RenameHouseholdInput,
  type CreateHouseholdInviteInput,
  type AcceptInviteInput,
} from "./household.schemas";

// Waterfall schemas and types
export {
  IncomeFrequencyEnum,
  WaterfallItemTypeEnum,
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
  endIncomeSourceSchema,
  createCommittedBillSchema,
  updateCommittedBillSchema,
  createYearlyBillSchema,
  updateYearlyBillSchema,
  createDiscretionaryCategorySchema,
  updateDiscretionaryCategorySchema,
  createSavingsAllocationSchema,
  updateSavingsAllocationSchema,
  confirmBatchSchema,
  type IncomeFrequency,
  type WaterfallItemType,
  type CreateIncomeSourceInput,
  type UpdateIncomeSourceInput,
  type EndIncomeSourceInput,
  type CreateCommittedBillInput,
  type UpdateCommittedBillInput,
  type CreateYearlyBillInput,
  type UpdateYearlyBillInput,
  type CreateDiscretionaryCategoryInput,
  type UpdateDiscretionaryCategoryInput,
  type CreateSavingsAllocationInput,
  type UpdateSavingsAllocationInput,
  type ConfirmBatchInput,
  type WaterfallSummary,
  type IncomeSourceRow,
  type CommittedBillRow,
  type YearlyBillRow,
  type DiscretionaryCategoryRow,
  type SavingsAllocationRow,
  type CashflowMonth,
} from "./waterfall.schemas";
