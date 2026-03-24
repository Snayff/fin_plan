# FinPlan — Definitions

> This is the canonical reference for all tooltip text in FinPlan. When a term in the UI has a specific financial meaning — or a specific meaning within FinPlan — a tooltip is surfaced on hover. The text here is the authoritative source for those tooltips; it should be copied verbatim into implementation. Consult this document when writing or reviewing any UI copy involving financial terms or icon-only elements.
>
> Format per entry: the term as it appears in the UI, the contexts where the tooltip applies, and the tooltip text itself (1–2 sentences, plain English).

---

## Waterfall

**Appears in**: Overview page header, Waterfall Creation Wizard introduction, empty state

**Tooltip**: The way FinPlan structures your finances — income at the top, committed spend deducted first, then discretionary spend, leaving your surplus at the bottom. Think of money flowing downwards through each layer.

---

## Committed Spend

**Appears in**: Overview waterfall (section label), Review Wizard step header, Waterfall Creation Wizard

**Tooltip**: Money you've contracted or obligated yourself to pay — outgoings you can't immediately choose to stop, such as your mortgage, phone contract, or annual insurance.

---

## Discretionary Spend

**Appears in**: Overview waterfall (section label), Review Wizard step header, Waterfall Creation Wizard

**Tooltip**: Spending you choose to make each month and could choose to reduce or stop — for example, your food budget, petrol, or subscriptions you could cancel.

---

## Surplus

**Appears in**: Overview waterfall (section label), surplus indicator tooltip, Review Wizard summary

**Tooltip**: What's left after your committed and discretionary spend is deducted from your income. The goal is to keep this positive and allocate it intentionally — to savings or a buffer.

---

## Net Income

**Appears in**: Income source form (amount field label/hint), Waterfall Creation Wizard step 2

**Tooltip**: Your take-home pay after tax, National Insurance, and any other deductions — what actually arrives in your account. FinPlan works with net figures only.

---

## One-Off Income

**Appears in**: Income source frequency selector, income source badge in the waterfall

**Tooltip**: A single, non-recurring payment — for example, a bonus, an inheritance, or the proceeds from selling an asset. Not included in your monthly waterfall total; shown separately with its expected month.

---

## Annual Income

**Appears in**: Income source frequency selector, ÷12 indicator in the waterfall

**Tooltip**: Income that recurs once a year — for example, an annual bonus. Shown in the waterfall divided by 12 so it contributes a fair monthly share to your plan.

---

## Amortised (÷12)

**Appears in**: Yearly Bills row in the waterfall (÷12 label), Annual Income entries, cashflow calendar header

**Tooltip**: An annual amount spread evenly across 12 months. FinPlan uses this so your monthly waterfall reflects a fair share of bills or income that don't land every month.

---

## ISA

**Appears in**: Savings account form (ISA flag), Wealth page account list, ISA allowance bar

**Tooltip**: Individual Savings Account — a UK savings or investment account where interest and gains are free from tax.

---

## ISA Allowance

**Appears in**: Wealth page (Savings section), ISA allowance progress bar label

**Tooltip**: The maximum you can pay into ISAs in a single tax year — currently £20,000 per person. Contributions across all your ISA accounts count towards one shared limit, which resets each year on 6 April.

---

## Tax Year

**Appears in**: ISA allowance bar (deadline label), Settings → ISA tax year

**Tooltip**: The UK tax year runs from 6 April to 5 April the following year. ISA allowances and some tax thresholds reset at this date.

---

## Equity Value

**Appears in**: Property, Vehicles, and Other asset class forms (balance/value field label)

**Tooltip**: The portion of an asset you own outright — the market value minus any outstanding debt secured against it. For example, a property worth £300,000 with a £200,000 mortgage has an equity value of £100,000.

---

## Liquidity

**Appears in**: Wealth page summary (By liquidity breakdown labels)

**Tooltip**: How quickly and easily an asset can be converted to cash. Savings accounts are immediately liquid; pensions and property are not.

---

## Net Worth

**Appears in**: Wealth page headline figure label

**Tooltip**: The total value of everything you own (your assets) minus everything you owe (your liabilities). FinPlan calculates this from the assets recorded on the Wealth page.

---

## Snapshot

**Appears in**: Timeline navigator (dot labels), snapshot banner, Review Wizard summary, `[+ Save snapshot]` control

**Tooltip**: A saved, read-only record of your waterfall at a specific point in time. Snapshots let you compare how your plan has changed over months or years.

---

## Staleness

**Appears in**: Staleness indicator (amber dot tooltip), Review Wizard card header, right panel detail view ("Last reviewed" label)

**Tooltip**: A signal that a value hasn't been reviewed or confirmed within the expected timeframe and may no longer be accurate. Staleness is informational only — it never blocks you from using the app.

---

## Held on Behalf Of

**Appears in**: Wealth page (ring-fenced section label), trust savings account badge

**Tooltip**: Savings managed by your household but legally owned by someone else — for example, a child's Junior ISA. These are tracked separately and excluded from your household net worth.

---

## Projection

**Appears in**: Wealth page account detail (projected balance label), savings account list

**Tooltip**: An estimated future balance calculated from the current value plus the linked monthly contribution, compounded at the recorded interest rate. Projections are illustrative only.

---

# Functional Icon Tooltips

> These tooltips appear on hover over icon-only UI elements — icons that carry meaning but are not accompanied by visible label text. They explain what tapping or clicking the icon does (or what it represents), in plain English.

---

## Staleness Indicator (amber dot ●)

**Appears in**: Item rows in the right panel (5px amber dot before the label + amber detail text), right panel detail view

**Tooltip**: This value hasn't been reviewed recently — it may no longer be accurate. Click to open the item and confirm it.

---

## Still Correct (checkmark confirm button)

**Appears in**: `ButtonPair` in the right panel detail view, Review Wizard item card

**Tooltip**: Confirm this value is still accurate. Updates the last-reviewed date to today without changing the value.

---

## Snapshot Dot (timeline navigator)

**Appears in**: Timeline navigator above the Overview waterfall

**Tooltip**: [snapshot name] — [date]. Click to view your waterfall as it was on this date (read-only).

_Note: the tooltip is dynamic — it shows the actual snapshot name and date on hover._

---

## Savings ↔ Waterfall Link Icon

**Appears in**: Wealth page savings account row, waterfall discretionary savings row

**Tooltip**: This savings account is linked to a waterfall allocation. Contributions from your plan are used for projections on this account.

---

## Surplus Percentage

**Appears in**: Surplus row in the waterfall left panel (alongside the absolute figure)

**Tooltip**: Your surplus as a percentage of your total net income. A common benchmark is 10% or above, though the right level depends on your circumstances.

---

## Yearly Bill Cashflow Shortfall Indicator

**Appears in**: Committed Spend tier row (left panel), when a cashflow shortfall is projected

**Tooltip**: One or more yearly bills may not be fully covered in their due month. Open Committed Spend to see the cashflow calendar.

---

## Held on Behalf Of Badge

**Appears in**: Wealth page trust savings section (account row badge)

**Tooltip**: This account is managed by your household but is owned by [name]. It is excluded from your household net worth.
