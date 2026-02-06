
# User Journeys - Complete Documentation

## **TRANSACTION MANAGEMENT**

### **1. Adding a New Income Stream**

**User Goal:** Record a new source of income

**Journey Steps:**

**Option A: Traditional Flow**
1. User navigates to **Income** screen (via main navigation)
2. Screen displays list of existing income streams (if any)
3. User clicks **"+ New Income"** button (top-right)

**Option B: Command Palette (Quick Entry)**
1. User presses **Ctrl+K** (or Cmd+K on Mac) from anywhere in the app
2. Command palette opens
3. User types "add income" or selects "New Income" from suggestions
4. Quick entry form appears with 3 essential fields
4. Modal/form appears with the following fields:
   - **Name*** (text): e.g., "Monthly Salary", "Freelance Project"
   - **Amount*** (currency): e.g., $5,000.00
   - **Date*** (date picker): When income is received
   - **Category*** (dropdown): Employment, Self-Employment, Investment Income, Gift, etc.
   - **Receiving Account*** (dropdown): Select from user's accounts
   - **Is Recurring?** (toggle/checkbox)
     - If YES, additional fields appear:
       - **Frequency** (dropdown): Daily, Weekly, Bi-weekly, Monthly, Quarterly, Annually, Custom
       - **Start Date** (date picker)
       - **End Date** (optional date picker) OR **Number of Occurrences** (number input)
   - **Description** (text area, optional): Additional notes
   - **Tags** (multi-select, optional): Add relevant tags
5. User fills in required fields (marked with *)
6. User clicks **"Save"** button
7. System validates input:
   - If valid: Success message appears, modal closes, income appears in list
   - If invalid: Error messages appear inline near invalid fields
8. List automatically updates and shows the new income stream

**Progressive Disclosure in Action:**
- Initial form shows only: Amount*, Category*, Date*
- "Show more options" link expands to reveal: Account, Recurring settings, Description, Tags
- Smart defaults auto-fill last-used values

**Alternative Flows:**
- **Cancel**: User clicks "Cancel" → Confirmation dialog appears → Changes discarded
- **Save & Add Another**: User clicks "Save & Add Another" → Current entry saved, form clears for next entry
- **Template Usage**: User clicks recent transaction → Form pre-fills with similar values → User adjusts amount/date → Saves

---

### **2. Adding an Expenditure**

**User Goal:** Record a new expense or recurring bill

**Journey Steps:**
1. User navigates to **Expenses** screen (via main navigation)
2. Screen displays list of existing expenses organized by category or date
3. User clicks **"+ New Expense"** button (top-right)
4. Modal/form appears with the following fields:
   - **Name*** (text): e.g., "Groceries", "Electric Bill", "Netflix Subscription"
   - **Amount*** (currency): e.g., $150.00
   - **Date*** (date picker): When expense occurred/will occur
   - **Category*** (dropdown): Housing, Food, Transportation, Entertainment, etc.
   - **Sub-category** (dropdown, optional): Appears based on category selection
   - **Payment Account*** (dropdown): Account to pay from
   - **Payment Method** (dropdown, optional): Cash, Credit Card, Debit Card, Transfer
   - **Is Recurring?** (toggle/checkbox)
     - If YES, additional fields appear:
       - **Frequency** (dropdown): Daily, Weekly, Bi-weekly, Monthly, Quarterly, Annually, Custom
       - **Start Date** (date picker)
       - **End Date** (optional) OR **Number of Occurrences** (optional)
   - **Description** (text area, optional): Additional notes
   - **Tags** (multi-select, optional): For cross-category tracking
   - **Attach Receipt** (file upload, optional): Upload receipt image/PDF
5. User fills in required fields
6. User clicks **"Save"** button
7. System validates and saves:
   - Success message appears
   - Expense appears in list
   - Account balance updates automatically
8. If recurring, system confirms: "Recurring expense created. Future occurrences will be generated automatically."

**Alternative Flows:**
- **Quick Add**: Quick entry mode with minimal fields (name, amount, category) for fast data entry

---

### **2a. Bulk Transaction Entry (Spreadsheet Interface)**

**User Goal:** Enter multiple transactions quickly using a spreadsheet-like interface

**Journey Steps:**
1. User navigates to **Transactions** screen
2. User clicks **"Bulk Add"** button or presses **Ctrl+Shift+B**
3. Spreadsheet interface appears with columns:
   - Date | Amount | Category | Description | Account | Tags
