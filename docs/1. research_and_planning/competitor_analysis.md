

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

---

## Key Patterns Identified

From this research, I've identified several important patterns for your application:

### **Core Features (Table Stakes):**
1. Income & expense tracking with categorization
2. Asset & liability management
3. Visual dashboards and charts
4. Budgeting capabilities
5. Goal/milestone tracking

### **Advanced/Differentiating Features:**
1. **Forecasting & Simulation** - Monte Carlo simulations are becoming standard for serious planning
2. **Privacy/Data Ownership** - Local-first or self-hosted options are highly valued
3. **Flexibility** - Customizable scenarios, tax modeling, international support
4. **Visualization** - Interactive charts, Sankey diagrams, progress tracking over time
5. **Synchronization** - Cross-device sync while maintaining local-first architecture

### **Your Unique Requirements:**
- ✅ Local-first with sync across instances (aligns with Actual Budget model)
- ✅ Income capture (amount, type, frequency)
- ✅ Expenditure capture (amount, type, frequency)
- ✅ Assets/holdings with expected growth
- ✅ Visual, interactive charts for current position and forecasts

---

## Recommended Design Approach

Based on your requirements and the competitive landscape, I recommend:

1. **Architecture:** Local-first with optional sync (like Actual Budget)
   - SQLite or similar for local data storage
   - Sync service for cross-device synchronization
   - No mandatory cloud dependency

2. **Tech Stack Considerations:**
   - Modern web framework (React/Vue/Svelte) for rich interactivity
   - Desktop wrapper (Electron/Tauri) for cross-platform support
   - TypeScript for type safety
   - Chart library (D3.js, Recharts, or Chart.js) for visualizations

3. **Feature Prioritization:**
   - **Phase 1:** Core data capture (income, expenses, assets) + basic visualization
   - **Phase 2:** Forecasting engine with growth projections
   - **Phase 3:** Advanced simulations (Monte Carlo) and scenario planning
   - **Phase 4:** Sync infrastructure and multi-device support

4. **Differentiators:**
   - Combine the simplicity of Actual Budget with the forecasting power of ProjectionLab
   - Focus on the "sweet spot" users who want more than basic budgeting but don't need enterprise-level financial planning
   - Emphasize visual, intuitive forecasting

