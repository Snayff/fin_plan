## Summary of Similar Applications

### **1. Firefly III** (Open Source, Self-Hosted)

- **Focus:** Expense tracking and personal finance management
- **Key Features:**
  - Double-entry bookkeeping system
  - Budgets, categories, and tags for organization
  - Recurring transactions and rule-based automation
  - "Piggy banks" for goal-based saving
  - Multi-currency support
  - REST JSON API for extensibility
- **Notable:** Strong emphasis on privacy (self-hosted), 2FA security, completely isolated from cloud

### **2. Actual Budget** (Open Source, Local-First)

- **Focus:** Envelope budgeting
- **Key Features:**
  - Local-first architecture with optional sync
  - Cross-device synchronization
  - NodeJS/TypeScript stack
  - Multiple deployment options (cloud, self-hosted, local-only)
- **Notable:** Strong data ownership philosophy, community-driven development

### **3. SquirrelPlan**

- **Focus:** Retirement planning and financial forecasting
- **Key Features:**
  - Asset, liability, income, and expense tracking
  - Retirement age and pension planning
  - Inflation and withdrawal rate modeling
  - **Monte Carlo simulations** for risk assessment
  - Standard and advanced financial simulations
- **Notable:** Strong emphasis on retirement-specific calculations

### **4. ProjectionLab**

- **Focus:** Financial independence (FIRE) and comprehensive life planning
- **Key Features:**
  - Full life financial visualization
  - Monte Carlo simulations with historical backtesting
  - Milestone-based planning
  - Tax modeling (international presets)
  - Sankey diagrams for cash flow
  - Progress journaling and comparison to projections
  - Advanced scenarios (Roth conversions, rental income, 72t distributions)
- **Notable:** Privacy-focused (no bank linking), extremely detailed modeling, FIRE-oriented

### **5. Boldin**

- **Focus:** Retirement confidence and comprehensive planning
- **Key Features:**
  - "Panoramic" view of all financial factors
  - Real-time monitoring
  - Scenario "what-if" calculations
  - Monte Carlo analysis
  - Personalized coaching and recommendations
  - Tax, medical, debt, and real estate planning
- **Notable:** Emphasis on coaching/support, comprehensive life-stage planning

### **6. Monarch Money**

- **Focus:** All-in-one personal finance dashboard
- **Key Features:**
  - Aggregates all accounts (13,000+ institutions)
  - Net worth tracking
  - Subscription detection
  - Customizable budgeting and reporting
  - Goal tracking
  - Collaboration features (partner/advisor sharing)
  - Multi-platform (web, iOS, Android)
- **Notable:** Bank aggregation-focused, Mint replacement, collaboration features

### **7. PocketSmith**

- **Focus:** Personal budgeting, forecasting, and multi-account management
- **Founded:** 2008, New Zealand — independent (not acquired)
- **Key Features:**
  - Cash flow forecasting up to 60 years ahead
  - What-if scenario testing for financial decisions
  - Automatic bank feeds (12,000+ institutions via Yodlee, Plaid, Salt Edge, Akahu, Basiq)
  - Multi-currency support with automatic daily rate conversion
  - Flexible budget periods (daily, weekly, monthly, custom)
  - Budget calendar for scheduling bills
  - Net worth tracking (property, mortgages, vehicles, loans)
  - Customisable dashboards (up to unlimited depending on plan)
  - Multi-user/collaboration (share with advisors, family)
  - Mobile app (PocketSmith Sidekick — iOS/Android)
  - Customisable email digest summaries on user-defined schedules
- **Pricing (UK, annual billing):** Free → £9.99 → £16.66 → £26.66/month
- **Markets:** UK, US, Australia, NZ, Canada — 367,000+ users
- **Notable:** Transaction-tracking ledger model (not intent-based); bank sync is core value proposition; strong security posture (read-only feeds, no data monetisation); 14-day money-back guarantee

---

## Key Patterns Identified

From this research, I've identified several important patterns:

### **Core Features (Table Stakes):**

1. Income & expense tracking with categorisation
2. Asset & liability management
3. Visual dashboards and charts
4. Budgeting capabilities
5. Goal/milestone tracking
6. Bank aggregation/feeds — now expected by users of mainstream tools

### **Advanced/Differentiating Features:**

1. **Long-range Forecasting** — cash flow projections extending years or decades (PocketSmith, SquirrelPlan, ProjectionLab)
2. **Simulation & What-If** — scenario testing and Monte Carlo analysis becoming standard for serious planning (PocketSmith, Boldin, ProjectionLab)
3. **Budget Calendar** — visual bill timing across the year (PocketSmith)
4. **Privacy/Data Ownership** — local-first or self-hosted options are highly valued (Firefly III, Actual Budget, ProjectionLab)
5. **Flexibility** — customisable scenarios, tax modelling, international support
6. **Visualization** — interactive charts, Sankey diagrams, net worth over time
7. **Synchronisation** — cross-device sync while maintaining local-first architecture

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
6. **Waterfall Sankey diagram** (ProjectionLab uses Sankey for cash flow) — a Sankey built around the waterfall tiers would be the ideal visual representation of finplan's core mental model.

### Features that explicitly do NOT fit finplan

These are ruled out by design anchors, not by preference:

- Bank sync / transaction import — anchor #8
- Multi-currency support — anchor #5
- Financial advice, coaching, or scoring — anchors #9, #10
- Mobile-first experience — anchor #6 (deferred)
- Gross income / tax modelling — anchor #4
- Monte Carlo / retirement modelling — out of scope (household budget planning, not retirement planning)
