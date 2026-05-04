import { apiClient } from "@/lib/api";
import type {
  CashflowProjection,
  CashflowMonthDetail,
  CashflowProjectionQuery,
  LinkableAccountRow,
  BulkUpdateLinkedAccountsInput,
  CashflowShortfall,
  CashflowShortfallQuery,
} from "@finplan/shared";

/**
 * Build a URL query string from a record of parameters, skipping undefined values.
 * The frontend apiClient does not accept a `params` option, so services must
 * concatenate query strings manually.
 */
function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.append(key, String(value));
  }
  return `?${search.toString()}`;
}

export const cashflowService = {
  getProjection: (query: CashflowProjectionQuery = { monthCount: 12 }) =>
    apiClient.get<CashflowProjection>(
      `/api/cashflow/projection${toQueryString({
        startYear: query.startYear,
        startMonth: query.startMonth,
        monthCount: query.monthCount,
      })}`
    ),

  getMonthDetail: (year: number, month: number) =>
    apiClient.get<CashflowMonthDetail>(`/api/cashflow/month${toQueryString({ year, month })}`),

  listLinkableAccounts: () =>
    apiClient.get<LinkableAccountRow[]>("/api/cashflow/linkable-accounts"),

  updateLinkedAccount: (accountId: string, isCashflowLinked: boolean) =>
    apiClient.patch<LinkableAccountRow>(`/api/cashflow/linkable-accounts/${accountId}`, {
      isCashflowLinked,
    }),

  bulkUpdateLinkedAccounts: (input: BulkUpdateLinkedAccountsInput) =>
    apiClient.post<LinkableAccountRow[]>("/api/cashflow/linkable-accounts/bulk", input),

  getShortfall: (query: CashflowShortfallQuery = { windowDays: 30 }) =>
    apiClient.get<CashflowShortfall>(
      `/api/cashflow/shortfall${toQueryString({ windowDays: query.windowDays })}`
    ),
};
