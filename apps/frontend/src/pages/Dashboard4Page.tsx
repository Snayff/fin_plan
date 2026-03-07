import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { format } from 'date-fns';
import NetWorthChart from '../components/charts/NetWorthChart';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#0F1117',
  card:      '#161B27',
  border:    '#252D3F',
  amber:     '#FFB700',
  textPri:   '#EAEAEA',
  textSec:   '#7A8499',
  emerald:   '#34D399',
  rose:      '#F87171',
  deep:      '#1D2535',
} as const;

// ─── Fonts ───────────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Bebas Neue', sans-serif";
const FONT_BODY    = "'IBM Plex Sans', system-ui, sans-serif";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function d(value: number, loading: boolean, decimals = 0): string {
  if (loading) return '—';
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────
function Panel({
  children,
  style,
  title,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${C.amber}`,
      borderRadius: 0,
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '14px 20px 10px',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            color: C.textSec,
          }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Metric card (for key metrics column) ────────────────────────────────────
function MetricCard({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string;
  value: string;
  valueColor: string;
  sub?: string;
}) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${C.amber}`,
      borderRadius: 0,
      padding: '20px 24px',
      flex: 1,
    }}>
      <div style={{
        fontFamily: FONT_BODY,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: C.textSec,
        marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 40,
        color: valueColor,
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}>{value}</div>
      {sub && (
        <div style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
          color: C.textSec,
          marginTop: 4,
        }}>{sub}</div>
      )}
    </div>
  );
}

