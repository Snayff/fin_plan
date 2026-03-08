import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { useDashboardPreviewAuth } from '../hooks/useDashboardPreviewAuth';
import { format } from 'date-fns';
import NetWorthChart from '../components/charts/NetWorthChart';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';

// ─── Color tokens ───────────────────────────────────────────────────────────
const C = {
  bg:          '#070809',
  panel:       '#0D0F12',
  border:      '#1A1F28',
  borderHover: '#2A3447',
  textPrimary: '#E8EDF5',
  textSec:     '#6B7A8D',
  textTert:    '#3D4A5C',
  mint:        '#00F5C3',
  red:         '#FF3D71',
  amber:       '#FFB800',
  grid:        '#111519',
} as const;

// ─── Fonts ───────────────────────────────────────────────────────────────────
const FONT_MONO = "'Space Mono', monospace";
const FONT_SYNE = "'Syne', system-ui, sans-serif";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(value: number, loading: boolean): string {
  if (loading) return '----';
  return value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(value: number, loading: boolean): string {
  if (loading) return '----';
  return value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface PanelProps {
  style?: React.CSSProperties;
  children: React.ReactNode;
  label?: string;
}

function Panel({ style, children, label }: PanelProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.panel,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 2,
        padding: 16,
        transition: 'border-color 0.15s ease',
        overflow: 'hidden',
        ...style,
      }}
    >
      {label && (
        <div style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: C.textTert,
          letterSpacing: '0.08em',
          marginBottom: 10,
          userSelect: 'none',
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontFamily: FONT_SYNE, fontSize: 10, color: C.textSec, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: color || C.textPrimary }}>{value}</span>
    </div>
  );
}

// ─── Blinking cursor ─────────────────────────────────────────────────────────
function Cursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 530);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 20,
      background: visible ? C.mint : 'transparent',
      verticalAlign: 'middle',
      marginLeft: 6,
      transition: 'background 0.1s',
    }} />
  );
}