4. User enters data using keyboard navigation:
   - **Tab** moves to next field
   - **Enter** moves to next row
   - **Arrow keys** navigate cells
   - **Ctrl+V** pastes from clipboard (e.g., from Excel or banking statement)
5. Real-time validation occurs:
   - Invalid dates show red border with tooltip
   - Invalid amounts show error icon
   - Unknown categories suggest closest match
6. User can:
   - Add rows with **"+ Add Row"** button or **Ctrl+N**
   - Delete rows with row menu or **Delete** key
   - Sort by any column
   - Filter to see only errors
7. Save options appear:
   - **"Save All"** - Saves all valid transactions
   - **"Fix Errors First"** - Highlights errors, prevents save until fixed
8. User clicks **"Save All"** (assuming no errors)
9. Progress indicator: "Saving 25 transactions..."
10. Success message: "25 transactions added successfully"
11. Transactions appear in main list

**Features:**
- Auto-complete for categories and accounts
- Drag-fill for repeated values (like Excel)
- Copy/paste support from banking CSV exports
- Undo/redo support (Ctrl+Z/Ctrl+Y)

---

### **3. Adding a Payment Account**

**User Goal:** Set up a new financial account to track

**Journey Steps:**
1. User navigates to **Accounts** screen (via main navigation)
2. Screen displays cards/tiles showing existing accounts with balances
3. User clicks **"+ New Account"** button (top-right)
4. Account type selection screen appears:
   - **Cash & Checking**
   - **Savings**
   - **Credit Card**
   - **Investment**
   - **Loan**
   - **Asset**
   - **Other**
5. User selects account type (e.g., "Checking")
6. Form appears with fields appropriate to account type:
   - **Account Name*** (text): e.g., "Chase Checking", "Emergency Savings"
   - **Financial Institution** (text, optional): e.g., "Chase Bank"
   - **Current Balance*** (currency): Starting balance
   - **Currency*** (dropdown): USD, EUR, GBP, etc.
   - **Account Number** (text, optional, encrypted): Last 4 digits for reference
   - **Type-Specific Fields**:
     - For Credit: Credit Limit, Interest Rate
     - For Savings: Interest Rate, Goal (if applicable)
     - For Loan: Original Amount, Interest Rate, Payment Frequency
   - **Notes** (text area, optional): Additional details
   - **Account Color** (color picker): For visual identification
7. User fills in required fields
8. User clicks **"Save"** button
9. System creates account:
   - Success message appears
   - Redirects to Accounts screen
   - New account appears with balance
   - Account is now available for transaction selection

**Alternative Flows:**
- **Import from Template**: Select common account types with pre-filled defaults
- **Set as Default**: Mark this account as default for income/expenses

---

## **BUDGETING & PLANNING**

### **4. Creating a Budget**

**User Goal:** Set spending limits for different categories

**Journey Steps:**
1. User navigates to **Budget** screen
2. Screen shows current budget status (if any) with progress bars
3. User clicks **"Create New Budget"** or **"Edit Budget"**
4. Budget setup wizard appears:
   
   **Step 1: Budget Period**
   - **Budget Name** (text): e.g., "2026 Monthly Budget"
   - **Period Type** (dropdown): Monthly, Quarterly, Annual, Custom
   - **Start Date** (date picker)
   - **End Date** (auto-calculated or manual)
   - Click **"Next"**
   
   **Step 2: Income Allocation**
   - Shows total expected income for period
   - User can adjust expected income if needed
   - Click **"Next"**
   
   **Step 3: Category Allocation**
   - List of all expense categories appears
   - Each category has:
     - Category name and icon
     - Input field for budget amount
     - Percentage of total income indicator
     - Historical spending (if available)
   - Real-time calculation shows:
     - Total allocated
     - Remaining to allocate
     - Over/under allocation warning
   - **Quick Templates**: 50/30/20 rule, Zero-based, Custom
   - Click **"Next"**
   
   **Step 4: Review & Confirm**
   - Summary of budget allocation
   - Visual breakdown (pie chart)
   - Option to enable alerts
   - Click **"Create Budget"**

5. Budget is activated and tracking begins
6. User returns to Budget dashboard showing real-time tracking

**Features:**
- Copy from previous budget
- Adjust individual categories mid-period
- Rollover unused budget option

---

### **5. Setting Up a Financial Goal**

