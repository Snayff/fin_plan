# FinPlan — Design Anchors

> These are the non-negotiable invariants of FinPlan. They are the decisions that constrain all other decisions — if any of these are violated, the nature or integrity of the product changes. Read this document first when onboarding to the project or establishing context.
>
> These anchors do not change without a deliberate, explicit decision to do so. Features and specs can evolve; anchors should not drift.

---

## What FinPlan Is

1. **FinPlan is a personal planning tool — not a ledger, not an advisor.** It gives users a clear picture of where their money comes from, goes, and is heading. It does not track transactions, provide financial advice, or replace a bank.

2. **The waterfall is the mental model.** Money flows: Income → Committed Spend → Discretionary Spend → Surplus. Every design decision reinforces this cascade. The waterfall is not a feature — it is the identity of the app.

3. **FinPlan tracks intent (budgets), not transactions.** The app holds the plan. Users reconcile actual spending through their bank. Language throughout must reflect this: use "budgeted", "planned", "allocated"; never "spent", "paid", "charged".

4. **All income is net (take-home only).** Gross income, tax calculations, and employer contributions are out of scope. Users enter what arrives in their account.

---

## Scope Boundaries

5. **UK locale only.** Currency is GBP. The tax year runs April to April. All context, terminology, and defaults are UK-specific. No multi-currency support; no i18n.

6. **Desktop-first.** Desktop is the primary environment for setup, review, and analysis. The mobile experience is deferred — see `backlog.md`.

7. **Dark theme only.** No light mode. No theme switching. If this changes in future, only the token layer needs updating — not component code.

8. **No bank sync, no receipt upload, no transaction tracking.** FinPlan is a planning tool only. All values are entered manually and kept current through periodic review.

---

## Behavioural Invariants

9. **Non-advisory.** FinPlan surfaces mechanics and arithmetic only — never recommendations. "£11,600 ISA allowance remaining before April" is acceptable. "You should use your ISA allowance" is not.

10. **Calm by default.** The app is a trusted companion, not an alarm system. Silence means everything is fine. Signals are informational; strong visual emphasis is reserved for genuine shortfalls.

11. **Staleness is always informational, never blocking.** A stale value is flagged but never prevents the user from proceeding. The user is always in control.

12. **Nudges are one at a time, arithmetic-only, never stacked.** A nudge surfaces a mechanical opportunity. It never recommends. There is never more than one nudge visible in a panel simultaneously.

---

## Structural Invariants

13. **Surplus is the cascaded remainder of the waterfall.** Surplus = Income − Committed Spend − Discretionary Spend. There is no other definition.

14. **Yearly bills use a ÷12 virtual pot model.** Each month, one-twelfth of the annual bill amount accumulates in a virtual pot. Bills deduct from that pot when they fall due. Cashflow shortfalls are detected by comparing the pot balance to upcoming bills.

15. **Snapshots are read-only.** When viewing a historical snapshot, all editing is disabled. The current plan is always editable; historical states never are.

16. **Wizards are the only full-screen mode.** The Review Wizard and Waterfall Creation Wizard are exempt from the two-panel layout rule. Every other page uses the two-panel layout.
