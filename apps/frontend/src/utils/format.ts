export const formatCurrency = (n: number): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatPct = (n: number): string => `${n.toFixed(2)}%`;
