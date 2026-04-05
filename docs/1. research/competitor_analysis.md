## Summary of Similar Applications

### **1. Firefly III** (Open Source, Self-Hosted)

- **Focus:** Expense tracking and personal finance management via double-entry bookkeeping
- **Key Features:**
  - Double-entry bookkeeping system with full account reconciliation
  - Envelope-based budgeting — set a fixed amount per period (monthly, weekly, custom), with multi-currency budget limits
  - Categories, tags, and free-text notes for rich transaction organisation
  - Recurring transactions with automatic scheduling
  - **Rule engine** — powerful automation that processes transactions on create/edit. Combines trigger conditions (merchant name, amount range, description contains, etc.) with actions (set category, add tag, set budget, move to piggy bank). Rules are grouped and ordered, enabling complex cascading logic
  - **Piggy banks** — goal-based savings containers linked to accounts. Can be targeted by rules (e.g., "round up every coffee purchase into Holiday piggy bank"). Track progress toward a target amount with visual progress bars
  - Import support: CSV, OFX, QIF, plus API-based imports via the data importer companion app
  - **Reports:** Expenses per week/month/year, income vs expense breakdowns, budget consumption reports, account audit views with detailed list-mode inspection, and tag-based cross-cutting reports
  - REST JSON API for full programmatic access — enables third-party mobile apps, custom dashboards, and integrations
  - 2FA authentication, completely isolated from external servers unless explicitly configured
- **Design & UX:**
  - Traditional server-rendered web UI (Laravel + Blade/Twig templates) with Bootstrap responsive grid
  - Light theme by default; functional rather than polished — the UI prioritises data density over visual refinement
  - Sidebar navigation with collapsible menu on small screens
  - Dashboard shows account balances, recent transactions, budget status, and piggy bank progress at a glance
  - Charts are simple bar/line/pie — informative but not visually distinctive
- **finplan considerations:**
  - **Rule engine concept** — the trigger→action pattern for automating categorisation is elegant. finplan doesn't track transactions, but a similar pattern could power automated nudges or staleness detection (e.g., "if item hasn't been reviewed in 60 days → flag amber")
  - **Piggy bank progress visualisation** — simple goal progress bars with target amounts. Directly relevant to finplan's goals feature

---

### **2. Actual Budget** (Open Source, Local-First)

- **Focus:** Envelope budgeting with local-first architecture
- **Key Features:**
  - **Envelope budgeting model** — budget only the cash you have on hand, preventing over-allocation. Categories act as digital envelopes; overspending in one category must be covered by moving money from another
  - **Rollover behaviour** — unspent budget rolls forward to the next month automatically, overspent categories carry negative balances forward
  - **Goal templates** (experimental, 2026) — GUI for defining budget goals per category, predicting total needed to meet all goals, viewing all active goals, and modifying fill order. Cleanup templates for end-of-month resets
  - **Transaction import** — supports QIF, OFX, QFX, CAMT.053, and CSV formats
  - **Linked transfers** — creating a transfer auto-links both sides and keeps them in sync
  - **Robust undo system** — rollback any change with full redo support; encourages experimentation
  - **Plugin architecture** (2026 roadmap) — modular plugin system starting with bank sync provider migration, enabling community extensions
  - Cross-device sync with optional self-hosted server (end-to-end encrypted)
  - Multiple deployment modes: cloud-hosted, self-hosted Docker, or fully local/offline
- **Design & UX:**
  - Clean, minimal interface explicitly designed to "get out of your way" — speed of navigation is a core design goal
  - Built-in dark mode with dynamic theming that follows system preferences
  - Spreadsheet-like budget grid that feels familiar to users coming from YNAB or Excel
  - Month-to-month navigation with visual indicators for over/under-budget categories
  - Reports include net worth over time, cash flow, and spending breakdowns
