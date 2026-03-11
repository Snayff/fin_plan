/**
 * Returns the human-readable date range for the current income tracking period.
 * Uses the user's system locale and browser-local timezone.
 *
 * @param period - 'month' for the current calendar month, 'year' for the current calendar year
 * @returns e.g. "1 Mar – 31 Mar 2026" or "1 Jan – 31 Dec 2026"
 */
export function getIncomePeriodRange(period: 'month' | 'year'): string {
  const now = new Date();
  const shortFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
  const fullFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${shortFmt.format(start)} – ${fullFmt.format(end)}`;
  }
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return `${shortFmt.format(start)} – ${fullFmt.format(end)}`;
}