**User Goal:** Create a savings goal or financial milestone

**Journey Steps:**
1. User navigates to **Goals** screen
2. Screen displays existing goals with progress bars
3. User clicks **"+ New Goal"** button
4. Goal creation form appears:
   
   **Basic Information:**
   - **Goal Name*** (text): e.g., "House Down Payment", "Emergency Fund"
   - **Goal Type*** (dropdown): Savings, Debt Payoff, Net Worth, Purchase, Investment
   - **Target Amount*** (currency): e.g., $50,000
   - **Target Date** (date picker, optional): When you want to achieve this
   - **Priority** (dropdown): High, Medium, Low
   
   **Details:**
   - **Current Amount** (currency): If starting with existing funds
   - **Linked Account** (dropdown, optional): Dedicated account for this goal
   - **Description** (text area, optional): Why this goal matters
   
   **Contribution Plan:**
   - **Planned Contribution** (currency): How much per period
   - **Contribution Frequency** (dropdown): Weekly, Bi-weekly, Monthly
   - System calculates: "At this rate, you'll reach your goal by [date]"
   
5. User fills in required fields
6. User clicks **"Save Goal"**
7. System creates goal and shows:
   - Success message
   - Projected timeline
   - Recommended monthly contribution
   - Impact on overall financial plan
8. Goal appears on Goals dashboard with progress tracking

**Alternative Flows:**
- **Link Transactions**: Automatically link matching transactions to goal
- **Set Milestones**: Add intermediate milestones (25%, 50%, 75%)
- **Recurring Contribution Setup**: Automatically contribute from recurring income

---

### **5a. Using "What-If?" Scenarios for Goals**

**User Goal:** Explore how changing savings rates affects goal timeline

**Journey Steps:**
1. User is viewing a specific goal (e.g., "House Down Payment - $50,000")
2. Current status shows:
   - Current: $10,000
   - Monthly contribution: $500
   - Projected completion: June 2028
3. User sees **"What-if?" Scenarios** widget on the goal page
4. Widget shows interactive slider: "What if I save [___] per month?"
5. User drags slider from $500 to $750
6. **Real-time updates appear:**
   - Projected completion date updates to: February 2027
   - Visual timeline adjusts
   - Message: "Save $250 more per month to reach your goal 16 months earlier"
   - Chart shows comparison: current pace (blue line) vs. adjusted pace (green line)
7. User can see impact on other goals:
   - Toggle "Show impact on other goals"
   - Other active goals show adjusted projections if funds are reallocated
8. User can:
   - **"Apply This Change"** - Updates goal's contribution amount
   - **"Compare Scenarios"** - Saves current view and tests another amount
   - **"Reset"** - Returns to original values
9. User compares multiple scenarios side-by-side:
   - Scenario A: $500/month → June 2028
   - Scenario B: $750/month → February 2027
   - Scenario C: $600/month → December 2027
10. User clicks **"Apply"** on Scenario B
11. Goal contribution updated, projected date adjusted

**Features:**
- Slider increments match sensible amounts ($25, $50, $100)
- Visual feedback with color-coded indicators
- One-time vs. ongoing adjustment toggle
- Export scenario comparison as image/PDF

---

### **6. Adding an Asset**

**User Goal:** Track valuable possessions or investments

**Journey Steps:**
1. User navigates to **Net Worth** or **Assets** screen
2. Screen shows overview of assets and liabilities
3. User clicks **"+ Add Asset"** button
4. Asset type selection appears:
   - Real Estate
   - Investments (Stocks, Bonds, Funds)
   - Vehicle
   - Business Interest
   - Personal Property
   - Cryptocurrency
   - Other
5. User selects asset type (e.g., "Real Estate")
6. Form appears with fields:
   - **Asset Name*** (text): e.g., "Primary Residence", "Investment Portfolio"
   - **Current Value*** (currency): Current market value
   - **Purchase Date** (date picker, optional)
   - **Purchase Price** (currency, optional): For cost basis
   - **Expected Annual Growth Rate** (percentage, optional): e.g., 5%
   - **Liquidity Type** (dropdown): Liquid, Semi-Liquid, Illiquid
   - **Type-Specific Fields**:
     - Real Estate: Address, Property Type, Mortgage Details
     - Investments: Ticker Symbol, Number of Shares, Dividend Yield
     - Vehicle: Make, Model, Year, VIN
   - **Notes** (text area, optional)
