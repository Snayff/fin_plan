export function NetWorthBar() {
  const assets = 250000;
  const liabilities = 180000;
  const netWorth = assets - liabilities;
  const total = assets;

  return (
    <div className="rounded-lg border bg-card/50 p-4">
      <div className="flex gap-2 h-8 rounded overflow-hidden mb-3">
        <div
          className="bg-tier-surplus/40 flex items-center justify-center text-xs text-tier-surplus font-numeric"
          style={{ width: `${(netWorth / total) * 100}%` }}
        >
          Equity
        </div>
        <div
          className="bg-muted/60 flex items-center justify-center text-xs text-muted-foreground font-numeric"
          style={{ width: `${(liabilities / total) * 100}%` }}
        >
          Liabilities
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Assets</p>
          <p className="font-numeric text-sm font-semibold">£250,000</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Liabilities</p>
          <p className="font-numeric text-sm font-semibold">£180,000</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Net Worth</p>
          <p className="font-numeric text-sm font-semibold text-tier-surplus">
            £70,000
          </p>
        </div>
      </div>
    </div>
  );
}
