import { addMonths, format } from 'date-fns';

export interface AmortizationEntry {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calculate monthly interest amount
 */
export function calculateMonthlyInterest(balance: number, annualRate: number): number {
  if (balance <= 0 || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  return balance * monthlyRate;
}

/**
 * Calculate estimated payoff date based on balance, rate, and payment
 */
export function calculatePayoffDate(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  startDate: Date = new Date()
): Date | null {
  if (balance <= 0) return startDate;
  if (monthlyPayment <= 0) return null; // Cannot pay off with no payment

  const monthlyRate = annualRate / 12 / 100;
  const monthlyInterest = balance * monthlyRate;

  // If payment doesn't cover interest, debt will never be paid off
  if (monthlyPayment <= monthlyInterest && annualRate > 0) {
    return null;
  }

  // For 0% interest, simple division
  if (annualRate === 0) {
    const months = Math.ceil(balance / monthlyPayment);
    return addMonths(startDate, months);
  }

  // Calculate number of months using amortization formula
  // n = -log(1 - (B * r / P)) / log(1 + r)
  // where: n = number of months, B = balance, r = monthly rate, P = payment
  const numerator = Math.log(1 - (balance * monthlyRate) / monthlyPayment);
  const denominator = Math.log(1 + monthlyRate);
  const months = Math.ceil(-numerator / denominator);

  return addMonths(startDate, months);
}

/**
 * Calculate complete amortization schedule
 */
export function calculateAmortizationSchedule(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  startDate: Date = new Date()
): AmortizationEntry[] {
  if (balance <= 0) return [];
  if (monthlyPayment <= 0) return [];

  const schedule: AmortizationEntry[] = [];
  let remainingBalance = balance;
  let currentDate: Date;
  let month = 0;

  const monthlyRate = annualRate / 12 / 100;

  // Safety limit: max 360 months (30 years)
  const maxMonths = 360;

  while (remainingBalance > 0.01 && month < maxMonths) {
    month++;
    currentDate = addMonths(startDate, month);

    // Calculate interest for this month
    const interestPayment = annualRate > 0 ? remainingBalance * monthlyRate : 0;

    // Calculate principal payment
    let principalPayment = monthlyPayment - interestPayment;

    // Last payment might be less than full payment
    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
    }

    // Actual payment for this month
    const actualPayment = principalPayment + interestPayment;

    // Update balance
    remainingBalance -= principalPayment;

    // Ensure balance doesn't go negative due to rounding
    if (remainingBalance < 0) {
      remainingBalance = 0;
    }

    schedule.push({
      month,
      date: format(currentDate, 'yyyy-MM-dd'),
      payment: Number(actualPayment.toFixed(2)),
      principal: Number(principalPayment.toFixed(2)),
      interest: Number(interestPayment.toFixed(2)),
      balance: Number(remainingBalance.toFixed(2)),
    });

    // If balance is essentially zero, stop
    if (remainingBalance < 0.01) {
      break;
    }

    // Safety check: if payment doesn't reduce balance (shouldn't happen with validation)
    if (principalPayment <= 0 && annualRate > 0) {
      // Payment is too small to cover interest
      break;
    }
  }

  return schedule;
}

/**
 * Calculate total interest to be paid over the life of the loan
 */
export function calculateTotalInterest(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): number {
  const schedule = calculateAmortizationSchedule(balance, annualRate, monthlyPayment);
  const totalInterest = schedule.reduce((sum, entry) => sum + entry.interest, 0);
  return Number(totalInterest.toFixed(2));
}

/**
 * Calculate monthly interest breakdown for N months
 */
export function calculateMonthlyInterestBreakdown(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  months: number
): AmortizationEntry[] {
  const fullSchedule = calculateAmortizationSchedule(balance, annualRate, monthlyPayment);
  return fullSchedule.slice(0, months);
}

/**
 * Validate that a minimum payment is sufficient to eventually pay off the debt
 */
export function validateMinimumPayment(
  balance: number,
  annualRate: number,
  minimumPayment: number
): { isValid: boolean; message?: string } {
  if (balance <= 0) {
    return { isValid: true };
  }

  if (minimumPayment <= 0) {
    return { isValid: false, message: 'Minimum payment must be greater than 0' };
  }

  if (annualRate > 0) {
    const monthlyRate = annualRate / 12 / 100;
    const monthlyInterest = balance * monthlyRate;

    if (minimumPayment <= monthlyInterest) {
      return {
        isValid: false,
        message: `Minimum payment must be greater than monthly interest (£${monthlyInterest.toFixed(2)})`,
      };
    }
  }

  return { isValid: true };
}
