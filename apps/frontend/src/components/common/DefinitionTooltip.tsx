import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const DEFINITIONS = {
  Waterfall:
    "The way finplan structures your finances — income at the top, committed spend deducted first, then discretionary spend, leaving your surplus at the bottom.",
  "Committed Spend":
    "Money you've contracted or obligated yourself to pay — outgoings you can't immediately choose to stop.",
  "Discretionary Spend":
    "Spending you choose to make each month and could choose to reduce or stop.",
  Surplus: "What's left after your committed and discretionary spend is deducted from your income.",
  "Net Income":
    "Your take-home pay after tax, National Insurance, and any other deductions — what actually arrives in your account.",
  "One-Off Income": "A single, non-recurring payment — for example, a bonus or an inheritance.",
  "Annual Income":
    "Income that recurs once a year. Shown in the waterfall divided by 12 so it contributes a fair monthly share.",
  "Amortised (÷12)": "An annual amount spread evenly across 12 months.",
  ISA: "Individual Savings Account — a UK savings or investment account where interest and gains are free from tax.",
  "ISA Allowance":
    "The maximum you can pay into ISAs in a single tax year — currently £20,000 per person.",
  "Tax Year": "The UK tax year runs from 6 April to 5 April the following year.",
  "Equity Value":
    "The portion of an asset you own outright — the market value minus any outstanding debt secured against it.",
  Liquidity: "How quickly and easily an asset can be converted to cash.",
  "Net Worth":
    "The total value of everything you own (your assets) minus everything you owe (your liabilities).",
  Snapshot: "A saved, read-only record of your waterfall at a specific point in time.",
  Staleness:
    "A signal that a value hasn't been reviewed or confirmed within the expected timeframe and may no longer be accurate.",
  "Held on Behalf Of": "Savings managed by your household but legally owned by someone else.",
  Projection:
    "An estimated future balance calculated from the current value plus the linked monthly contribution, compounded at the recorded interest rate.",
} as const;

interface Props {
  term: keyof typeof DEFINITIONS;
  children: React.ReactNode;
}

export function DefinitionTooltip({ term, children }: Props) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="border-b border-dotted border-current cursor-help">{children}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{DEFINITIONS[term]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
