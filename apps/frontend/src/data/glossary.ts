export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  relatedConceptIds: string[];
  relatedTermIds: string[];
  appearsIn: string[];
}

// Canonical definitions from docs/2. design/definitions.md — verbatim
export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    id: "amortised",
    term: "Amortised (÷12)",
    definition:
      "An annual amount spread evenly across 12 months. finplan uses this so your monthly waterfall reflects a fair share of bills or income that don't land every month.",
    relatedConceptIds: ["amortisation"],
    relatedTermIds: ["annual-income"],
    appearsIn: ["Committed Spend waterfall", "Annual Income entries", "Cashflow calendar"],
  },
  {
    id: "annual-income",
    term: "Annual Income",
    definition:
      "Income that recurs once a year — for example, an annual bonus. Shown in the waterfall divided by 12 so it contributes a fair monthly share to your plan.",
    relatedConceptIds: ["waterfall"],
    relatedTermIds: ["amortised", "net-income"],
    appearsIn: ["Income page", "Overview waterfall"],
  },
  {
    id: "committed-spend",
    term: "Committed Spend",
    definition:
      "Money you've contracted or obligated yourself to pay — outgoings you can't immediately choose to stop, such as your mortgage, phone contract, or annual insurance.",
    relatedConceptIds: ["waterfall"],
    relatedTermIds: ["discretionary-spend", "surplus"],
    appearsIn: ["Overview waterfall", "Committed page"],
  },
  {
    id: "discretionary-spend",
    term: "Discretionary Spend",
    definition:
      "Spending you choose to make each month and could choose to reduce or stop — for example, your food budget, petrol, or subscriptions you could cancel.",
    relatedConceptIds: ["waterfall"],
    relatedTermIds: ["committed-spend", "surplus"],
    appearsIn: ["Overview waterfall", "Discretionary page"],
  },
  {
    id: "equity-value",
    term: "Equity Value",
    definition:
      "The portion of an asset you own outright — the market value minus any outstanding debt secured against it. For example, a property worth £300,000 with a £200,000 mortgage has an equity value of £100,000.",
    relatedConceptIds: ["net-worth"],
    relatedTermIds: ["net-worth", "liquidity"],
    appearsIn: ["Wealth page"],
  },
  {
    id: "held-on-behalf-of",
    term: "Held on Behalf Of",
    definition:
      "Savings managed by your household but legally owned by someone else — for example, a child's Junior ISA. These are tracked separately and excluded from your household net worth.",
    relatedConceptIds: ["net-worth", "isa-allowances"],
    relatedTermIds: ["net-worth", "isa"],
    appearsIn: ["Wealth page"],
  },
  {
    id: "isa",
    term: "ISA",
    definition:
      "Individual Savings Account — a UK savings or investment account where interest and gains are free from tax.",
    relatedConceptIds: ["isa-allowances"],
    relatedTermIds: ["isa-allowance", "tax-year"],
    appearsIn: ["Wealth page"],
  },
  {
    id: "isa-allowance",
    term: "ISA Allowance",
    definition:
      "The maximum you can pay into ISAs in a single tax year — currently £20,000 per person. Contributions across all your ISA accounts count towards one shared limit, which resets each year on 6 April.",
    relatedConceptIds: ["isa-allowances"],
    relatedTermIds: ["isa", "tax-year"],
    appearsIn: ["Wealth page", "ISA allowance progress bar"],
  },
  {
    id: "liquidity",
    term: "Liquidity",
    definition:
      "How quickly and easily an asset can be converted to cash. Savings accounts are immediately liquid; pensions and property are not.",
    relatedConceptIds: ["net-worth"],
    relatedTermIds: ["net-worth", "equity-value"],
    appearsIn: ["Wealth page"],
  },
  {
    id: "net-income",
    term: "Net Income",
    definition:
      "Your take-home pay after tax, National Insurance, and any other deductions — what actually arrives in your account. finplan works with net figures only.",
    relatedConceptIds: ["waterfall"],
    relatedTermIds: ["annual-income", "one-off-income"],
    appearsIn: ["Income page", "Overview waterfall"],
  },
  {
    id: "net-worth",
    term: "Net Worth",
    definition:
      "The total value of everything you own (your assets) minus everything you owe (your liabilities). finplan calculates this from the assets recorded on the Wealth page.",
    relatedConceptIds: ["net-worth"],
    relatedTermIds: ["equity-value", "liquidity"],
    appearsIn: ["Wealth page"],
  },
  {
    id: "one-off-income",
    term: "One-Off Income",
    definition:
      "A single, non-recurring payment — for example, a bonus, an inheritance, or the proceeds from selling an asset. Not included in your monthly waterfall total; shown separately with its expected month.",
    relatedConceptIds: ["waterfall"],
    relatedTermIds: ["net-income", "annual-income"],
    appearsIn: ["Income page", "Overview waterfall"],
  },
  {
    id: "real-terms",
    term: "Real Terms",
    definition:
      "A value adjusted for inflation — showing what a future amount would be worth in today's purchasing power. If your net worth is projected at £150,000 but £120,000 in real terms, the difference reflects the expected erosion of purchasing power over time.",
    relatedConceptIds: ["compound-interest"],
    relatedTermIds: ["net-worth", "projection"],
    appearsIn: ["Growth chart"],
  },
  {
    id: "projection",
    term: "Projection",
    definition:
      "An estimated future balance calculated from the current value plus the linked monthly contribution, compounded at the recorded interest rate. Projections are illustrative only.",
    relatedConceptIds: ["compound-interest"],
    relatedTermIds: ["net-worth"],
    appearsIn: ["Wealth page"],
  },
  {
    id: "snapshot",
    term: "Snapshot",
    definition:
      "A saved, read-only record of your waterfall at a specific point in time. Snapshots let you compare how your plan has changed over months or years.",
    relatedConceptIds: ["waterfall"],
    relatedTermIds: [],
    appearsIn: ["Overview timeline", "Snapshot banner"],
  },
  {
    id: "surplus",
    term: "Surplus",
    definition:
      "What's left after your committed and discretionary spend is deducted from your income. The goal is to keep this positive and allocate it intentionally — to savings or a buffer.",
    relatedConceptIds: ["waterfall"],
    relatedTermIds: ["committed-spend", "discretionary-spend"],
    appearsIn: ["Overview waterfall", "Surplus page"],
  },
  {
    id: "tax-year",
    term: "Tax Year",
    definition:
      "The UK tax year runs from 6 April to 5 April the following year. ISA allowances and some tax thresholds reset at this date.",
    relatedConceptIds: ["isa-allowances"],
    relatedTermIds: ["isa-allowance"],
    appearsIn: ["ISA allowance bar", "Settings"],
  },
  {
    id: "waterfall",
    term: "Waterfall",
    definition:
      "The way finplan structures your finances — income at the top, committed spend deducted first, then discretionary spend, leaving your surplus at the bottom. Think of money flowing downwards through each layer.",
    relatedConceptIds: ["waterfall"],
    relatedTermIds: ["committed-spend", "discretionary-spend", "surplus"],
    appearsIn: ["Overview page", "Waterfall Creation Wizard"],
  },
];

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return GLOSSARY_ENTRIES.find((e) => e.id === id);
}
