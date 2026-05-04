// Contextual name placeholder for ItemForm, keyed by subcategory.
// Tone: "e.g. X, Y" — Title Case, two concrete examples, no fictitious brand names.
import type { TierKey } from "./tierConfig";

const PLACEHOLDERS: Record<string, string> = {
  // Income
  salary: "e.g. Salary, Bonus",
  dividends: "e.g. Vanguard FTSE100, Company Dividend",
  "income-other": "e.g. Freelance, Rental Income",
  // Committed
  housing: "e.g. Mortgage, Council Tax",
  utilities: "e.g. British Gas, Virgin Media",
  services: "e.g. Netflix, Spotify",
  "committed-other": "e.g. Insurance, Childcare",
  // Discretionary
  food: "e.g. Weekly Shop, Work Lunches",
  fun: "e.g. Cinema, Takeaways",
  clothes: "e.g. Work Clothes, Shoes",
  savings: "e.g. Emergency Fund, ISA Top-up",
  "discretionary-other": "e.g. Hobbies, Gadgets",
};

const FALLBACKS: Record<TierKey, string> = {
  income: "e.g. Salary, Bonus",
  committed: "e.g. Netflix, Council Tax",
  discretionary: "e.g. Cinema, Takeaways",
};

export function getItemNamePlaceholder(subcategoryName: string, tier: TierKey): string {
  const key = subcategoryName.toLowerCase().trim();
  if (PLACEHOLDERS[key]) return PLACEHOLDERS[key];
  const otherKey = `${tier}-other`;
  if (PLACEHOLDERS[otherKey]) return PLACEHOLDERS[otherKey];
  return FALLBACKS[tier];
}
