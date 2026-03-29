// Empty state copy per subcategory, keyed by normalised name.
import type { TierKey } from "./tierConfig";

interface EmptyStateCopy {
  header: string;
  body: string;
}

const COPY: Record<string, EmptyStateCopy> = {
  // Income
  salary: { header: "What income do you earn?", body: "Employment income, take-home pay" },
  dividends: { header: "What dividend income do you have?", body: "Investment income, shareholder dividends" },
  "income-other": { header: "What other income do you have?", body: "Rental income, freelance, side projects" },
  // Committed
  housing: { header: "What housing costs do you have?", body: "Rent, mortgage, council tax, insurance" },
  utilities: { header: "What utilities do you have?", body: "Gas, electric, water, internet, phone" },
  services: { header: "What subscriptions do you have?", body: "Streaming, TV, gym, subscriptions" },
  "committed-other": { header: "What regular costs do you have?", body: "Any regular obligation not covered above" },
  // Discretionary
  food: { header: "What do you budget for food?", body: "Groceries, meal kits, work lunches" },
  fun: { header: "What do you budget for fun?", body: "Eating out, takeaways, cinema, hobbies" },
  clothes: { header: "What do you budget for clothes?", body: "Clothing, shoes, accessories" },
  gifts: { header: "What do you budget for gifts?", body: "Configured from the Gifts page" },
  savings: { header: "What are you saving towards?", body: "Emergency fund, ISA, pension top-up" },
  "discretionary-other": { header: "What other spending do you have?", body: "Anything not covered in the categories above" },
};

const FALLBACKS: Record<string, EmptyStateCopy> = {
  income: { header: "What income do you have?", body: "Add a source of income" },
  committed: { header: "What regular costs do you have?", body: "Add a regular committed expense" },
  discretionary: { header: "What are you spending on?", body: "Add a discretionary spending category" },
};

export function getEmptyStateCopy(subcategoryName: string, tier: TierKey): EmptyStateCopy {
  const key = subcategoryName.toLowerCase().trim();
  if (COPY[key]) return COPY[key];
  const otherKey = `${tier}-other`;
  if (COPY[otherKey]) return COPY[otherKey];
  return FALLBACKS[tier] ?? { header: "Add items", body: "Add items to this subcategory" };
}