7. User fills in fields
8. User clicks **"Save"**
9. Asset is added and appears in Net Worth calculations
10. System shows updated net worth with this asset included

**Features:**
- **Automatic Valuation**: Option to link to APIs for market values
- **Value History**: Track value changes over time
- **Income Generation**: Link dividend/rental income to this asset

---

### **7. Adding a Liability/Debt**

**User Goal:** Track loans, mortgages, and other debts

**Journey Steps:**
1. User navigates to **Net Worth** or **Debts** screen
2. User clicks **"+ Add Debt"** button
3. Debt type selection:
   - Mortgage
   - Auto Loan
   - Student Loan
   - Credit Card
   - Personal Loan
   - Line of Credit
4. User selects type (e.g., "Student Loan")
5. Form appears:
   - **Loan Name*** (text): e.g., "Federal Student Loan"
   - **Current Balance*** (currency): Amount owed now
   - **Original Amount** (currency, optional): Initial loan amount
   - **Interest Rate*** (percentage): e.g., 4.5%
   - **Interest Type** (dropdown): Fixed, Variable
   - **Minimum Payment*** (currency): Required monthly payment
   - **Payment Frequency** (dropdown): Monthly, Bi-weekly, etc.
   - **Loan Start Date** (date picker, optional)
   - **Loan Term** (number, optional): In months
   - **Lender** (text, optional): Name of lending institution
6. User fills in fields
7. System calculates:
   - Projected payoff date
   - Total interest to be paid
   - Amortization schedule preview
8. User clicks **"Save"**
9. Debt appears in liabilities list
10. Net worth updates to reflect liability

**Features:**
- **Payoff Calculator**: See impact of extra payments
- **Payment Tracking**: Link payments to this debt
- **Debt Payoff Goal**: Auto-generate goal to eliminate debt

---

## **REPORTING & ANALYSIS**

### **8. Viewing Reports**

**User Goal:** Analyze financial data and trends

**Journey Steps:**
1. User navigates to **Reports** or **Dashboard** screen
2. Main dashboard shows key metrics:
   - Net Worth card
   - Monthly Income vs. Expenses card
   - Budget Progress card
   - Goal Progress card
3. User selects report type via:
   - **Tab Navigation**: Cash Flow | Spending | Income | Net Worth | Budget | Goals | Forecasts
   - OR **Report Dropdown**: Select from list of reports
4. Selected report loads with:
   - **Time Range Selector**: Last 30 days, 3 months, 6 months, 1 year, YTD, All time, Custom
   - **Filter Options**: Categories, Accounts, Tags
   - **View Options**: Chart type, grouping, comparison mode
5. User interacts with report:
   - **Hover** over chart elements → Tooltip shows detailed information
   - **Click** on category → Drill down to transaction list
   - **Drag** time slider → Adjust time range dynamically
   - **Toggle** legend items → Show/hide data series
6. User can:
   - **Export Report**: Download as PDF, CSV, or image
   - **Schedule Report**: Set up automated email delivery
   - **Share Report**: Generate shareable link (if collaboration enabled)
   - **Save View**: Save custom report configuration

**Specific Report Types:**

**8a. Cash Flow Report (Sankey Diagram)**
- Shows: Income sources → Expense categories → Savings/Investments
- Interactions:
  - Hover over flows → See exact amounts and percentages
  - Click node → Filter to show only that category
  - Adjust time period → See flow changes over time

**8b. Spending Analysis Report**
- Shows: Bar/pie charts of expenses by category
- Features:
  - Compare multiple time periods
  - Identify trends (increasing/decreasing)
  - See top spending categories
  - Average spending per category

**8c. Net Worth Report**
- Shows: Line chart of net worth over time
- Breakdown: Assets vs. Liabilities stacked area chart
- Includes:
  - Growth rate
  - Milestone markers
  - Projected trend line

**8d. Budget Performance Report**
- Shows: Budget vs. actual for each category
- Visual: Progress bars, variance charts
- Highlights: Categories over/under budget
- Alerts: Warning for categories approaching limit

---

### **9. Creating a Financial Forecast**

**User Goal:** Project future financial position