// ─── Transaction log row ─────────────────────────────────────────────────────
function TxRow({ tx, index }: { tx: any; index: number }) {
  const isIncome = tx.type === 'income';
  const desc = tx.description || 'Unknown';
  const catName = tx.category?.name || '—';
  const dateStr = format(new Date(tx.date), 'dd MMM');
  const amountStr = `${isIncome ? '+' : '-'}£${tx.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Fixed widths via inline style
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '68px 1fr 120px 130px',
      alignItems: 'center',
      padding: '7px 12px',
      background: index % 2 === 0 ? C.panel : '#0F1215',
      gap: 8,
      borderBottom: `1px solid ${C.grid}`,
    }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textSec }}>{dateStr}</span>
      <span style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        color: C.textPrimary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{desc}</span>
      <span style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        color: C.textTert,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{catName}</span>
      <span style={{
        fontFamily: FONT_MONO,
        fontSize: 12,
        color: isIncome ? C.mint : C.red,
        textAlign: 'right',
        fontWeight: 700,
      }}>{amountStr}</span>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Dashboard3Page() {
  const { queriesEnabled } = useDashboardPreviewAuth();
  // Load fonts
  useEffect(() => {
    const id = 'dashboard3-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Data
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
    enabled: queriesEnabled,
  });

  const { data: netWorthTrendResponse } = useQuery({
    queryKey: ['dashboard-net-worth-trend', 6],
    queryFn: () => dashboardService.getNetWorthTrend(6),
    enabled: queriesEnabled,
  });

  const { data: incomeExpenseTrendResponse } = useQuery({
    queryKey: ['dashboard-income-expense-trend', 6],
    queryFn: () => dashboardService.getIncomeExpenseTrend(6),
    enabled: queriesEnabled,
  });

  const summary = data?.summary;
  const accounts = data?.accounts || [];
  const recentTransactions = data?.recentTransactions || [];
  const topCategories = data?.topCategories || [];

  const totalCash = summary?.totalCash ?? summary?.totalBalance ?? 0;
  const totalAssets = summary?.totalAssets || 0;
  const totalLiabilities = summary?.totalLiabilities || 0;
  const netWorth = totalCash + totalAssets - totalLiabilities;
  const monthlyIncome = summary?.monthlyIncome || 0;
  const monthlyExpense = summary?.monthlyExpense || 0;
  const netCashFlow = summary?.netCashFlow ?? (monthlyIncome - monthlyExpense);
  const savingsRate = summary?.savingsRate ? Number(summary.savingsRate) : (monthlyIncome > 0 ? Math.round((netCashFlow / monthlyIncome) * 100) : 0);

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

  // Savings rate bar fill (0-100 clamped)
  const savingsBarPct = Math.min(100, Math.max(0, savingsRate));
  const savingsBarFilled = Math.round(savingsBarPct / 10); // out of 10 blocks

  // Net worth chart last point
  const lastNetWorth = netWorthData.length > 0 ? (netWorthData[netWorthData.length - 1]?.netWorth ?? netWorth) : netWorth;

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
      backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        height: 52,
        background: C.panel,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 0,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        {/* Left: Logo */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: FONT_MONO,
            fontSize: 13,
            fontWeight: 700,
            color: C.mint,
            letterSpacing: '0.3em',
          }}>FINPLAN</span>
          <Cursor />
        </div>

        {/* Center: Net Worth */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontFamily: FONT_SYNE, fontSize: 10, color: C.textTert, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            NET WORTH:
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: '0.02em' }}>
            {isLoading ? '£ ----' : `£${netWorth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        {/* Right: Status indicators + time */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* Status dots */}
          {[
            { label: 'SYNC', color: '#00F5C3' },
            { label: 'AUTH', color: '#00F5C3' },
            { label: 'DATA', color: C.amber },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTert, letterSpacing: '0.12em' }}>{label}</span>
            </div>
          ))}
          {/* Time */}
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTert, marginLeft: 8 }}>
            {format(now, 'HH:mm:ss')}
          </span>
        </div>
      </div>

      {/* ── BENTO GRID ── */}
      <div style={{
        padding: 20,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gridAutoRows: 'minmax(80px, auto)',
        gap: 12,
      }}>

        {/* 1. NET WORTH TREND CHART — col 1-3, row 1-2 */}
        <Panel
          label="> NET_WORTH.trend"
          style={{ gridColumn: '1 / 4', gridRow: '1 / 3', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, minHeight: 220 }}>
            <NetWorthChart data={netWorthData} />
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: FONT_SYNE, fontSize: 10, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last value:</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.mint, fontWeight: 700 }}>
              {isLoading ? '----' : `£${lastNetWorth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </Panel>

        {/* 2. CURRENT POSITION — col 4, row 1-2 */}
        <Panel style={{ gridColumn: '4 / 5', gridRow: '1 / 3', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: FONT_SYNE, fontSize: 10, color: C.textTert, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            CURRENT POSITION
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 700, color: C.mint, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em' }}>
            {isLoading ? '----' : `£${netWorth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <MetricRow label="Cash" value={isLoading ? '----' : `£${fmt(totalCash, false)}`} color={C.mint} />
            <MetricRow label="Assets" value={isLoading ? '----' : `£${fmt(totalAssets, false)}`} color={C.textPrimary} />
            <MetricRow label="Liabilities" value={isLoading ? '----' : `£${fmt(totalLiabilities, false)}`} color={C.red} />
          </div>
        </Panel>

        {/* 3. INCOME — col 1, row 3 */}
        <Panel style={{ gridColumn: '1 / 2', gridRow: '3 / 4' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTert, letterSpacing: '0.12em', marginBottom: 8 }}>INC //</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: C.mint, lineHeight: 1 }}>
            {isLoading ? '----' : `£${fmtShort(monthlyIncome, false)}`}
          </div>
          <div style={{ fontFamily: FONT_SYNE, fontSize: 10, color: C.textTert, marginTop: 6, letterSpacing: '0.05em' }}>this period</div>
        </Panel>

        {/* 4. EXPENSE — col 2, row 3 */}
        <Panel style={{ gridColumn: '2 / 3', gridRow: '3 / 4' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTert, letterSpacing: '0.12em', marginBottom: 8 }}>EXP //</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: C.red, lineHeight: 1 }}>
            {isLoading ? '----' : `£${fmtShort(monthlyExpense, false)}`}
          </div>
          <div style={{ fontFamily: FONT_SYNE, fontSize: 10, color: C.textTert, marginTop: 6, letterSpacing: '0.05em' }}>this period</div>
        </Panel>

        {/* 5. NET CASH FLOW — col 3, row 3 */}
        <Panel style={{ gridColumn: '3 / 4', gridRow: '3 / 4' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTert, letterSpacing: '0.12em', marginBottom: 8 }}>CASH_FLOW</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: netCashFlow >= 0 ? C.mint : C.red, lineHeight: 1 }}>
            {isLoading ? '----' : `${netCashFlow >= 0 ? '+' : ''}£${fmtShort(netCashFlow, false)}`}
          </div>
          <div style={{ fontFamily: FONT_SYNE, fontSize: 10, color: C.textTert, marginTop: 6, letterSpacing: '0.05em' }}>
            rate: {isLoading ? '--' : `${savingsRate}%`}
          </div>
        </Panel>

        {/* 6. SAVINGS RATE BAR — col 4, row 3 */}
        <Panel style={{ gridColumn: '4 / 5', gridRow: '3 / 4' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTert, letterSpacing: '0.12em', marginBottom: 8 }}>SAVINGS_RATE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 1, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${savingsBarPct}%`,
                background: savingsBarPct > 0 ? C.mint : C.red,
                boxShadow: savingsBarPct > 0 ? `0 0 8px ${C.mint}60` : undefined,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: savingsBarPct > 0 ? C.mint : C.red, minWidth: 36 }}>
              {isLoading ? '--' : `${savingsRate}%`}
            </span>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTert, marginTop: 8, letterSpacing: '0.05em' }}>
            {Array.from({ length: 10 }, (_, i) => i < savingsBarFilled ? '█' : '░').join('')}
          </div>
        </Panel>

        {/* 7. INCOME/EXPENSE CHART — col 1-2, row 4-5 */}
        <Panel
          label="> INCOME_EXPENSE.6mo"
          style={{ gridColumn: '1 / 3', gridRow: '4 / 6', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, minHeight: 200 }}>
            <IncomeExpenseChart data={incomeExpenseData} />
          </div>
        </Panel>

        {/* 8. TOP CATEGORIES — col 3, row 4-5 */}
        <Panel
          label="> CATEGORIES.breakdown"
          style={{ gridColumn: '3 / 4', gridRow: '4 / 6', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, minHeight: 200 }}>
            <CategoryPieChart data={categoryChartData} />
          </div>
        </Panel>

        {/* Accounts panel — col 4, row 4-5 */}
        <Panel
          label="> ACCOUNTS.list"
          style={{ gridColumn: '4 / 5', gridRow: '4 / 6', display: 'flex', flexDirection: 'column', gap: 0 }}
        >
          {accounts.length === 0 ? (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTert, marginTop: 8 }}>no accounts</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {accounts.slice(0, 6).map((acc) => (
                <div key={acc.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '6px 0',
                  borderBottom: `1px solid ${C.grid}`,
                }}>
                  <div>
                    <div style={{ fontFamily: FONT_SYNE, fontSize: 11, color: C.textPrimary }}>{acc.name}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTert, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{acc.type}</div>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textSec }}>
                    {formatCurrency(acc.balance, getCurrencySymbol(acc.currency))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* 9. TRANSACTION LOG — full width, row 6+ */}
        <div style={{
          gridColumn: '1 / 5',
          gridRow: '6 / 7',
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 12px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTert, letterSpacing: '0.08em' }}>
              {'>'} TRANSACTIONS.recent
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTert }}>
              {recentTransactions.length} entries
            </span>
          </div>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '68px 1fr 120px 130px',
            padding: '5px 12px',
            borderBottom: `1px solid ${C.border}`,
            gap: 8,
          }}>
            {['DATE', 'DESCRIPTION', 'CATEGORY', 'AMOUNT'].map((h) => (
              <span key={h} style={{
                fontFamily: FONT_SYNE,
                fontSize: 9,
                color: C.textTert,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textAlign: h === 'AMOUNT' ? 'right' : 'left',
              }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {recentTransactions.length === 0 ? (
            <div style={{ padding: '16px 12px', fontFamily: FONT_MONO, fontSize: 11, color: C.textTert }}>
              no transactions found
            </div>
          ) : (
            recentTransactions.map((tx, i) => <TxRow key={tx.id} tx={tx} index={i} />)
          )}
        </div>

      </div>
    </div>
  );
}
