# Technology Stack

## **Frontend Stack**

### **Core Framework: React + TypeScript**
**Rationale:**
- **React**: Mature ecosystem, excellent for interactive dashboards, large community
- **TypeScript**: Type safety crucial for financial calculations, better maintainability
- Component reusability for complex financial widgets
- Server-side rendering support for initial load performance

**Alternatives Considered:**
- **Vue 3**: Slightly simpler, but smaller ecosystem for complex data visualization
- **Svelte**: Best performance, but smaller community and fewer charting libraries
- **Verdict**: React + TypeScript offers the best balance of maturity, ecosystem, and developer availability

### **UI Framework: Tailwind CSS + shadcn/ui**
- Tailwind for rapid, consistent styling
- shadcn/ui for accessible, customizable components
- Supports dark mode out of the box
- Responsive design primitives

### **State Management: Zustand + TanStack Query**
- **Zustand**: Lightweight, simple state management for UI state
- **TanStack Query**: Server state management, caching, sync state handling
- Avoids Redux complexity while providing needed power

### **Charting Libraries:**
- **Recharts**: React-native charts, good for standard charts (line, bar, pie)
- **D3.js**: Custom visualizations (Sankey diagrams, advanced interactions)
- **React Flow**: For goal dependency visualization
- **Lightweight, declarative, and performant**

### **Additional Frontend Tools:**
- **React Router**: Navigation and routing
- **date-fns** or **Day.js**: Date manipulation (smaller than Moment.js)
- **Zod**: Runtime type validation and schema validation
- **Framer Motion**: Smooth animations and transitions
- **cmdk**: Command palette implementation (command+k interface)
- **react-hotkeys-hook**: Keyboard shortcut management
- **react-window** or **react-virtualized**: Virtual scrolling for bulk entry spreadsheet
- **Handsontable** (or similar): Spreadsheet-like data entry interface

---

## **Backend Stack**

### **Runtime: Node.js + TypeScript**
**Rationale:**
- Shared language with frontend (code reuse for validation, calculations)
- Excellent async I/O for sync operations
- Mature ecosystem
- Efficient for both HTTP APIs and WebSocket connections

### **Framework: Fastify or Express**
- **Fastify**: Higher performance, built-in TypeScript support, JSON Schema validation
- **Express**: More mature, larger ecosystem
- **Recommendation**: Fastify for performance + modern DX

### **API Layer:**
- **tRPC**: End-to-end type safety between frontend and backend
  - No code generation needed
  - Shared types automatically
  - Perfect for TypeScript full-stack apps
- **Alternative**: REST API with OpenAPI/Swagger if tRPC feels too coupled

---

## **Database Stack**

### **Primary Database: PostgreSQL**
**Rationale:**
- Open-source, mature, reliable
- Excellent JSON support for flexible schema parts
- Strong ACID guarantees (critical for financial data)
- Window functions for time-series analysis
- Good indexing for complex queries
- Easy backup/restore

**For Local-First Architecture:**
- **Local Storage**: SQLite (embedded, no server needed)
- **Server Storage**: PostgreSQL (multi-user, better concurrency)
- **Sync Bridge**: Convert between SQLite and PostgreSQL schemas

### **Caching Layer: Redis (Optional)**
- Session management
- Rate limiting
- Job queue for heavy computations (Monte Carlo)
- Cache for frequently accessed reports

---

## **Synchronization Stack**

### **Sync Protocol: Custom CRDT-inspired or Replication Protocol**

**Option 1: Custom Sync (Recommended)**
- **WebSocket** connections for real-time sync
- **Operational Transform** or simplified **CRDT** for conflict resolution
- **Merkle Trees** for efficient state comparison
- Similar to Actual Budget's approach

**Option 2: Use Existing Sync Backend**
- **RxDB** with replication protocol
- **Electric SQL** (Postgres to SQLite sync)
- **PowerSync** (purpose-built for local-first)

**Recommendation**: Start with **RxDB** for proven local-first architecture, migrate to custom if needed

### **Sync Components:**
- **Client-side**: RxDB (reactive database for browser/mobile)
- **Server-side**: WebSocket server with PostgreSQL
- **Encryption**: End-to-end encryption using Web Crypto API

