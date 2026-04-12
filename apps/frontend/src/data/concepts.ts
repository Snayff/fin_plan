export type ConceptVisualType =
  | "waterfall-diagram"
  | "amortisation-comparison"
  | "net-worth-bar"
  | "isa-progress"
  | "compound-interest-calculator"
  | "cashflow-calendar";

export interface ConceptEntry {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  visualType: ConceptVisualType;
  relatedTermIds: string[];
  seeThisInFinplan?: string;
}

export const CONCEPT_ENTRIES: ConceptEntry[] = [
  {
    id: "waterfall",
    title: "The Waterfall",
    summary:
      "Your income flows in at the top. Committed spend — your fixed obligations — is deducted first. Discretionary spend comes next. Whatever is left is your surplus. Think of it like water flowing through a series of pools: each layer takes its share before passing the remainder down.\n\nFor example: £5,000 net income − £2,000 committed − £1,500 discretionary = £1,500 surplus.",
    whyItMatters:
      "The waterfall is finplan's core model. Every page in the app is built around this cascade — income feeds it, committed and discretionary pages let you edit each tier, and the surplus page shows what you have left to allocate. The Overview page shows all four tiers together.",
    visualType: "waterfall-diagram",
    relatedTermIds: ["committed-spend", "discretionary-spend", "surplus", "net-income"],
    seeThisInFinplan: "/overview",
  },
  {
    id: "amortisation",
    title: "Amortisation (÷12)",
    summary:
      "Some costs land once a year — car insurance, a TV licence, an annual subscription. Amortisation spreads that yearly cost evenly across 12 months, so each month's waterfall reflects a fair share of the bill, not just the month it arrives.\n\nFor example: a £1,200 yearly insurance bill becomes £100/month in your committed spend tier.",
    whyItMatters:
      "finplan uses ÷12 automatically for annual bills in the Committed Spend tier. This prevents the false impression of a healthy surplus most months and a deficit in the month the big bill lands. Your waterfall reflects what you actually need to set aside each month.",
    visualType: "amortisation-comparison",
    relatedTermIds: ["amortised", "committed-spend", "annual-income"],
    seeThisInFinplan: "/committed",
  },
  {
    id: "net-worth",
    title: "Net Worth",
    summary:
      "Net worth is what you own minus what you owe. Assets include savings, investments, property equity, and vehicles. Liabilities include mortgages, loans, and credit balances. The difference is your net worth.\n\nFor example: £250,000 in assets − £180,000 in liabilities = £70,000 net worth.",
    whyItMatters:
      "Net worth gives you a snapshot of overall financial health that goes beyond monthly cashflow. finplan calculates it from the assets and liabilities recorded on the Wealth page. Held-on-behalf-of accounts are excluded — they belong to someone else.",
    visualType: "net-worth-bar",
    relatedTermIds: ["equity-value", "liquidity", "held-on-behalf-of"],
  },
  {
    id: "isa-allowances",
    title: "ISA Allowances",
    summary:
      "Each UK tax year (6 April to 5 April), every adult can save up to £20,000 across all their ISAs without paying tax on interest or investment gains. The allowance resets each year — any unused amount is lost.\n\nFor example: if you have a Cash ISA and a Stocks & Shares ISA, contributions to both count towards the single £20,000 limit.",
    whyItMatters:
      "finplan tracks ISA contributions on the Wealth page and shows a progress bar against the annual limit. The bar resets each tax year. This helps you avoid accidentally exceeding the allowance across multiple ISA accounts.",
    visualType: "isa-progress",
    relatedTermIds: ["isa", "isa-allowance", "tax-year", "held-on-behalf-of"],
  },
  {
    id: "cashflow-forecasting",
    title: "Cashflow Forecasting",
    summary:
      "Cashflow forecasting projects your bank balance forward month by month. It starts with today's balance from your linked accounts, then adds expected income and subtracts committed and discretionary spend for each future month.\n\nFor example: a starting balance of £3,000 + £5,000 income − £2,000 committed − £1,500 discretionary = £4,500 projected end-of-month balance. Yearly bills land in their due month rather than being spread, so your cashflow forecast may dip in months with large annual payments even though your waterfall looks healthy.",
    whyItMatters:
      "The waterfall tells you whether your monthly plan adds up on average. The cashflow forecast tells you whether your bank balance will actually stay positive in each specific month — especially when yearly bills cluster together. The headline cards show your starting balance, projected end balance, tightest dip (the lowest your balance is expected to reach), and average monthly surplus across the window.",
    visualType: "cashflow-calendar",
    relatedTermIds: ["cashflow", "linked-account", "tightest-dip", "amortised", "committed-spend"],
    seeThisInFinplan: "/forecast",
  },
  {
    id: "compound-interest",
    title: "Compound Interest & Projections",
    summary:
      "Compound interest means you earn interest not just on your original balance, but on the interest you've already earned. Over time, this causes savings to grow exponentially rather than linearly.\n\nFor example: £10,000 at 5% annual interest becomes £12,763 after 5 years with compounding, versus £12,500 with simple interest.",
    whyItMatters:
      "finplan uses the standard compound interest formula to project future balances on savings accounts: FV = PV(1 + r/12)^(12t) + PMT × [((1 + r/12)^(12t) − 1) / (r/12)]. These projections are illustrative — they assume a constant rate and regular contributions. Use the calculator below to explore different scenarios.",
    visualType: "compound-interest-calculator",
    relatedTermIds: ["projection", "isa", "net-worth"],
  },
];

export function getConceptEntry(id: string): ConceptEntry | undefined {
  return CONCEPT_ENTRIES.find((e) => e.id === id);
}