- **finplan considerations:**
  - **Undo system** — the ability to freely experiment and roll back is powerful for a planning tool. finplan's waterfall adjustments could benefit from undo/redo, especially during Review Wizard sessions
  - **Goal templates with fill-order** — the concept of prioritised goal funding (fill this goal first, then this one) maps well to finplan's surplus allocation
  - **"Get out of your way" design philosophy** — aligns with finplan's calm, minimal approach. Validates the direction of reducing UI friction

---

### **3. SquirrelPlan** (Open Source, Client-Side)

- **Focus:** Retirement planning and long-range wealth simulation
- **Key Features:**
  - **Client-side SPA** — all computation runs in the browser, no server required. Data never leaves the user's machine
  - Asset tracking with per-asset annual return rates; liability tracking with per-liability interest rates
  - Monthly income and expense entry with annual increase percentages (inflation modelling)
  - **Savings allocation strategies** — define how surplus is distributed across asset classes, with the ability to set different allocation strategies for different life stages (e.g., aggressive in 20s, conservative near retirement)
  - **Dual retirement modelling** — standard retirement (legal retirement age + government pension) and early retirement (user-defined age + withdrawal rate). Calculates required capital for each scenario
  - Simulation parameters: inflation rate, expected returns, withdrawal rate, government pension amount
  - **JSON import/export** — full data portability via file download/upload
  - Month-by-month projection from current age to 100
- **Design & UX:**
  - Minimal, form-heavy UI — essentially a structured calculator with output charts
  - Single-page layout with input sections flowing into projection output
  - Stacked area charts showing asset growth over time (liquid vs fixed assets)
  - No account system, no login — purely a local tool
  - Functional but visually basic; prioritises utility over aesthetics
- **finplan considerations:**
  - **Life-stage allocation strategies** — the idea of changing surplus distribution rules based on life phase is interesting. finplan could allow different savings/goal allocation profiles (e.g., "saving for house deposit" vs "post-mortgage freedom" modes)
  - **JSON export for data portability** — simple, effective pattern for self-hosted/privacy-first tools. Relevant if finplan adds data export capabilities

---

### **4. ProjectionLab**

- **Focus:** Financial independence (FIRE) and comprehensive life-stage financial planning
- **Key Features:**
  - **Full-life financial model** — build a living model of your entire financial life, from now through retirement and beyond
  - **Monte Carlo simulations** with historical backtesting — run thousands of iterations using actual historical market data to stress-test plans
  - **Milestone system** — flexible goal framework that captures major life events: achieving financial independence, buying a home, having children, career changes, moving locations, going part-time. Milestones have trigger conditions and cascade through the model
  - **Scenario modelling** — create multiple "what if" scenarios and toggle them on/off to instantly see impact. Quick comparison without duplicating data
  - **Sankey cash flow diagrams** — visual breakdown of how money flows into and out of the plan each year. Income sources on the left, expense categories on the right, with flow widths proportional to amounts
  - **Tax analytics** — models tax impact across filing statuses, brackets, and jurisdictions. Supports advanced strategies (Roth conversions, 72t distributions, capital gains harvesting)
  - **Progress journaling** — record actual financial snapshots over time and compare reality against projections. Tracks drift between plan and actuals
  - Income streams (salary, side income, rental), expenses, debts, and investment accounts with contribution/withdrawal strategies
  - Account types with tax-treatment modelling (pre-tax, post-tax, taxable, tax-free)
- **Design & UX:**
  - **Privacy-first, manual entry** — no bank linking by design. Users enter their own data manually. This is positioned as a feature, not a limitation, and users explicitly praise it
  - Modern, polished interface — frequently described as "slick", "fast", and confidence-inspiring
  - Designed to encourage experimentation — toggling scenarios, adjusting sliders, and exploring outcomes feels playful rather than clinical
  - Dark theme available with clean typography and well-spaced layouts
  - Interactive charts (line projections, Sankey flows, Monte Carlo fan charts) are core to the experience, not afterthoughts
  - Milestone timeline visualisation shows life events on a horizontal axis integrated with wealth projections
