import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  Building,
  Landmark,
  PiggyBank,
  Target,
  LogOut,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  bg:          '#0B0F1A',
  panel:       '#111827',
  panelBorder: 'rgba(0, 229, 255, 0.12)',
  cyan:        '#00E5FF',
  lime:        '#39FF14',
  amber:       '#FFB300',
  coral:       '#FF4757',
  purple:      '#A855F7',
  muted:       '#4B5563',
  text:        '#E5E7EB',
  textDim:     '#9CA3AF',
};

const FONT_HEAD = "'Rajdhani', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

// ── Nav ────────────────────────────────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard',    href: '/dashboard',    Icon: LayoutDashboard },
  { label: 'Accounts',     href: '/accounts',     Icon: CreditCard },
  { label: 'Transactions', href: '/transactions', Icon: ArrowRightLeft },
  { label: 'Assets',       href: '/assets',       Icon: Building },
  { label: 'Liabilities',  href: '/liabilities',  Icon: Landmark },
  { label: 'Budget',       href: '/budget',       Icon: PiggyBank },
  { label: 'Goals',        href: '/goals',        Icon: Target },
];

// ── Category bar colours cycling list ─────────────────────────────────────────
const CAT_COLORS = [C.amber, C.cyan, C.purple, C.coral, C.lime];

