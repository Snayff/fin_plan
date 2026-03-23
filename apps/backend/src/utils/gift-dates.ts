import type { GiftEvent } from "@prisma/client";

// ─── Easter (Anonymous Gregorian algorithm) ───────────────────────────────────

function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ─── UK Mothering Sunday ──────────────────────────────────────────────────────
// 4th Sunday of Lent = Easter Sunday - 3 weeks

export function ukMothersDay(year: number): { month: number; day: number } {
  const easter = easterDate(year);
  const ms = new Date(easter);
  ms.setDate(ms.getDate() - 21); // 3 weeks before Easter
  return { month: ms.getMonth() + 1, day: ms.getDate() };
}

// ─── UK Father's Day ──────────────────────────────────────────────────────────
// 3rd Sunday of June

export function ukFathersDay(year: number): { month: number; day: number } {
  const june1 = new Date(year, 5, 1); // June 1
  const dayOfWeek = june1.getDay(); // 0=Sun
  const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const thirdSunday = firstSunday + 14;
  return { month: 6, day: thirdSunday };
}

// ─── Next event date ──────────────────────────────────────────────────────────

export function nextEventDate(event: GiftEvent, year: number): Date | null {
  switch (event.eventType) {
    case "christmas":
      return new Date(year, 11, 25); // Dec 25

    case "valentines_day":
      return new Date(year, 1, 14); // Feb 14

    case "mothers_day": {
      const { month, day } = ukMothersDay(year);
      return new Date(year, month - 1, day);
    }

    case "fathers_day": {
      const { month, day } = ukFathersDay(year);
      return new Date(year, month - 1, day);
    }

    case "birthday":
    case "anniversary":
    case "custom": {
      if (event.recurrence === "one_off") {
        return event.specificDate ? new Date(event.specificDate) : null;
      }
      if (event.dateMonth != null && event.dateDay != null) {
        return new Date(year, event.dateMonth - 1, event.dateDay);
      }
      return null;
    }

    default:
      return null;
  }
}
