import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
