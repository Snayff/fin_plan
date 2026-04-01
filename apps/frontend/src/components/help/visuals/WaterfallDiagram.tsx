export function WaterfallDiagram() {
  const tiers = [
    {
      label: "Net Income",
      amount: "£5,000",
      color: "bg-tier-income/20 border-tier-income/40 text-tier-income",
    },
    {
      label: "Committed Spend",
      amount: "−£2,000",
      color:
        "bg-tier-committed/20 border-tier-committed/40 text-tier-committed",
    },
    {
      label: "Discretionary Spend",
      amount: "−£1,500",
      color:
        "bg-tier-discretionary/20 border-tier-discretionary/40 text-tier-discretionary",
    },
    {
      label: "Surplus",
      amount: "= £1,500",
      color: "bg-tier-surplus/20 border-tier-surplus/40 text-tier-surplus",
    },
  ];

  return (
    <div className="rounded-lg border bg-card/50 p-4 space-y-2">
      {tiers.map((tier, i) => (
        <div
          key={i}
          className={`rounded border px-4 py-2 flex justify-between items-center ${tier.color}`}
        >
          <span className="text-sm font-medium">{tier.label}</span>
          <span className="font-mono text-sm font-semibold">{tier.amount}</span>
        </div>
      ))}
    </div>
  );
}
