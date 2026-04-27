export interface IsaTaxYearWindow {
  start: Date; // 6 April of the start year
  end: Date; // 5 April of the end year
  daysRemaining: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Returns the current UK ISA tax year window relative to `today`.
 *  Tax year runs 6 April → 5 April. If today is on or before 5 April, the
 *  window ends this calendar year; otherwise it ends next calendar year. */
export function getIsaTaxYearWindow(today: Date): IsaTaxYearWindow {
  const y = today.getUTCFullYear();
  const thisYearEnd = new Date(Date.UTC(y, 3, 5)); // April is month index 3
  const endYear = today.getTime() <= thisYearEnd.getTime() ? y : y + 1;
  const end = new Date(Date.UTC(endYear, 3, 5));
  const start = new Date(Date.UTC(endYear - 1, 3, 6));

  // Whole-day count from today (UTC midnight) to end (UTC midnight).
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysRemaining = Math.max(0, Math.round((end.getTime() - todayUTC) / MS_PER_DAY));

  return { start, end, daysRemaining };
}