**Journey Steps:**
1. User navigates to **Forecasting** or **Planning** screen
2. User clicks **"Create New Forecast"** button
3. Forecast wizard begins:

   **Step 1: Forecast Basics**
   - **Forecast Name** (text): e.g., "5-Year Retirement Plan"
   - **Time Horizon** (dropdown): 1 year, 5 years, 10 years, 20 years, Custom
   - **Start Date** (date picker): Usually today
   - Click **"Next"**
   
   **Step 2: Inflation Settings**
   - **General Inflation Rate** (percentage): e.g., 2.5%
   - **Category-Specific Rates** (optional):
     - Healthcare: 6%
     - Education: 5%
     - Housing: 3%
   - Click **"Next"**
   
   **Step 3: Income Projections**
   - System shows current recurring income
   - User can adjust:
     - Expected salary increases
     - Bonus expectations
     - New income sources
     - Retirement income start date
   - Click **"Next"**
   
   **Step 4: Expense Projections**
   - System shows current recurring expenses
   - User can adjust:
     - Expected expense changes
     - New expected expenses
     - Expenses that will end
   - Click **"Next"**
   
   **Step 5: Life Events** (Optional)
   - Add major events that affect finances:
     - Home purchase (date, amount)
     - Car purchase
     - Children's college
     - Career change
     - Retirement date
   - Click **"Next"**
   
   **Step 6: Investment Assumptions**
   - **Expected Return Rate** (percentage): e.g., 7%
   - **Volatility/Risk Level** (low/medium/high)
   - **Contribution Strategy**: Regular contributions vs. lump sum
   - Click **"Next"**
   
   **Step 7: Review & Run**
   - Summary of all inputs
   - Click **"Generate Forecast"**

4. System processes and generates:
   - Projected net worth over time
   - Projected cash flow
   - Goal achievement timeline
   - Risk assessment
5. Results screen shows:
   - **Base Case Projection**: Line chart of expected net worth
   - **Key Metrics**: Total savings, investment growth, goal achievement dates
   - **Interactive Timeline**: Major milestones and events marked
6. User can:
   - Adjust assumptions and re-run
   - Save forecast for future reference
   - Compare multiple scenarios
   - Run Monte Carlo simulation (enhanced feature)

**Alternative Flows:**
- **Quick Forecast**: Use defaults for faster basic projection
- **Template Scenarios**: Pre-built scenarios (Early Retirement, College Savings, etc.)

---

### **10. Running Monte Carlo Simulation** (Enhanced Feature)

**User Goal:** Understand probability of financial success under uncertainty

