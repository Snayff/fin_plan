export type BuildPhase =
  | "household"
  | "income"
  | "committed"
  | "yearly_bills"
  | "discretionary"
  | "savings"
  | "summary";

export const BUILD_PHASES: BuildPhase[] = [
  "household",
  "income",
  "committed",
  "yearly_bills",
  "discretionary",
  "savings",
  "summary",
];

export const PHASE_LABELS: Record<BuildPhase, string> = {
  household: "Household",
  income: "Income",
  committed: "Monthly Bills",
  yearly_bills: "Yearly Bills",
  discretionary: "Discretionary",
  savings: "Savings",
  summary: "Summary",
};

export const PHASE_DESCRIPTIONS: Record<Exclude<BuildPhase, "summary">, string> = {
  household:
    "Review your household name and members before building your waterfall.",
  income:
    "Everything that arrives in your accounts each month — salary, freelance, pension, rental income. Include all regular sources.",
  committed:
    "Bills you must pay every month — rent, mortgage, council tax, utilities, insurance. These are non-negotiable outgoings.",
  yearly_bills:
    "Bills that come around once a year — car tax, annual subscriptions, TV licence. Enter the full amount and the month it's due.",
  discretionary:
    "What you choose to spend on — groceries, eating out, subscriptions, hobbies.",
  savings:
    "Set aside money each month for savings goals and investments. Link to a wealth account to track progress.",
};

export const QUICK_PICKS: Record<Exclude<BuildPhase, "household" | "summary">, string[]> = {
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
    "Childcare",
    "Car finance",
    "Student loan",
  ],
  yearly_bills: [
    "Car tax",
    "TV licence",
    "Home insurance",
    "Buildings insurance",
    "Car insurance",
    "MOT",
    "Annual subscriptions",
    "Boiler service",
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
  savings: [
    "Emergency fund",
    "Pension top-up",
    "Holiday fund",
    "House deposit",
    "Rainy day fund",
    "Kids' savings",
  ],
};

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
