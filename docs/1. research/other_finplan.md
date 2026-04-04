aywhoosh/finplan — Audit Logging Deep Dive
Data Model
Single AuditLog table with: id, actor_email, action, entity_type, entity_id, details_json (freeform JSON), created_at. Heavily indexed on all query fields.

What Gets Logged
Action	Entity	Details
SEED	SYSTEM	Demo data init
IMPORT_ACTUALS	ACTUALS	inserted/updated/rejected row counts
CREATE_PLAN	PLAN_VERSION	Plan name, fiscal year
EDIT_PLAN_LINES	PLAN_VERSION	inserted/updated/rejected line counts
SUBMIT_PLAN	PLAN_VERSION	New status
APPROVE_PLAN	PLAN_VERSION	New status
How It Works
Manual service-layer calls — a log_audit() function is called explicitly in each service method. No middleware or decorators.
Actor email extracted from JWT and passed explicitly.
Query endpoint: GET /audit with filters for entity_type, entity_id, and limit (max 500). Sorted by created_at DESC. All authenticated roles can view.
What's Missing
No login/logout or auth failure logging
No date range or actor filtering on the query endpoint
No retention policy, no immutable log guarantee, no cryptographic integrity
Only success paths logged — failures not captured
Coverage only where log_audit() is explicitly called (easy to forget for new endpoints)
What We Can Learn
Worth adopting:

Lightweight structured logging (JSON details in DB) is pragmatic for early-stage
Summary-level logging for bulk ops (row counts, not individual records) — avoids log bloat
Indexing actor, action, entity_type, timestamp from the start
Universal read access (all roles can view audit trail — transparency builds trust)
We should improve on:

Use middleware/decorators for automatic coverage rather than manual calls
Add date range + actor filtering on query endpoints
Log auth events (login, failed login, password changes)
Separate audit storage from operational DB
Add retention policy and export capability for compliance
kvdveer/finplan — Year-by-Year Projections Deep Dive
Algorithm
A month-by-month discrete simulation from now to age 100 (~1,200 iterations), then aggregated to annual summaries.

Each month processes in order:

Asset growth — liquid assets share a single interest rate; fixed assets appreciate individually with their own rates. Fixed assets can have a liquidation date (auto-converts to liquid pool).
Debt payments — Three strategies supported:
Linear (fixed principal): constant principal payment + decreasing interest
Annualized (standard amortization): fixed total payment, shifting principal/interest ratio
Interest-only (balloon): only interest monthly, lump sum at end date
Cash flows — Income and expenses applied with optional inflation adjustment: amount × (1 + inflationRate)^yearsElapsed
Balance snapshot — liquidAssets + fixedAssets - totalDebt
Data Structures
MonthlyProjection: date, age, balance, liquidAssets, fixedAssets, totalDebt, income, expenses, debtInterestPaid, debtPrincipalPaid

AnnualSummary: year, age, starting/ending balances for each category, total annual income/expenses/interest/principal

Visualisation
Stacked area chart (Chart.js): liquid assets (green) + fixed assets (blue) over time, with an "Inflation Adjusted" toggle that converts nominal to real purchasing power
Annual breakdown table: colour-coded (green income, red expenses, red negative balance), sticky year/age columns, responsive with horizontal scroll
Novel Aspects
Month-as-integer encoding: months since Jan 1900 (e.g., Jan 2024 = 1488) — more efficient than Date objects for month-level operations
Three debt repayment strategies in a single unified Debt class with discriminator pattern
Asset liquidation dates — scheduled future sales that auto-convert to liquid
Debt grace periods — repaymentStartDate can differ from startDate
Insufficient funds handling — payments skip gracefully rather than going negative
Runs in <5ms for 1,200 months; includes calculationTimeMs in results
Relevance to Us
The projection engine is clean and well-structured. The inflation adjustment formula, debt strategy modelling, and month-as-integer approach are all solid patterns. The main gap vs our waterfall model: it doesn't separate committed vs discretionary spend — everything is just "expense".

stt045/FinPlan — Calculator Deep Dive
What's Genuinely Novel
Dual-input paradigm — every parameter has both a number input AND a slider, synced bidirectionally. Users explore ranges with the slider, then refine with the input. Superior to either alone.

Dual-view amortization with year markers — mortgage and auto loan tables toggle between monthly and annual views, with visual year-mark dividers in monthly view (hover to reveal "Year N Completed"). Makes 360-row tables navigable.

Fee capitalisation toggle (auto loan) — compare "pay fees upfront" vs "finance them into the loan". Practical and rarely seen in calculator apps.

Extra cost include/exclude toggle (mortgage) — see "principal & interest only" vs "all-in monthly payment" including tax, insurance, HOA. Educational.

Tooltip philosophy — all tooltips explain impact, not just definition. E.g., "Even small increases significantly boost your final balance over decades" rather than "The annual interest rate."

What's Standard
The actual formulas are textbook — standard compound interest, standard amortization. Nothing novel mathematically.