**Journey Steps:**
1. User creates or opens a forecast (see Journey #9)
2. User clicks **"Run Monte Carlo Simulation"** button
3. Simulation configuration appears:
   - **Number of Iterations** (slider): 1,000 - 50,000 (default: 10,000)
   - **Market Volatility Model**:
     - Historical (use past market data)
     - Parametric (set standard deviation)
     - Custom distribution
   - **Variable Factors** (checkboxes):
     - ☑ Investment returns
     - ☑ Income variability
     - ☑ Expense variability
     - ☐ Inflation variability
     - ☑ Life event probabilities
   - **Risk Events** (optional):
     - Add catastrophic scenarios (job loss, market crash)
     - Set probability for each
4. User clicks **"Run Simulation"**
5. Progress indicator shows: "Running 10,000 simulations..."
6. Results screen displays:
   
   **Fan Chart:**
   - Median path (50th percentile) in bold
   - Confidence bands: 10th-90th percentile shaded area
   - Best case (90th percentile) and worst case (10th percentile) lines
   
   **Success Probability:**
   - "89% chance of reaching your retirement goal"
   - "95% chance of not running out of money by age 90"
   
   **Distribution Chart:**
   - Histogram showing distribution of final portfolio values
   - Marks current goal target
   
   **Sensitivity Analysis:**
   - Which variables had the most impact
   - "Investment returns account for 60% of variance"
   
   **Scenario Analysis:**
   - What percentage of runs met each goal
   - Worst-case scenario details
   
7. User can:
   - Download detailed results
   - Adjust parameters and re-run
   - Compare simulation results to deterministic forecast
   - Save simulation for future reference

---

## **ACCOUNT MANAGEMENT**

### **11. User Registration & Login**

**Registration Journey:**
1. User visits application homepage
2. Clicks **"Sign Up"** button
3. Registration form appears:
   - **Email*** (email input)
   - **Password*** (password input with strength indicator)
   - **Confirm Password*** (password input)
   - **Full Name** (text)
   - ☐ **I agree to Terms of Service and Privacy Policy**
4. User fills fields
5. Password strength indicator shows: Weak/Fair/Strong
6. User clicks **"Create Account"**
7. System sends verification email
8. Confirmation screen: "Check your email to verify your account"
9. User clicks link in email
10. Account verified, redirected to login

**Login Journey:**
1. User visits application
2. Enters email and password
3. Optional: Checks "Remember me"
4. Clicks **"Login"**
5. If 2FA enabled:
   - Enters 6-digit code from authenticator app
   - Clicks **"Verify"**
6. Redirects to Dashboard

---

### **12. Initial Setup Wizard** (First-Time User Experience)

**User Goal:** Get started quickly with essential setup

**Journey Steps:**
1. Upon first login, welcome screen appears:
   - "Welcome to Financial Planning! Let's set up your profile."
2. **Step 1: Profile Setup**
   - Select preferred currency
   - Select date format
   - Select theme (Light/Dark)
   - Click **"Next"**
3. **Step 2: Add Your First Account**
   - "Add at least one account to start tracking"
   - Simplified account form (name, type, balance)
   - Option to "Skip for now"
   - Click **"Next"**
4. **Step 3: Set Your First Budget** (Optional)
   - "Would you like to create a budget?"
   - Quick budget template (50/30/20 or Custom)
   - Option to "Skip for now"
   - Click **"Next"**
5. **Step 4: Set Your First Goal** (Optional)
   - "What financial goal are you working towards?"
   - Quick goal template (Emergency Fund, Debt Payoff, etc.)
   - Option to "Skip for now"
   - Click **"Next"**
6. **Step 5: Complete!**
   - "You're all set! Start adding transactions to see your financial picture."
   - Quick tips carousel
   - Click **"Go to Dashboard"**
7. Dashboard appears with helpful tooltips highlighting key features

---

## **DATA MANAGEMENT**

### **13. Importing Transactions** (Future Feature)

**Journey Steps:**
1. User navigates to **Transactions** screen
2. Clicks **"Import"** button
3. Upload dialog appears:
   - **File Format** (dropdown): CSV, OFX, QFX, QIF
   - **Drag & Drop** area or **Browse** button
4. User uploads file
5. Mapping screen appears:
   - Shows preview of data
   - Maps columns: Date → Date field, Amount → Amount field, etc.
   - Detects and suggests mappings
6. User reviews mappings
7. User clicks **"Import"**
8. Progress bar shows: "Importing 150 transactions..."
9. Import summary shows:
   - Successfully imported: 145
   - Duplicates skipped: 5
   - Review required: 0
10. User clicks **"Done"**
11. Transactions appear in list

---

### **14. Exporting Data**

**Journey Steps:**
1. User navigates to **Settings** → **Data & Privacy**
2. User clicks **"Export Data"** button
3. Export options dialog:
   - **Data to Export** (checkboxes):
     - ☑ Transactions
     - ☑ Accounts
     - ☑ Budgets
     - ☑ Goals
     - ☑ Assets & Liabilities
   - **Format** (dropdown): JSON, CSV, PDF Report
   - **Date Range** (date range picker): All time vs. Custom
4. User selects options
5. User clicks **"Generate Export"**
6. System prepares export file
7. Download link appears: "Your export is ready"
8. User clicks **"Download"**
9. File downloads to device

---

### **15. Setting Up Cross-Device Sync** (Enhanced Feature)

**Journey Steps:**
1. User navigates to **Settings** → **Sync & Devices**
2. Current device shows as: "Web Browser - Active"
3. User clicks **"Enable Sync"**
4. Sync setup wizard:
   - **Option 1: Cloud Sync** (if available)
     - "Your data will be encrypted and synced via our servers"
     - Estimated sync time shown
   - **Option 2: Self-Hosted Sync**
     - "Enter your sync server URL"
     - Input field for server address
     - Authentication setup
5. User selects option and clicks **"Enable"**
6. System initializes sync:
   - Encrypts local database
   - Uploads encrypted data
   - Progress indicator
7. Sync confirmation: "Sync enabled! Your data will stay up to date across all devices."
8. **Add Another Device:**
   - User opens app on second device
   - Logs in with same credentials
   - System detects account has sync enabled
   - Asks: "Download your data and enable sync on this device?"
   - User clicks **"Yes"**
   - Data downloads and syncs
9. Both devices now show in device list:
   - Web Browser (Desktop) - Last sync: Just now
   - Mobile Browser (iPhone) - Last sync: Just now