---

## **Computation & Background Jobs**

### **Simulation Engine: Node.js Worker Threads**
- Monte Carlo simulations are CPU-intensive
- Use **Worker Threads** to avoid blocking main thread
- **Bull** or **BullMQ** for job queue management
- Results cached and stored in database
- Default to reasonable parameters for one-click execution

### **Financial Calculations:**
- Core calculation library (shared frontend/backend)
- Unit-tested extensively
- Functions for: compound interest, amortization, NPV, IRR, inflation adjustments

### **Insight Generation Engine:**
- **Background Job**: Runs periodically to analyze spending patterns
- Detects:
  - Percentage changes in spending categories (month-over-month, year-over-year)
  - Budget tracking status and alerts
  - Goal progress (on track vs. behind)
  - Anomalous transactions
- Generates natural language insights
- Stores insights with timestamps
- Caches for dashboard display

### **Forecast Projection Service:**
- Runs automatic projections based on current data
- Updates when new transactions added
- Simple linear projection for "Based on current trends..." widget
- Caches results per user
- Invalidates cache on relevant data changes

---

## **Deployment & Infrastructure**

### **Web Application:**
- **Docker**: Containerized deployment
- **Docker Compose**: Multi-container orchestration (app + DB + Redis)
- **Nginx**: Reverse proxy and static file serving

### **Self-Hosted Options:**
- One-click Docker deployment
- Support for Unraid, TrueNAS, Synology, QNAP
- SQLite mode for single-user simplicity

### **Cloud-Hosted Options (Optional):**
- **Vercel/Netlify**: Frontend hosting
- **Railway/Fly.io/Render**: Backend + database hosting
- **Cloudflare Workers**: Edge functions for sync coordination

---

## **Testing & Quality**

- **Unit Tests**: Vitest (faster Jest alternative)
- **Integration Tests**: Supertest for API testing
- **E2E Tests**: Playwright (faster than Cypress)
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions

---

## **Security Stack**