Key Finding: The Retirement Calculator is Misleading
Despite README claiming "4% safe withdrawal rate strategy", the code does not implement the 4% rule. It's a basic depletion simulator — user manually inputs withdrawal amount, no safe withdrawal rate calculation, no failure rate analysis, no Monte Carlo. The formula is just: balance = balance × (1 + return) - withdrawal × (1 + inflation)^year.

Missing
No input validation (down payment can exceed home price)
No scenario comparison (can't save/compare two mortgage scenarios)
No unit tests for financial calculations
No inflation impact on compound interest (shows nominal only)
What We Can Learn
The UX patterns are more valuable than the financial models: dual-input controls, dual-view tables with year markers, impact-focused tooltips, and conditional UI that hides irrelevant sections.

PHnaves/FinPlan — Full Deep Dive
Data Model (11 migrations)
Users: name, email, password, rent (current balance), monthly_income, payment_frequency, payment_day, type_user (investor profile)
Expenses: name, description, category (free text), value, recurrence (7 types), installments, due_date, payment_date
Goals (Metas): title, description, category, target_value, current_value, frequency, recurring_value, status (andamento/concluída/cancelada), end_date
DepositGoal: junction table tracking individual deposits toward goals
Earnings: title, description, value, recurrence, received_at
Investiments: name, description, type (15 types), recommended_profile, expiration_date, minimum_value — 50+ pre-seeded options
Notifications: type, data (JSON), read_at, read_status
FinBot Chatbot — Reality Check
It's a third-party widget from Easy Peasy AI — just an embedded <script> tag. No custom training, no access to user data, no personalised advice. Purely generic financial education. Not worth emulating this approach.

Notification System (Most Transferable Feature)
Three scheduled Laravel commands run daily:

Overdue expense alerts — checks all expenses with due_date = tomorrow, sends in-app notification + email via Brevo. Same-day deduplication prevents re-notifying.
Expense limit alerts — flags any unpaid expense exceeding 50% of monthly income. 7-day deduplication window.
Goal deposit reminders — frequency-aware (weekly goals: every 7 days; monthly goals: on anniversary date). Encourages consistent contributions.
Pattern: Console Command → Query users → Check conditions → Prevent duplicates → Create notification + queue email

Installment Payment Tracking (Unusual Feature)
Handles Brazilian-style installment purchases (e.g., furniture in 12 monthly payments). Installment counter decrements on each payment, marks complete only on final installment. Prevents modification of installment count after first payment. Rarely seen in personal finance apps.

Goal System
Progress: (current_value / target_value) × 100
Deposits validate: ownership, sufficient balance, positive amount, goal not complete, deposit won't exceed target
Auto-completes when current_value >= target_value
Line chart shows historical progression with percentage tooltips
Investment Module — Read-Only Recommendations
Profile-matched suggestions (Conservative/Moderate/Aggressive) from 50 pre-seeded options. No portfolio tracking, no performance monitoring, no purchase history. Purely educational.

Dashboard
4 summary cards (total/pending transactions, total/completed goals) + 3 financial cards (earnings, expenses, balance) + 4 charts (earnings vs expenses, 12-month trends, goal progress, category breakdown). Year/month filtering.

What We Can Utilise
Automatic balance management — rent field auto-updates on income receipt based on payment_frequency and payment_day. Directly applicable to our multi-member household model where members get paid on different schedules.
Rule-based alert architecture — scheduled commands with intelligent deduplication. The 50%-of-income threshold is a simple but useful heuristic. Translates well to our "silence is approval" philosophy — only surface amber alerts when thresholds are crossed.
Installment tracking — valuable for UK households managing 0% finance deals, buy-now-pay-later, etc.
Goal deposit validation — the ownership + balance + target checks are a solid pattern for our household goals.
PDF report generation with filter preservation — DomPDF approach for exporting filtered views.
What We Should Do Better
Build native AI suggestions instead of embedding a generic chatbot
Multi-member goal support (couple/family goals with per-person contributions)
Managed categories instead of free-text strings
Forecasting, not just historical reports
Bank feed integration instead of manual entry
michelleezhangg/FinPlan — Educational Features Deep Dive
Finance/Investing Quizzes
Currently a placeholder. The implementation generates a random score within a topic-specific range — no actual questions exist:

Basic Finance: random 80–100
Investing: random 70–90
Retirement Planning: random 60–80
Saving Strategies: random 75–95
Risk Management: random 65–85
The README flags this as future work. Not much to learn from here yet.

Scenario Learning
Static text descriptions returned per scenario:

Buy a House: "involves saving for a down payment, understanding mortgage rates, and managing property taxes"
Retirement: "includes investment in retirement accounts, understanding of pensions, and long-term healthcare planning"
Save for College: "understanding 529 plans, educational savings accounts, and scholarships"
Emergency Fund: "setting aside 3-6 months of expenses for unforeseen circumstances"
Investing in Stocks: "understanding stock markets, diversification, and risk management"
Single-sentence explainers — no interactive simulation or guided walkthrough. More of a glossary than scenario learning.

Investment Simulation
Three-block pipeline:

Risk assessment → dropdown (Low/Medium/High)
Asset allocation → risk-mapped defaults:
Low: 30% stocks, 50% bonds, 20% other
Medium: 50/30/20
High: 70/20/10
(Can manually override percentages)
Investment simulator → compound interest with fixed assumed returns:
Stocks: 7% annual
Bonds: 3% annual
Other: 2% annual
Formula: P × (1 + r)^years per asset class, summed
Simple deterministic projection — no Monte Carlo, no volatility, no rebalancing. Educational only.

Financial Term Glossary
Placeholder — the block makes a fetch() call to https://example-financial-glossary-api.com/ (a dummy URL). No hardcoded definitions exist. Returns "Definition not found" or "Error fetching definition." README lists connecting this to a real API as a short-term goal.

Bottom Line
This is an academic project with more architectural promise than current content. The Blockly-based visual programming approach is genuinely novel for financial literacy, but all four features are stubs/placeholders. The investment simulation's risk-to-allocation mapping and compound growth formula are the only implemented logic.

jgrazian/finplan — Engine Deep Dive
Monte Carlo Engine
Simulation Model: Day-by-day event-driven with intelligent checkpoint advancement (not brute-force daily iteration).


while current_date < end_date:
    process all triggered events (inner loop, max 1000 same-day iterations)
    find next checkpoint (earliest of: next event, quarterly heartbeat, year-end)
    advance time → compound returns → snapshot wealth
Market Return Distributions (6 types):

Distribution	Use Case
Fixed	Bonds, stable accounts
Normal	Classical equity model
LogNormal	Right-skewed, preserves non-negativity
Student's t	Fat tails — captures market crashes
Regime-Switching	Markov bull/bear model — clusters good/bad years
Bootstrap	Sample from actual historical data with optional block structure
Pre-computed constants for: S&P 500, US small-cap, T-bills, bonds, corporate bonds, TIPS, REITs, gold, international developed/emerging. Data spans 1927–2025.

Convergence Detection: Four stopping metrics — mean stability, median stability, success rate stability, percentile range stability. Enables early termination when results converge, saving compute.

Parallelisation: Rayon-based batch distribution with independent local accumulators (no synchronisation overhead). Configurable batch sizes (default 100 per thread).

Two-Phase Simulation
The core memory optimisation:

Phase 1 — Run all N iterations (e.g., 10,000), but for each iteration store only (seed, final_net_worth). Discard full result objects, ledgers, account histories. Memory: O(N) instead of O(N × result_size).

Phase 2 — Sort Phase 1 results. Identify seeds at requested percentiles (P5, P10, P25, P50, P75, P90, P95). Re-run only those 5–10 seeds deterministically to reconstruct complete simulation results with full ledgers and tax summaries.

Why this matters: A full SimulationResult includes account histories, ledger entries, tax summaries, and event logs — orders of magnitude larger than a single float. Re-running 7 seeds out of 10,000 is trivially fast.

Parameter Sweep
Currently 2D (hardcoded), with N-dimensional planned (max 6 parameters).

How it works:

Define a base scenario + 2 sweep axes with ranges and step sizes
Example: retirement age (35–50) × annual expenses ($4k–$10.5k) × house cost ($850k–$1.35M)
Cartesian product of all parameter values
Each combination runs independent Monte Carlo
Results stored in SweepGrid<T> for visualisation
Planned N-dimensional: slice-based rendering where non-displayed dimensions default to midpoint. Multi-chart layouts adapt to terminal width.

Spec Documents
Six detailed specs in /spec/:

Project overview — event-driven methodology
Core architecture — newtype IDs, append-only ledger, builder DSL, two-phase evaluation/application separation
Data model — accounts (4 tax types), assets (lot-based tracking), events (trigger/effect system), transfers (sweep, direct, adjust)
Simulation engine — checkpoint algorithm, convergence, parallel batching
TUI application — Vim-style navigation, modal system
Future roadmap — N-dimensional sweeps, goal-seeking optimisation (binary search, Nelder-Mead), estate planning
Architectural Patterns Worth Learning From
Newtype IDs (AccountId(u16), AssetId(u16)) — compile-time prevention of ID mismatches
Append-only ledger — all state changes recorded immutably for audit trails
Two-phase evaluate/apply — evaluate effects with immutable borrows, then apply with mutable access (clean separation)
Dense Vec over HashMap for hot-path event state — O(1) indexed by EventId
Fluent builder DSL for scenario configuration — readable, composable, with deferred ID resolution
Five lot selection strategies for tax-efficient withdrawals (FIFO, LIFO, HighestCost, LowestCost, AverageCost)
TransferAmount as expression tree — amounts can be fixed values, account references, or arithmetic (Min, Max, Sub, Add, Mul) — enabling complex financial rules without code changes