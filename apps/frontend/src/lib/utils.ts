import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { BudgetPeriod, RecurringFrequency } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency with consistent formatting:
 * - Uses comma separators (e.g., £1,000)
 * - Shows decimals only when they exist (£1,000.50)
 * - Never shows trailing zeros (£1,000 not £1,000.00)
 * 
 * @param value - The numeric value to format
 * @param currency - The currency symbol (default: '£')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = '£'): string {
  return `${currency}${value.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'current',                label: 'Current' },
  { value: 'savings',                label: 'Savings' },
  { value: 'isa',                    label: 'ISA' },
  { value: 'stocks_and_shares_isa',  label: 'Stocks & Shares ISA' },
  { value: 'credit',                 label: 'Credit Card' },
  { value: 'investment',             label: 'Investment' },
  { value: 'loan',                   label: 'Loan' },
  { value: 'asset',                  label: 'Asset' },
  { value: 'liability',              label: 'Liability' },
] as const;

const PERIOD_DAYS: Record<BudgetPeriod, number> = {
  monthly: 365.25 / 12,   // 30.4375
  quarterly: 365.25 / 4,  // 91.3125
  annual: 365.25,
  custom: 365.25 / 12,    // fallback — caller should use actual days for custom periods
};

const FREQUENCY_DAYS: Record<RecurringFrequency, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 365.25 / 12,
  quarterly: 365.25 / 4,
  annually: 365.25,
  custom: 1,  // fallback
};

/**
 * Convert a per-frequency amount to the equivalent budget period total.
 * E.g. £100/week in a monthly budget = £100 × (30.4375 / 7) = £434.82
 */
export function convertToPeriodTotal(
  amount: number,
  entryFrequency: RecurringFrequency,
  budgetPeriod: BudgetPeriod
): number {
  const periodDays = PERIOD_DAYS[budgetPeriod];
  const frequencyDays = FREQUENCY_DAYS[entryFrequency];
  return Math.round(amount * (periodDays / frequencyDays) * 100) / 100;
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
  custom: 'Custom',
};