// ── Helpers ────────────────────────────────────────────────────────────────────
function compactNum(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}£${(abs / 1_000).toFixed(1)}K`;
  return `${sign}£${abs.toFixed(0)}`;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  current:               'CUR',
  savings:               'SAV',
  isa:                   'ISA',
  stocks_and_shares_isa: 'S&S',
  credit:                'CRD',
  investment:            'INV',
  loan:                  'LOAN',
  asset:                 'ASSET',
  liability:             'LIAB',
};

// ── Panel component ────────────────────────────────────────────────────────────
function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.panelBorder}`,
        borderRadius: 4,
        padding: 12,
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 0 20px rgba(0, 229, 255, 0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {children}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT_HEAD,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: C.cyan,
        marginBottom: 8,
        borderBottom: `1px solid ${C.panelBorder}`,
        paddingBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

// ── Custom tooltip for recharts ────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#0B0F1A',
        border: `1px solid ${C.panelBorder}`,
        borderRadius: 4,
        padding: '6px 10px',
        fontFamily: FONT_MONO,
        fontSize: 11,
        color: C.text,
      }}
    >
      <div style={{ color: C.textDim, marginBottom: 4, fontFamily: FONT_HEAD, fontWeight: 700 }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {compactNum(p.value)}
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Dashboard9Page() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // ── Load fonts ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = 'dashboard9-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-net-worth-trend'],
    queryFn: () => dashboardService.getNetWorthTrend(6),
  });

  const { data: ieData } = useQuery({
    queryKey: ['dashboard-income-expense-trend'],
    queryFn: () => dashboardService.getIncomeExpenseTrend(6),
  });

  // ── Derived data ─────────────────────────────────────────────────────────────
  const summary          = data?.summary;
  const accounts         = data?.accounts || [];
  const recentTx         = data?.recentTransactions || [];
  const topCategories    = data?.topCategories || [];

  const netWorth         = summary?.netWorth ?? 0;
  const totalAssets      = summary?.totalAssets ?? 0;
  const totalLiabilities = summary?.totalLiabilities ?? 0;
  const monthlyIncome    = summary?.monthlyIncome ?? 0;
  const monthlyExpense   = summary?.monthlyExpense ?? 0;
  const netFlow          = monthlyIncome - monthlyExpense;

  // Net worth trend chart data
  const nwChartData = trendData?.trend?.map((p) => ({
    month: p.month?.slice(0, 7) ?? '',
    nw: p.netWorth ?? ((p.cash ?? p.balance ?? 0) + (p.assets ?? 0) - (p.liabilities ?? 0)),
  })) ?? [];

  // Income/expense trend chart data
  const ieChartData = ieData?.trend?.map((p) => ({
    month: p.month?.slice(0, 7) ?? '',
    income:  p.income  ?? 0,
    expense: p.expense ?? 0,
  })) ?? [];

  // If no IE data but we have a single month from summary, show a placeholder bar
  const barData = ieChartData.length > 0
    ? ieChartData
    : summary
    ? [{ month: 'This month', income: monthlyIncome, expense: monthlyExpense }]
    : [];

  // Ticker text from recent transactions
  const tickerItems = recentTx.slice(0, 12).map((tx) => {
    const isIncome = tx.type === 'income';
    const arrow = isIncome ? '▲' : '▼';
    const sign  = isIncome ? '+' : '-';
    const desc  = (tx.description ?? tx.name ?? 'TXN').toUpperCase().replace(/\s+/g, '_');
    return `${arrow} ${desc} ${sign}${compactNum(Math.abs(tx.amount))}`;
  });
  const tickerText = tickerItems.length > 0 ? tickerItems.join('   ·   ') : '▲ NO_DATA  ▼ NO_DATA';

  // Category max for bar widths
  const catMax = topCategories.length > 0
    ? Math.max(...topCategories.map((c) => c.amount))
    : 1;

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: C.bg,
        color: C.text,
        fontFamily: FONT_MONO,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        ::-webkit-scrollbar { width: 4px; background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.muted}; border-radius: 2px; }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════════
          ZONE 1 — TICKER STRIP
      ════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          height: 48,
          minHeight: 48,
          background: '#0A0E18',
          borderLeft: `4px solid ${C.cyan}`,
          borderBottom: `1px solid ${C.panelBorder}`,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* LIVE badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '0 12px',
            flexShrink: 0,
            borderRight: `1px solid ${C.panelBorder}`,
            height: '100%',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: C.cyan,
              animation: 'pulse-dot 1.4s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: FONT_HEAD,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.16em',
              color: C.cyan,
            }}
          >
            LIVE
          </span>
        </div>

        {/* Scrolling ticker */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              whiteSpace: 'nowrap' as const,
              animation: 'ticker 25s linear infinite',
              gap: 0,
            }}
          >
            {/* Duplicate for seamless loop */}
            {[tickerText, tickerText].map((text, i) => (
              <span
                key={i}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: C.textDim,
                  padding: '0 32px',
                  letterSpacing: '0.04em',
                }}
                dangerouslySetInnerHTML={{ __html: text.replace(/▲/g, `<span style="color:${C.lime}">▲</span>`).replace(/▼/g, `<span style="color:${C.coral}">▼</span>`) }}
              />
            ))}
          </div>
        </div>

        {/* Net worth pinned right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 16px',
            flexShrink: 0,
            borderLeft: `1px solid ${C.panelBorder}`,
            height: '100%',
          }}
        >
          <span
            style={{
              fontFamily: FONT_HEAD,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.1em',
              color: C.textDim,
              textTransform: 'uppercase' as const,
            }}
          >
            NET WORTH
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 16,
              color: netWorth >= 0 ? C.cyan : C.coral,
            }}
          >
            {compactNum(netWorth)}
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: netFlow >= 0 ? C.lime : C.coral,
              background: netFlow >= 0 ? 'rgba(57,255,20,0.1)' : 'rgba(255,71,87,0.1)',
              padding: '2px 6px',
              borderRadius: 2,
            }}
          >
            {netFlow >= 0 ? '▲' : '▼'} {compactNum(Math.abs(netFlow))}/mo
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ZONE 2 — MAIN AREA
      ════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          gap: 0,
        }}
      >
        {/* ── LEFT SIDEBAR NAV (52px icon rail) ─────────────────────────────── */}
        <nav
          style={{
            width: 52,
            minWidth: 52,
            background: '#090D16',
            borderRight: `1px solid ${C.panelBorder}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 0',
            gap: 4,
            overflow: 'hidden',
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              background: `rgba(0,229,255,0.15)`,
              border: `1px solid ${C.cyan}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: FONT_HEAD,
                fontWeight: 700,
                fontSize: 13,
                color: C.cyan,
                letterSpacing: '-0.02em',
              }}
            >
              FP
            </span>
          </div>

          {navItems.map(({ href, Icon }) => {
            const isActive =
              location.pathname === href ||
              (href === '/dashboard' && location.pathname.startsWith('/dashboard'));
            return (
              <Link
                key={href}
                to={href}
                title={href.replace('/', '')}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? C.cyan : C.muted,
                  background: isActive ? 'rgba(0,229,255,0.1)' : 'transparent',
                  border: isActive ? `1px solid rgba(0,229,255,0.3)` : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = C.textDim;
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = C.muted;
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  }
                }}
              >
                <Icon size={15} />
              </Link>
            );
          })}

          {/* Logout at bottom */}
          <button
            onClick={logout}
            title="Sign out"
            style={{
              marginTop: 'auto',
              width: 36,
              height: 36,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.muted,
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = C.coral;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = C.muted;
            }}
          >
            <LogOut size={14} />
          </button>

          {/* User avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `rgba(168,85,247,0.2)`,
              border: `1px solid rgba(168,85,247,0.4)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_HEAD,
              fontWeight: 700,
              fontSize: 13,
              color: C.purple,
              marginTop: 4,
              flexShrink: 0,
            }}
          >
            {userInitial}
          </div>
        </nav>

        {/* ════════════════════════════════════════════════════════════════════
            LEFT DATA COLUMN (260px)
        ════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            width: 260,
            minWidth: 260,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 8,
            borderRight: `1px solid ${C.panelBorder}`,
            overflow: 'hidden',
          }}
        >
          {/* Panel 1 — Net Worth hero */}
          <Panel style={{ flexShrink: 0 }}>
            <div
              style={{
                fontFamily: FONT_HEAD,
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.14em',
                color: C.textDim,
                textTransform: 'uppercase' as const,
                marginBottom: 6,
              }}
            >
              {user?.name || user?.email || 'HOUSEHOLD'} · PORTFOLIO
            </div>

            <div
              style={{
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 28,
                color: netWorth >= 0 ? C.cyan : C.coral,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {summary ? compactNum(netWorth) : <span style={{ color: C.muted }}>——</span>}
            </div>
            <div
              style={{
                fontFamily: FONT_HEAD,
                fontSize: 10,
                letterSpacing: '0.1em',
                color: C.textDim,
                textTransform: 'uppercase' as const,
                marginBottom: 10,
              }}
            >
              NET WORTH
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'ASSETS', value: totalAssets,      color: C.lime  },
                { label: 'DEBTS',  value: totalLiabilities, color: C.coral },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${C.panelBorder}`,
                    borderRadius: 3,
                    padding: '6px 8px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_HEAD,
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      color: C.textDim,
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: 700,
                      fontSize: 13,
                      color,
                    }}
                  >
                    {summary ? compactNum(value) : '——'}
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly flow row */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 8,
              }}
            >
              {[
                { label: 'INCOME',  value: monthlyIncome,  color: C.lime  },
                { label: 'EXPENSE', value: monthlyExpense, color: C.coral },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${C.panelBorder}`,
                    borderRadius: 3,
                    padding: '6px 8px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_HEAD,
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      color: C.textDim,
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: 700,
                      fontSize: 13,
                      color,
                    }}
                  >
                    {summary ? compactNum(value) : '——'}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Panel 2 — Accounts */}
          <Panel
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <SectionHeader>ACCOUNTS ({accounts.length})</SectionHeader>
            <div
              style={{
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
              }}
            >
              {accounts.length === 0 ? (
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: C.muted,
                    padding: '8px 0',
                  }}
                >
                  No accounts found.
                </div>
              ) : (
                accounts.map((acc, idx) => {
                  const isDebt  = acc.balance < 0;
                  const balColor = isDebt ? C.coral : C.lime;
                  const badge   = ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type.toUpperCase().slice(0, 4);
                  return (
                    <div
                      key={acc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 4px',
                        borderBottom: idx < accounts.length - 1 ? `1px solid ${C.panelBorder}` : 'none',
                      }}
                    >
                      {/* type badge */}
                      <span
                        style={{
                          fontFamily: FONT_HEAD,
                          fontWeight: 700,
                          fontSize: 8,
                          letterSpacing: '0.08em',
                          color: C.textDim,
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${C.panelBorder}`,
                          borderRadius: 2,
                          padding: '1px 4px',
                          flexShrink: 0,
                          minWidth: 32,
                          textAlign: 'center' as const,
                        }}
                      >
                        {badge}
                      </span>
                      {/* name */}
                      <span
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 11,
                          color: C.text,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {acc.name}
                      </span>
                      {/* balance */}
                      <span
                        style={{
                          fontFamily: FONT_MONO,
                          fontWeight: 700,
                          fontSize: 11,
                          color: balColor,
                          flexShrink: 0,
                        }}
                      >
                        {formatCurrency(acc.balance, getCurrencySymbol(acc.currency))}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            CENTER COLUMN (flex: 1)
        ════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Top half — Income vs Expense bar chart */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 8,
              paddingBottom: 4,
              borderBottom: `1px solid ${C.panelBorder}`,
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <Panel
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <SectionHeader>INCOME / EXPENSES</SectionHeader>
                <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                  {[
                    { label: 'INCOME',  color: C.lime  },
                    { label: 'EXPENSE', color: C.coral },
                  ].map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 1,
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: FONT_HEAD,
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          color: C.textDim,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                      barCategoryGap="30%"
                      barGap={2}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke={C.panelBorder}
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontFamily: FONT_MONO, fontSize: 10, fill: C.textDim }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontFamily: FONT_MONO, fontSize: 10, fill: C.textDim }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => compactNum(v)}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,229,255,0.04)' }} />
                      <Bar dataKey="income"  name="Income"  fill={C.lime}  radius={[2, 2, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="expense" name="Expense" fill={C.coral} radius={[2, 2, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      color: C.muted,
                    }}
                  >
                    Loading trend data...
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Bottom half — Net Worth trend line chart */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 8,
              paddingTop: 4,
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <Panel
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              <SectionHeader>NET WORTH TREND</SectionHeader>
              <div style={{ flex: 1, minHeight: 0 }}>
                {nwChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={nwChartData}
                      margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke={C.panelBorder}
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontFamily: FONT_MONO, fontSize: 10, fill: C.textDim }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontFamily: FONT_MONO, fontSize: 10, fill: C.textDim }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => compactNum(v)}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: C.cyan, strokeWidth: 1, strokeDasharray: '4 2' }} />
                      <Line
                        type="monotone"
                        dataKey="nw"
                        name="Net Worth"
                        stroke={C.cyan}
                        strokeWidth={2}
                        dot={{ fill: C.cyan, r: 3, strokeWidth: 0 }}
                        activeDot={{ fill: C.cyan, r: 5, strokeWidth: 0 }}
                        style={{ filter: 'drop-shadow(0 0 6px #00E5FF)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      color: C.muted,
                    }}
                  >
                    Loading net worth data...
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT COLUMN (240px)
        ════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            width: 240,
            minWidth: 240,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 8,
            borderLeft: `1px solid ${C.panelBorder}`,
            overflow: 'hidden',
          }}
        >
          {/* Panel 1 — Spending categories */}
          <Panel
            style={{
              flexShrink: 0,
            }}
          >
            <SectionHeader>SPENDING</SectionHeader>
            {topCategories.length === 0 ? (
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: C.muted,
                  padding: '4px 0',
                }}
              >
                No category data.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topCategories.slice(0, 6).map((cat, idx) => {
                  const color   = CAT_COLORS[idx % CAT_COLORS.length];
                  const pct     = catMax > 0 ? (cat.amount / catMax) * 100 : 0;
                  const catName = cat.category?.name ?? 'Other';
                  return (
                    <div key={idx}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONT_HEAD,
                            fontWeight: 600,
                            fontSize: 11,
                            color: C.textDim,
                            letterSpacing: '0.05em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                            maxWidth: 120,
                          }}
                        >
                          {catName.toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            color,
                            flexShrink: 0,
                          }}
                        >
                          {compactNum(cat.amount)}
                        </span>
                      </div>
                      {/* Bar track */}
                      <div
                        style={{
                          height: 4,
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: color,
                            borderRadius: 2,
                            boxShadow: `0 0 6px ${color}88`,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Panel 2 — Recent transactions */}
          <Panel
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <SectionHeader>RECENT</SectionHeader>
            <div
              style={{
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
              }}
            >
              {recentTx.length === 0 ? (
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: C.muted,
                    padding: '4px 0',
                  }}
                >
                  No transactions.
                </div>
              ) : (
                recentTx.slice(0, 8).map((tx, idx) => {
                  const isIncome = tx.type === 'income';
                  const dotColor = isIncome ? C.lime : C.coral;
                  const amtColor = isIncome ? C.lime : C.coral;
                  const prefix   = isIncome ? '+' : '-';
                  const desc     = (tx.description ?? tx.name ?? 'Transaction').slice(0, 20);
                  return (
                    <div
                      key={tx.id ?? idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '4px 2px',
                        borderBottom: idx < Math.min(recentTx.length, 8) - 1
                          ? `1px solid ${C.panelBorder}`
                          : 'none',
                      }}
                    >
                      {/* Colored dot */}
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: dotColor,
                          boxShadow: `0 0 4px ${dotColor}`,
                          flexShrink: 0,
                        }}
                      />
                      {/* Description */}
                      <span
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 10,
                          color: C.textDim,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {desc}
                      </span>
                      {/* Amount */}
                      <span
                        style={{
                          fontFamily: FONT_MONO,
                          fontWeight: 700,
                          fontSize: 10,
                          color: amtColor,
                          flexShrink: 0,
                        }}
                      >
                        {prefix}{compactNum(Math.abs(tx.amount))}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>

          {/* Panel 3 — Quick stats strip */}
          <Panel style={{ flexShrink: 0 }}>
            <SectionHeader>FLOW METRICS</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                {
                  label: 'SAVINGS RATE',
                  value: summary?.savingsRate ?? '—',
                  unit: typeof summary?.savingsRate === 'string' ? '%' : '',
                  color: C.lime,
                },
                {
                  label: 'NET CASH FLOW',
                  value: summary ? compactNum(netFlow) : '——',
                  unit: '/mo',
                  color: netFlow >= 0 ? C.lime : C.coral,
                },
                {
                  label: 'TX THIS MONTH',
                  value: data?.transactionCounts?.total ?? '—',
                  unit: ' txns',
                  color: C.amber,
                },
              ].map(({ label, value, unit, color }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_HEAD,
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      color: C.textDim,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: 700,
                      fontSize: 12,
                      color,
                    }}
                  >
                    {value}{unit}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