// ─── Ticker bar content ───────────────────────────────────────────────────────
function TickerContent({
  netWorth,
  totalAssets,
  totalLiabilities,
  monthlyIncome,
  monthlyExpense,
  savingsRate,
  loading,
}: {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  loading: boolean;
}) {
  const dot = <span style={{ margin: '0 14px', opacity: 0.5 }}>·</span>;
  const v = (n: number, dec = 0) => loading ? '—' : `£${d(n, false, dec)}`;
  const r = (n: number) => loading ? '—' : `${n}%`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      fontFamily: FONT_BODY,
      fontSize: 13,
      fontWeight: 500,
      color: C.bg,
      whiteSpace: 'nowrap',
    }}>
      <span>NET WORTH: {v(netWorth)}</span>
      {dot}
      <span>ASSETS: {v(totalAssets)}</span>
      {dot}
      <span>LIABILITIES: {v(totalLiabilities)}</span>
      {dot}
      <span>INCOME: {v(monthlyIncome)}</span>
      {dot}
      <span>EXPENSES: {v(monthlyExpense)}</span>
      {dot}
      <span>SAVINGS RATE: {r(savingsRate)}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Dashboard4Page() {
  // Load fonts
  useEffect(() => {
    const id = 'dashboard4-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Data
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const { data: netWorthTrendResponse } = useQuery({
    queryKey: ['dashboard-net-worth-trend', 6],
    queryFn: () => dashboardService.getNetWorthTrend(6),
  });

  const { data: incomeExpenseTrendResponse } = useQuery({
    queryKey: ['dashboard-income-expense-trend', 6],
    queryFn: () => dashboardService.getIncomeExpenseTrend(6),
  });

  const summary        = data?.summary;
  const accounts       = data?.accounts || [];
  const recentTx       = data?.recentTransactions || [];
  const topCategories  = data?.topCategories || [];

  const totalCash       = summary?.totalCash ?? summary?.totalBalance ?? 0;
  const totalAssets     = summary?.totalAssets || 0;
  const totalLiabilities = summary?.totalLiabilities || 0;
  const netWorth        = totalCash + totalAssets - totalLiabilities;
  const monthlyIncome   = summary?.monthlyIncome || 0;
  const monthlyExpense  = summary?.monthlyExpense || 0;
  const netCashFlow     = summary?.netCashFlow ?? (monthlyIncome - monthlyExpense);
  const savingsRate     = summary?.savingsRate
    ? Number(summary.savingsRate)
    : monthlyIncome > 0 ? Math.round((netCashFlow / monthlyIncome) * 100) : 0;

  const categoryChartData = topCategories.map((item) => ({
    name: item.category?.name || 'Unknown',
    value: item.amount,
    color: item.category?.color || '#888',
  }));

  const netWorthData = netWorthTrendResponse?.trend?.map((point) => ({
    date: `${point.month}-01`,
    netWorth: point.netWorth ?? (point.cash ?? point.balance ?? 0) + (point.assets || 0) - (point.liabilities || 0),
  })) || [{ date: new Date().toISOString(), netWorth: netWorth }];

  const incomeExpenseData = incomeExpenseTrendResponse?.trend?.map((point) => ({
    date: `${point.month}-01`,
    income: point.income || 0,
    expense: point.expense || 0,
  })) || [{ date: new Date().toISOString(), income: summary?.monthlyIncome || 0, expense: summary?.monthlyExpense || 0 }];

  const today = new Date();

  return (
    <div style={{
      position: 'fixed',
      top: 64,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      overflow: 'auto',
      background: C.bg,
    }}>

      {/* ── TICKER BAR ── */}
      <div style={{
        height: 40,
        background: C.amber,
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}>
        <TickerContent
          netWorth={netWorth}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
          savingsRate={savingsRate}
          loading={isLoading}
        />
      </div>

      {/* ── MAIN HEADER ── */}
      <div style={{
        background: C.bg,
        padding: '32px 48px 24px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.25em',
            textTransform: 'uppercase' as const,
            color: C.textSec,
            fontVariant: 'small-caps',
          }}>FinPlan</span>
          <span style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            color: C.textSec,
          }}>{format(today, 'EEEE, d MMMM yyyy')}</span>
        </div>

        {/* Big net worth display */}
        <div>
          <div style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: C.textSec,
            marginBottom: 4,
          }}>Net Worth</div>
          <div style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 96,
            color: C.textPri,
            lineHeight: 0.9,
            letterSpacing: '0.01em',
          }}>
            {isLoading ? '—' : `£${d(netWorth, false, 0)}`}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '0 48px 48px' }}>

        {/* Top section: chart 2/3 + metrics 1/3 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 12,
          marginTop: 12,
        }}>
          {/* Net Worth Chart */}
          <Panel title="6-Month Trend">
            <div style={{ padding: '12px 20px 20px' }}>
              <NetWorthChart data={netWorthData} />
            </div>
          </Panel>

          {/* Key Metrics stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MetricCard
              label="Monthly Income"
              value={isLoading ? '—' : `£${d(monthlyIncome, false, 0)}`}
              valueColor={C.emerald}
              sub="this period"
            />
            <MetricCard
              label="Monthly Expenses"
              value={isLoading ? '—' : `£${d(monthlyExpense, false, 0)}`}
              valueColor={C.rose}
              sub="this period"
            />
            <MetricCard
              label="Net Cash Flow"
              value={isLoading ? '—' : `${netCashFlow >= 0 ? '+' : ''}£${d(netCashFlow, false, 0)}`}
              valueColor={netCashFlow >= 0 ? C.emerald : C.rose}
              sub={`savings rate: ${isLoading ? '—' : `${savingsRate}%`}`}
            />
          </div>
        </div>

        {/* Middle section: income/expense + pie */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: 12,
          marginTop: 12,
        }}>
          <Panel title="Income vs Expenses · 6 Months">
            <div style={{ padding: '12px 20px 20px' }}>
              <IncomeExpenseChart data={incomeExpenseData} />
            </div>
          </Panel>

          <Panel title="Asset Allocation">
            <div style={{ padding: '12px 20px 20px' }}>
              <CategoryPieChart data={categoryChartData} />
            </div>
          </Panel>
        </div>

        {/* Accounts row */}
        {accounts.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Panel title="Accounts">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
                padding: '16px 20px 20px',
              }}>
                {accounts.map((acc) => (
                  <div key={acc.id} style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderLeft: `4px solid ${C.amber}`,
                    borderRadius: 0,
                    padding: '16px 18px',
                  }}>
                    <div style={{
                      fontFamily: FONT_BODY,
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.textPri,
                      marginBottom: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{acc.name}</div>
                    <div style={{
                      fontFamily: FONT_BODY,
                      fontSize: 11,
                      color: C.textSec,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 10,
                    }}>{acc.type}</div>
                    <div style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 26,
                      color: C.textPri,
                      lineHeight: 1,
                    }}>
                      {formatCurrency(acc.balance, getCurrencySymbol(acc.currency))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* Transactions table */}
        <div style={{ marginTop: 12 }}>
          <Panel title="Recent Transactions">
            {recentTx.length === 0 ? (
              <div style={{
                padding: '24px 20px',
                fontFamily: FONT_BODY,
                fontSize: 14,
                color: C.textSec,
              }}>No recent transactions.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Date', 'Description', 'Category', 'Type', 'Amount'].map((h) => (
                      <th key={h} style={{
                        padding: '10px 20px',
                        fontFamily: FONT_BODY,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase' as const,
                        color: C.textSec,
                        textAlign: h === 'Amount' ? 'right' : 'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr key={tx.id} style={{
                        borderBottom: `1px solid ${C.border}`,
                        transition: 'background 0.1s',
                        cursor: 'default',
                      }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = C.deep; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      >
                        <td style={{
                          padding: '12px 20px',
                          fontFamily: FONT_BODY,
                          fontSize: 13,
                          color: C.textSec,
                          whiteSpace: 'nowrap',
                        }}>
                          {format(new Date(tx.date), 'd MMM yyyy')}
                        </td>
                        <td style={{
                          padding: '12px 20px',
                          fontFamily: FONT_BODY,
                          fontSize: 14,
                          color: C.textPri,
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {tx.description}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          {tx.category ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              background: C.border,
                              color: C.amber,
                              fontFamily: FONT_BODY,
                              fontSize: 11,
                              fontWeight: 500,
                              letterSpacing: '0.06em',
                            }}>
                              {tx.category.name}
                            </span>
                          ) : (
                            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{
                            fontFamily: FONT_BODY,
                            fontSize: 12,
                            fontWeight: 500,
                            color: isIncome ? C.emerald : C.rose,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                          <span style={{
                            fontFamily: FONT_DISPLAY,
                            fontSize: 18,
                            color: isIncome ? C.emerald : C.rose,
                            letterSpacing: '0.03em',
                          }}>
                            {isIncome ? '+' : '-'}£{tx.amount.toLocaleString('en-GB', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

      </div>
    </div>
  );
}