- **finplan considerations:**
  - **Sankey diagram for cash flow** — the most natural visualisation for finplan's waterfall model. Income flowing through committed → discretionary → surplus as a Sankey would be the signature visual
  - **Scenario toggling** — "what if I increase rent by £200?" as a toggle rather than a separate copy of the plan. Lightweight, non-destructive experimentation
  - **Progress journaling / plan-vs-actual tracking** — finplan holds the plan; periodically recording "what actually happened" and comparing drift would add enormous value during review sessions
  - **Milestone system** — life events that change the financial model (new baby, mortgage completion, career change) are directly applicable. finplan could model these as waterfall-affecting events
  - **Privacy-first positioning** — ProjectionLab proves that "no bank sync" can be marketed as a trust advantage, not a missing feature. Validates finplan's approach

---

### **5. Boldin** (formerly NewRetirement)

- **Focus:** Retirement confidence and comprehensive life-stage financial planning
- **Key Features:**
  - **"Panoramic" financial view** — unified dashboard covering income, expenses, Social Security/pensions, taxes, real estate, healthcare, debts, insurance, and estate planning
  - **Monte Carlo analysis** — thousands of simulated outcomes producing a "retirement success score" (probability of not running out of money)
  - **Scenario "what-if" engine** — adjust any variable (retirement age, spending, returns, housing) and see immediate projected impact
  - **Spending guardrails insight** (March 2026) — calculates safe spending amounts in retirement, showing upper and lower bounds to stay on track without depleting savings
  - **Sankey cashflow insight** (February 2026) — visual money-flow mapping showing where income comes from and where it goes, helping identify spending patterns
  - **Financial journey chart** (February 2026) — timeline visualisation with life events (property sales, one-time expenses, milestones) plotted directly on wealth projections
  - **Guided input experience** — right-hand panel provides contextual guidance and explanations as users fill in each section of the planner (updated January 2026)
  - Real-time monitoring with dashboards that update as inputs change
  - Tax modelling (federal + state), healthcare cost projections, debt payoff strategies, real estate appreciation
  - Personalised coaching and recommendations (advisory tone — opposite of finplan's philosophy)
  - Collaboration: share plans with financial advisors
- **Design & UX:**
  - Dashboard-heavy interface with summary cards, projection charts, and insight panels
  - Clean, professional aesthetic — more "financial advisor software" than consumer app
  - Guided flow: structured input sections with explanatory sidebars reduce cognitive load
  - Visualisations include area charts (savings over time with pessimistic/optimistic bands), Sankey flows, and journey timelines
  - Mobile-responsive but desktop-optimised
- **finplan considerations:**
  - **Contextual guidance panels** — the right-hand panel that explains what each input means and why it matters. finplan's definitions/tooltips serve a similar purpose, but a persistent guidance panel during setup could improve the Waterfall Creation Wizard experience
  - **Financial journey timeline** — plotting life events on a projection chart. Relevant if finplan adds forecasting — showing when goals complete, when yearly bills cluster, or when income changes occur
  - **Spending guardrails concept** — the idea of "safe range" bounds rather than a single target number. finplan could show surplus as a range (optimistic/pessimistic) rather than a single figure

---

### **6. Monarch Money**

- **Focus:** All-in-one personal finance dashboard with bank aggregation
- **Key Features:**
  - **Account aggregation** — connects to 13,000+ financial institutions for automatic transaction import
  - **Net worth tracking** — unified view across all accounts with trend visualisation
  - **Subscription detection** — automatically identifies recurring charges (streaming, gym, apps) and surfaces forgotten subscriptions
  - **Customisable budgeting** — flexible budget categories with rollover support and spending insights
  - **Shared views** (collaboration) — accounts and transactions labelled as "mine", "theirs", or "ours". Filter all views (accounts, net worth, reports) by ownership. Designed for couples managing joint and individual finances
  - **AI assistant** — natural language queries about spending patterns, budget status, and financial data
  - **Investment monitoring** — portfolio performance tracking across brokerage accounts: asset allocation, growth, returns, and diversification metrics
  - **Equity tracking** — monitor home equity and other property values alongside liquid assets
  - **Receipt scanning** — photograph receipts and attach them to transactions
  - **Goal tracking** — set financial goals with progress visualisation
  - Customisable dashboard widgets (cash flow, net worth, upcoming bills, financial health score)
  - Multi-platform: web, iOS, Android with consistent experience
- **Design & UX:**
  - Modern, consumer-friendly interface — positioned as the premium Mint replacement
  - Clean dashboard with widget-based layout; users choose which financial views to surface
  - Warm, approachable colour palette — avoids the clinical feel of traditional finance software
  - Strong mobile experience with feature parity across platforms
  - Smooth animations and transitions; feels like a well-built consumer product
  - Uses colour-coding for spending categories and financial health indicators (green/red — explicitly against finplan's philosophy)
- **finplan considerations:**
  - **Shared views (mine/theirs/ours)** — directly relevant to finplan's multi-member household model. The ability to see household totals and per-member breakdowns using ownership labels is a proven UX pattern for couples
  - **Subscription detection as a concept** — finplan tracks committed spend manually, but surfacing "you have 12 monthly subscriptions totalling £X" as a committed-spend insight could be valuable during review
  - **Dashboard widget customisation** — letting users choose which financial views matter most to them. finplan's two-panel layout is more constrained, but user-configurable summary cards could work within it

---

### **7. PocketSmith**

- **Focus:** Personal budgeting, cash flow forecasting, and multi-account management
- **Founded:** 2008, New Zealand — independent (not acquired)
- **Key Features:**
  - **Calendar-based forecasting** — the core differentiator. Budget events placed on a calendar generate day-level cash flow projections up to 60 years ahead. Users see exactly how much they're projected to have on any given day
  - **What-if scenario testing** — adjust budget events and immediately see the projected impact on future balances
  - **Compounding interest modelling** — enter an interest rate for any account and forecasts automatically factor in compound growth. Simple but powerful for savings projections
  - **Flexible budget periods** — daily, weekly, fortnightly, monthly, quarterly, yearly, or custom intervals per budget category. "Daily coffee" and "annual insurance" coexist naturally
  - **Budget calendar** — visual calendar showing when bills and income events fall, making timing-based cash flow risk visible at a glance
  - **Customisable dashboards** — up to 18 dashboards (Flourish tier), each built from 15+ widget types: balance graphs, bill reminders, budget gauges, net worth trackers, transaction feeds
  - **Email digest summaries** — customisable scheduled email reports on user-defined intervals. Passive financial awareness without opening the app
  - **Forecast vs actual comparison** — the forecast graph overlays projected (budgeted) balances against actual balances, making plan drift visible over time
  - Automatic bank feeds (12,000+ institutions via Yodlee, Plaid, Salt Edge, Akahu, Basiq)
  - Multi-currency support with automatic daily exchange rate conversion
  - Net worth tracking across property, mortgages, vehicles, loans
  - Multi-user collaboration (share with advisors, family members)
  - Mobile app (PocketSmith Sidekick — iOS/Android)
- **Design & UX:**
  - Feature-rich but interface is acknowledged as dated — "in need of major improvements" per reviews
  - Calendar view is the centrepiece and most distinctive UI element
  - Dashboard flexibility is best-in-class among competitors but can feel overwhelming with so many configuration options
  - Colour-coded budget categories on the calendar; forecast graph uses layered area charts
  - Desktop-optimised with a companion mobile app for on-the-go access
- **Pricing (UK, annual billing):** Free → £9.99 → £16.66 → £26.66/month
- **Markets:** UK, US, Australia, NZ, Canada — 367,000+ users
- **finplan considerations:**
  - **What-if scenario testing** — "What if I increase discretionary spend by £200/month?" fits the planning ethos perfectly. Surplus changes cascade through the waterfall automatically. The most requested advanced feature across competitors
  - **Long-range cashflow projection** — finplan has monthly surplus; projecting that forward over 1–5 years (with goals, assets, and known changes) would be high-value
  - **Budget calendar / bill timing view** — showing when yearly bills fall due across the year complements the ÷12 pot model and makes cashflow risk more tangible
  - **Email digest / periodic summary** — a calm monthly summary aligns with finplan's "review at your own pace" ethos and the Review Wizard workflow
  - **Forecast vs actual overlay** — directly supports plan-vs-reality comparison during review sessions. Combined with finplan's snapshot system, this could show "what I planned in January" vs "what I adjusted by June"
  - **Flexible budget periods per item** — the idea that each budget item has its own natural frequency (daily, weekly, monthly, yearly) rather than forcing everything into monthly. finplan already handles yearly via ÷12, but this validates the approach

---

## Key Patterns Identified

From this research, several important patterns emerge:

### **Core Features (Table Stakes):**

1. Income & expense tracking with categorisation
2. Asset & liability management
3. Visual dashboards and charts
4. Budgeting capabilities
5. Goal/milestone tracking
6. Bank aggregation/feeds — now expected by users of mainstream tools

### **Advanced/Differentiating Features:**

1. **Long-range forecasting** — cash flow projections extending years or decades (PocketSmith, SquirrelPlan, ProjectionLab)
2. **Simulation & what-if** — scenario testing and Monte Carlo analysis becoming standard for serious planning (PocketSmith, Boldin, ProjectionLab)
3. **Budget calendar** — visual bill timing across the year (PocketSmith)
4. **Privacy/data ownership** — local-first or self-hosted options are highly valued (Firefly III, Actual Budget, ProjectionLab)
5. **Flexibility** — customisable scenarios, tax modelling, international support
6. **Visualisation** — interactive charts, Sankey diagrams, net worth over time
7. **Synchronisation** — cross-device sync while maintaining local-first architecture
8. **Collaboration/multi-user** — couples and household support is a growing expectation (Monarch, PocketSmith, Boldin)
9. **Plan-vs-actual comparison** — tracking drift between intended budget and reality over time (PocketSmith, ProjectionLab)
10. **Contextual guidance** — in-app explanations and guided input flows reduce onboarding friction (Boldin)

### **Design Patterns Worth Noting:**

1. **Dark mode is expected** — every modern finance tool offers it; finplan's dark-only approach is well-aligned
2. **Privacy-first as a feature** — ProjectionLab proves manual entry can be positioned as a trust advantage
3. **Experimentation-friendly UX** — undo systems (Actual Budget), scenario toggles (ProjectionLab), and what-if testing (PocketSmith) all encourage users to explore without fear
4. **Calm over density** — the most praised interfaces (ProjectionLab, Monarch) balance information density with breathing room
5. **Signature visualisation** — the most memorable tools have one distinctive visual (PocketSmith's calendar, ProjectionLab's Sankey, Boldin's journey timeline)

---

## finplan vs. the Field

### How finplan differs from all competitors

| Dimension    | finplan                                                  | Competitors                             |
| ------------ | -------------------------------------------------------- | --------------------------------------- |
| Mental model | Waterfall (income → committed → discretionary → surplus) | Account-centric or envelope-based       |
| Data model   | Intent/plan (budgeted amounts)                           | Ledger (actual transactions)            |
| Bank sync    | None by design                                           | Core feature for most                   |
| Scope        | UK-only, GBP, desktop-first                              | Global, multi-currency, mobile-first    |
| Philosophy   | Non-advisory, calm, silence = approval                   | Alerts, recommendations, scoring        |
| Bills model  | ÷12 virtual pot (yearly bills accrued monthly)           | Calendar reminders or manual            |
| Tone         | Arithmetic surfacing only                                | Coaching, advice, gamification (varies) |

### finplan's Unique Selling Points

1. **The Waterfall** — no other app organises finances as income → committed → discretionary → surplus. It's a distinct mental model that makes allocation decisions explicit and sequential rather than treating all spending as a flat pool.
2. **Intent over ledger** — finplan holds the plan; the bank holds the transactions. Lower maintenance, cleaner data, and no bank-sync trust or privacy concerns.
3. **÷12 virtual pot for yearly bills** — a structurally elegant way to handle irregular spend that none of the competitors explicitly model. Cashflow shortfalls are detected automatically.
4. **UK-opinionated** — April tax year, GBP, UK terminology throughout. Competitors either ignore the UK or treat it as an afterthought alongside 50 other locales.
5. **Calm design philosophy** — silence means everything is healthy; amber is the only nudge; no scoring, no grading, no anxiety-inducing alerts. The opposite of most tools on the market.

### Features from competitors that could fit finplan's objectives

The following features appear in other tools and are compatible with finplan's design anchors — they require no bank data, no transaction tracking, and no advisory tone:

1. **What-if scenario testing** (PocketSmith, Boldin, ProjectionLab) — "What if I increase discretionary spend by £200/month?" fits the planning ethos perfectly. Surplus changes cascade through the waterfall automatically.
2. **Long-range cashflow projection** (PocketSmith, SquirrelPlan, ProjectionLab) — finplan has monthly surplus; projecting that forward over 1–5 years (with goals, assets, and known changes) would be high-value.
3. **Budget calendar / bill timing view** (PocketSmith) — showing when yearly bills fall due across the year complements the ÷12 pot model and makes cashflow risk more tangible.
4. **Email digest / periodic summary** (PocketSmith) — a calm monthly summary aligns with finplan's "review at your own pace" ethos and the Review Wizard workflow.
5. **Net worth snapshot** (PocketSmith, Monarch Money, Boldin) — finplan already holds assets and liabilities; a headline net worth figure with a trend line is a natural addition.
6. **Waterfall Sankey diagram** (ProjectionLab, Boldin) — a Sankey built around the waterfall tiers would be the ideal visual representation of finplan's core mental model. Both ProjectionLab and Boldin have added Sankey cash flow views, validating the pattern.
7. **Shared views / multi-member ownership** (Monarch Money) — the "mine/theirs/ours" labelling pattern for couples is directly applicable to finplan's multi-member household model. Enables per-person and household-level views of the waterfall.
8. **Plan-vs-actual drift tracking** (PocketSmith, ProjectionLab) — periodically recording what actually happened and overlaying it against the plan. Combined with finplan's snapshot system, this enables "what I planned in January" vs "what I adjusted by June" comparisons.
9. **Scenario toggling** (ProjectionLab) — non-destructive "what if" overlays that can be flipped on/off without duplicating the plan. Lightweight experimentation aligned with finplan's planning ethos.
10. **Milestone / life-event modelling** (ProjectionLab, Boldin) — major life events (new baby, mortgage completion, career change) that alter the waterfall. Modelling these as future events with projected impact fits finplan's forward-looking philosophy.
11. **Undo/redo for planning changes** (Actual Budget) — encourages experimentation during waterfall setup and review sessions. Low-risk exploration builds user confidence.
12. **Contextual guidance during setup** (Boldin) — explanatory panels alongside input fields during the Waterfall Creation Wizard. Aligns with finplan's "empower, don't advise" principle — explain the mechanics, not what to do.

### Features that explicitly do NOT fit finplan

These are ruled out by design anchors, not by preference:

- Bank sync / transaction import — anchor #8
- Multi-currency support — anchor #5
- Financial advice, coaching, or scoring — anchors #9, #10
- Mobile-first experience — anchor #6 (deferred)
- Gross income / tax modelling — anchor #4
- Monte Carlo / retirement modelling — out of scope (household budget planning, not retirement planning)
- Financial health scores or colour-coded judgements on financial values — anchor #10, #11
- AI-powered spending analysis — requires transaction data (anchor #8) and tends toward advisory tone (anchor #9)
- Gamification (badges, streaks, rewards) — contrary to calm philosophy (anchor #11)
