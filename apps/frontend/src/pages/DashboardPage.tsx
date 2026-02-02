export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your financial overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth Card */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
          <p className="text-2xl font-bold text-foreground mt-2">$0.00</p>
          <p className="text-xs text-green-600 mt-1">+0% from last month</p>
        </div>

        {/* Monthly Income Card */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Income</h3>
          <p className="text-2xl font-bold text-foreground mt-2">$0.00</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>

        {/* Monthly Expenses Card */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Expenses</h3>
          <p className="text-2xl font-bold text-foreground mt-2">$0.00</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>

        {/* Savings Rate Card */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-muted-foreground">Savings Rate</h3>
          <p className="text-2xl font-bold text-foreground mt-2">0%</p>
          <p className="text-xs text-muted-foreground mt-1">Of income</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-card p-12 rounded-lg border border-border text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Get Started</h2>
        <p className="text-muted-foreground mb-6">
          Add your first account to start tracking your finances
        </p>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          Add Account
        </button>
      </div>
    </div>
  );
}