- **Authentication**: JWT tokens with refresh token rotation
- **Password Hashing**: bcrypt or Argon2
- **Database**: Prepared statements (SQL injection prevention)
- **API**: Rate limiting, CORS, helmet.js
- **Encryption**: AES-256-GCM for sensitive data at rest
- **TLS**: HTTPS enforcement (Let's Encrypt certificates)

---

# High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Web Browser (PWA)                            │  │
│  │                                                       │  │
│  │  ┌────────────────┐      ┌────────────────────────┐ │  │
│  │  │  React UI      │      │  Visualization Layer   │ │  │
│  │  │  + Command     │      │  (Recharts + D3.js)    │ │  │
│  │  │    Palette     │      │  + Contextual Charts   │ │  │
│  │  └────────────────┘      └────────────────────────┘ │  │
│  │           │                        │                  │  │
│  │  ┌────────▼────────────────────────▼────────────────┐ │  │
│  │  │      Application State (Zustand)                 │ │  │
│  │  └──────────────────┬───────────────────────────────┘ │  │
│  │                     │                                  │  │
│  │  ┌──────────────────▼───────────────────────────────┐ │  │
│  │  │  Local Database (RxDB + IndexedDB/SQLite)       │ │  │
│  │  │  - Transactions, Accounts, Budgets, Goals       │ │  │
│  │  │  - Offline-first storage                         │ │  │
│  │  │  - Cached insights and forecasts                │ │  │
│  │  └──────────────────┬───────────────────────────────┘ │  │
│  │                     │                                  │  │
│  │  ┌──────────────────▼───────────────────────────────┐ │  │
│  │  │  Sync Client (WebSocket + Conflict Resolution)  │ │  │
│  │  └──────────────────┬───────────────────────────────┘ │  │
│  └─────────────────────┼──────────────────────────────────┘  │
│                        │                                      │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │ HTTPS/WSS
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY LAYER                        │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Nginx Reverse Proxy                                     │ │
│  │  - TLS Termination                                       │ │
│  │  - Rate Limiting                                         │ │
│  │  - Static Asset Serving                                  │ │
│  └────────────────┬──────────────────┬──────────────────────┘ │
│                   │                  │                         │
└───────────────────┼──────────────────┼─────────────────────────┘
                    │                  │
        ┌───────────▼────────┐    ┌───▼──────────────┐
        │   HTTP API         │    │  WebSocket       │
        │   (tRPC/REST)      │    │  Sync Server     │
        └───────────┬────────┘    └───┬──────────────┘
                    │                  │
┌───────────────────▼──────────────────▼───────────────────────┐
│                   APPLICATION LAYER                           │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Node.js + Fastify                                       │ │
│  │                                                           │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │ │
│  │  │ Auth Service   │  │  Sync Service  │  │  API       │ │ │
│  │  │ - JWT          │  │  - Conflict    │  │  Controllers│ │ │
│  │  │ - Sessions     │  │    Resolution  │  │            │ │ │
│  │  └────────────────┘  └────────────────┘  └────────────┘ │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │        Business Logic Layer                          │ │ │
│  │  │  - Transaction Management (bulk operations)          │ │ │
│  │  │  - Budget Calculations                               │ │ │
│  │  │  - Goal Tracking + What-if Scenarios                 │ │ │
│  │  │  - Financial Projections                             │ │ │
│  │  │  - Insight Generation                                │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │        Computation Engine                            │ │ │
│  │  │  - Monte Carlo Simulations (Worker Threads)          │ │ │
│  │  │  - Inflation Modeling                                │ │ │
│  │  │  - Financial Forecasting (auto & manual)             │ │ │
│  │  │  - Pattern Detection & Analysis                      │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                 │
└──────────────────────────────┼─────────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────────┐
│                        DATA LAYER                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐       ┌──────────────────────────┐  │
│  │  PostgreSQL          │       │  Redis (Optional)        │  │
│  │  - User Data         │       │  - Session Cache         │  │
│  │  - Transactions      │       │  - Rate Limiting         │  │
│  │  - Accounts          │       │  - Job Queue             │  │
│  │  - Sync Log          │       └──────────────────────────┘  │
│  └──────────────────────┘                                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  File Storage                                            │ │
│  │  - Receipts/Attachments                                  │ │
│  │  - Backups                                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## **Architecture Principles**

### **1. Local-First Architecture**
- Client has full copy of user's data
- All operations work offline
- Sync is bi-directional and eventual
- Server is authoritative for conflicts

### **2. Layered Architecture**
- **Presentation Layer**: React components, pure UI
- **Application Layer**: Business logic, calculations
- **Data Layer**: Database, caching, storage
- Clean separation of concerns

### **3. API-First Design**
- Backend exposes RESTful/tRPC API
- Frontend consumes API
- Enables future mobile apps, integrations
- Documentation auto-generated

### **4. Security Layers**
- Authentication at gateway
- Authorization at business logic layer
- Encryption at data layer
- Security headers at all layers

---

# High-Level Data Models

## **Core Entities**

### **User**
```typescript
User {
  id: UUID
  email: string (unique)
  passwordHash: string
  name: string
  createdAt: timestamp
  updatedAt: timestamp
  preferences: JSON {
    currency: string
    dateFormat: string
    theme: string
    defaultInflationRate: number
  }
  twoFactorEnabled: boolean
  twoFactorSecret?: string
}
```

### **Account**
```typescript
Account {
  id: UUID
  userId: UUID (FK -> User)
  name: string
  type: enum (checking, savings, investment, credit, loan, asset, liability)
  subtype: string (optional, e.g., "401k", "Roth IRA")
  balance: decimal
  currency: string
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
  metadata: JSON {
    institution?: string
    accountNumber?: string (encrypted)
    interestRate?: number
    creditLimit?: number
  }
}
```

### **Transaction**
```typescript
Transaction {
  id: UUID
  userId: UUID (FK -> User)
  accountId: UUID (FK -> Account)
  date: date
  amount: decimal
  type: enum (income, expense, transfer)
  categoryId: UUID (FK -> Category)
  subcategoryId?: UUID (FK -> Category)
  description: string
  memo?: string
  tags: string[] (array of tag names)
  isRecurring: boolean
  recurringRuleId?: UUID (FK -> RecurringRule)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: JSON {
    paymentMethod?: string
    location?: string
    merchant?: string
    receiptUrl?: string
  }
}
```

### **Category**
```typescript
Category {
  id: UUID
  userId: UUID (FK -> User, null for system categories)
  name: string
  type: enum (income, expense)
  parentCategoryId?: UUID (FK -> Category, for subcategories)
  color: string (hex color)
  icon?: string
  isSystemCategory: boolean
  sortOrder: integer
  createdAt: timestamp
  updatedAt: timestamp
}
```

### **RecurringRule**
```typescript
RecurringRule {
  id: UUID
  userId: UUID (FK -> User)
  frequency: enum (daily, weekly, biweekly, monthly, quarterly, annually, custom)
  interval: integer (e.g., every 2 weeks)
  startDate: date
  endDate?: date
  occurrences?: integer (alternative to endDate)
  lastGeneratedDate?: date
  isActive: boolean
  templateTransaction: JSON (Transaction template)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### **Budget**
```typescript
Budget {
  id: UUID
  userId: UUID (FK -> User)
  name: string
  period: enum (monthly, quarterly, annual, custom)
  startDate: date
  endDate: date
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

BudgetItem {
  id: UUID
  budgetId: UUID (FK -> Budget)
  categoryId: UUID (FK -> Category)
  allocatedAmount: decimal
  carryover: boolean
  rolloverAmount?: decimal
  notes?: string
}
```

### **Goal**
```typescript
Goal {
  id: UUID
  userId: UUID (FK -> User)
  name: string
  description?: string
  type: enum (savings, debt_payoff, net_worth, purchase, investment, income)
  targetAmount: decimal
  currentAmount: decimal
  targetDate?: date
  priority: enum (high, medium, low)
  status: enum (active, completed, archived)
  linkedAccountId?: UUID (FK -> Account)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: JSON {
    category?: string
    milestones?: Milestone[]
  }
}

GoalContribution {
  id: UUID
  goalId: UUID (FK -> Goal)
  transactionId?: UUID (FK -> Transaction)
  amount: decimal
  date: date
  notes?: string
}
```

### **Asset**
```typescript
Asset {
  id: UUID
  userId: UUID (FK -> User)
  name: string
  type: enum (real_estate, investment, vehicle, business, personal_property, crypto)
  currentValue: decimal
  purchaseValue?: decimal
  purchaseDate?: date
  expectedGrowthRate: decimal (annual %)
  liquidityType: enum (liquid, semi_liquid, illiquid)
  accountId?: UUID (FK -> Account)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: JSON {
    address?: string (for real estate)
    ticker?: string (for investments)
    shares?: number
    costBasis?: decimal
  }
}

AssetValueHistory {
  id: UUID
  assetId: UUID (FK -> Asset)
  value: decimal
  date: date
  source: enum (manual, automatic, calculated)
}
```

### **Liability**
```typescript
Liability {
  id: UUID
  userId: UUID (FK -> User)
  name: string
  type: enum (mortgage, auto_loan, student_loan, credit_card, personal_loan, line_of_credit)
  currentBalance: decimal
  originalAmount: decimal
  interestRate: decimal
  interestType: enum (fixed, variable)
  minimumPayment: decimal
  paymentFrequency: enum (monthly, biweekly, weekly)
  payoffDate?: date
  accountId?: UUID (FK -> Account)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: JSON {
    lender?: string
    accountNumber?: string (encrypted)
    term?: integer (in months)
  }
}

LiabilityPayment {
  id: UUID
  liabilityId: UUID (FK -> Liability)
  transactionId: UUID (FK -> Transaction)
  principalAmount: decimal
  interestAmount: decimal
  date: date
}
```

### **Forecast**
```typescript
Forecast {
  id: UUID
  userId: UUID (FK -> User)
  name: string
  description?: string
  startDate: date
  endDate: date
  inflationRate: decimal
  categoryInflationRates?: JSON (category-specific rates)
  createdAt: timestamp
  updatedAt: timestamp
}

ForecastScenario {
  id: UUID
  forecastId: UUID (FK -> Forecast)
  name: string (e.g., "Base Case", "Optimistic", "Pessimistic")
  assumptions: JSON {
    incomeGrowth: decimal
    expenseGrowth: decimal
    investmentReturns: decimal
    lifeEvents: LifeEvent[]
  }
}

MonteCarloSimulation {
  id: UUID
  forecastId: UUID (FK -> Forecast)
  iterations: integer
  randomSeed?: integer
  parameters: JSON
  results: JSON {
    percentiles: { p10, p25, p50, p75, p90 }
    successProbability: decimal
    distribution: DataPoint[]
  }
  runDate: timestamp
  computeTimeMs: integer
}
```

---

## **Sync-Specific Models**

### **SyncLog**
```typescript
SyncLog {
  id: UUID
  userId: UUID (FK -> User)
  deviceId: string
  entityType: string (e.g., "Transaction", "Account")
  entityId: UUID
  operation: enum (create, update, delete)
  timestamp: timestamp
  vectorClock: JSON (for causal ordering)
  checksum: string (for integrity)
}
```

### **Device**
```typescript
Device {
  id: UUID
  userId: UUID (FK -> User)
  deviceName: string
  deviceType: enum (web, mobile, desktop)
  lastSyncAt: timestamp
  syncToken: string (encrypted)
  isActive: boolean
  createdAt: timestamp
}
```

### **ConflictLog**
```typescript
ConflictLog {
  id: UUID
  userId: UUID (FK -> User)
  entityType: string
  entityId: UUID
  conflictType: enum (concurrent_update, delete_update)
  localVersion: JSON
  remoteVersion: JSON
  resolution: enum (local_wins, remote_wins, merged, manual)
  resolvedAt?: timestamp
  createdAt: timestamp
}
```

---

## **Entity Relationships**

```
User
  ├── has many Accounts
  ├── has many Transactions
  ├── has many Categories (custom)
  ├── has many RecurringRules
  ├── has many Budgets
  ├── has many Goals
  ├── has many Assets
  ├── has many Liabilities
  ├── has many Forecasts
  └── has many Devices

Account
  ├── has many Transactions
  ├── may link to one Asset
  └── may link to one Liability

Transaction
  ├── belongs to one User
  ├── belongs to one Account
  ├── belongs to one Category
  ├── may belong to one RecurringRule
  └── may contribute to many Goals (via GoalContribution)

Budget
  ├── belongs to one User
  └── has many BudgetItems

Goal
  ├── belongs to one User
  ├── may link to one Account
  └── has many GoalContributions

Asset
  ├── belongs to one User
  ├── may link to one Account
  └── has many AssetValueHistory records

Liability
  ├── belongs to one User
  ├── may link to one Account
  └── has many LiabilityPayments

Forecast
  ├── belongs to one User
  ├── has many ForecastScenarios
  └── has many MonteCarloSimulations
```

---

## **Database Indexing Strategy**

**High-Priority Indexes:**
- `transactions(userId, date DESC)` - transaction list queries
- `transactions(userId, categoryId, date)` - category analysis
- `accounts(userId, isActive)` - active accounts lookup
- `sync_log(userId, timestamp DESC)` - sync operations
- `budget_items(budgetId, categoryId)` - budget lookups
- `goals(userId, status)` - active goals

**Composite Indexes:**
- `transactions(userId, type, date)` - income/expense filtering
- `asset_value_history(assetId, date DESC)` - value tracking
- `liability_payments(liabilityId, date DESC)` - payment history

---

## **Data Model Principles**

1. **User Isolation**: All data scoped to userId for multi-tenancy
2. **Soft Deletes**: Use `isActive` or `deletedAt` for most entities
3. **Audit Trail**: `createdAt` and `updatedAt` on all tables
4. **Flexibility**: JSON columns for extensible metadata
5. **Referential Integrity**: Foreign keys with CASCADE options
6. **Normalization**: Normalized to 3NF, denormalize only for performance
7. **Encryption**: Sensitive fields encrypted at application layer
