// Empty state copy per subcategory, keyed by normalised name.
import type { TierKey } from "./tierConfig";

interface EmptyStateCopy {
  header: string;
  body: string;
}

const COPY: Record<string, EmptyStateCopy> = {
  // Income
  salary: { header: "Add your salary", body: "Employment income, take-home pay" },
  dividends: { header: "Add your dividends", body: "Investment income, shareholder dividends" },
  "income-other": { header: "Add your income", body: "Rental income, freelance, side projects" },
  // Committed
  housing: { header: "Add your housing costs", body: "Rent, mortgage, council tax, insurance" },
  utilities: { header: "Add your utilities", body: "Gas, electric, water, internet, phone" },
  services: { header: "Add your services", body: "Streaming, TV, gym, subscriptions" },
  "committed-other": {
    header: "Add your committed costs",
    body: "Any regular obligation not covered above",
  },
  // Discretionary
  food: { header: "Add your food budget", body: "Groceries, meal kits, work lunches" },
  fun: { header: "Add your fun spending", body: "Eating out, takeaways, cinema, hobbies" },
  clothes: { header: "Add your clothes budget", body: "Clothing, shoes, accessories" },
  gifts: { header: "Add your gift budget", body: "Configured from the Gifts page" },
  savings: { header: "Add your savings", body: "Emergency fund, ISA, pension top-up" },
  "discretionary-other": {
    header: "Add your spending",
    body: "Anything not covered in the categories above",
  },
};

const FALLBACKS: Record<string, EmptyStateCopy> = {
  income: { header: "Add your income", body: "Add a source of income" },
  committed: { header: "Add your committed costs", body: "Add a regular committed expense" },
  discretionary: { header: "Add your spending", body: "Add a discretionary spending category" },
};

export function getEmptyStateCopy(subcategoryName: string, tier: TierKey): EmptyStateCopy {
  const key = subcategoryName.toLowerCase().trim();
  if (COPY[key]) return COPY[key];
  const otherKey = `${tier}-other`;
  if (COPY[otherKey]) return COPY[otherKey];
  return FALLBACKS[tier] ?? { header: "Add items", body: "Add items to this subcategory" };
}
