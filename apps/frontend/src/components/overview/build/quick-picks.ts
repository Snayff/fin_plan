export type BuildPhase = "income" | "committed" | "discretionary" | "summary";

export const BUILD_PHASES: BuildPhase[] = ["income", "committed", "discretionary", "summary"];

export const PHASE_LABELS: Record<BuildPhase, string> = {
  income: "Income",
  committed: "Committed",
  discretionary: "Discretionary",
  summary: "Summary",
};

export const PHASE_DESCRIPTIONS: Record<Exclude<BuildPhase, "summary">, string> = {
  income:
    "Everything that arrives in your accounts each month — salary, freelance, pension, rental income. Include all regular sources.",
  committed:
    "Bills you must pay — rent, mortgage, council tax, utilities, insurance. These are non-negotiable outgoings.",
  discretionary:
    "What you choose to spend on — groceries, eating out, subscriptions, hobbies. Then set aside savings allocations.",
};

export const QUICK_PICKS: Record<Exclude<BuildPhase, "summary">, string[]> = {
  income: [
    "Salary",
    "Partner's salary",
    "Freelance",
    "State pension",
    "Private pension",
    "Rental income",
    "Child benefit",
    "Dividends",
  ],
  committed: [
    "Rent / Mortgage",
    "Council Tax",
    "Gas & Electric",
    "Water",
    "Broadband",
    "Mobile phone",
    "Car insurance",
    "Home insurance",
    "Contents insurance",
    "Life insurance",
    "TV licence",
    "Childcare",
    "Car finance",
    "Student loan",
  ],
  discretionary: [
    "Groceries",
    "Eating out",
    "Clothing",
    "Entertainment",
    "Subscriptions",
    "Transport",
    "Hobbies",
    "Gifts",
    "Personal care",
    "Pets",
  ],
};

export const SAVINGS_QUICK_PICKS = [
  "Emergency fund",
  "Pension top-up",
  "Holiday fund",
  "House deposit",
  "Rainy day fund",
  "Kids' savings",
];

export const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
