import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  Building,
  Landmark,
  PiggyBank,
  Target,
  LogOut,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';

// ── Colour tokens (DesignPage dark navy system) ──────────────────────────────
const C = {
  sidebarBg: '#191D32',
  mainBg:    '#1C2038',
  card:      '#22263D',
  border:    '#2F3452',
  fg:        '#F2F3F7',
  mutedFg:   '#9DA1B8',
  primary:   '#FF7A18', // orange — CTAs, active nav, net worth hero
  success:   '#07BEB8', // teal  — income
  accent:    '#B38BA3', // purple — savings
  warning:   '#8F3985', // magenta — liabilities, credit
  destroy:   '#E5484D', // red — loans
};

const FONT_SERIF = "'Crimson Pro', Georgia, serif";
const FONT_BODY  = "'Inter', system-ui, sans-serif";
const FONT_MONO  = "'JetBrains Mono', 'Courier New', monospace";

// ── Sidebar nav items (Dashboard1 structure, DesignPage colours) ─────────────
const navItems = [
  { label: 'Dashboard',    href: '/dashboard',    Icon: LayoutDashboard },
  { label: 'Accounts',     href: '/accounts',     Icon: CreditCard },
  { label: 'Transactions', href: '/transactions', Icon: ArrowRightLeft },
  { label: 'Assets',       href: '/assets',       Icon: Building },
  { label: 'Liabilities',  href: '/liabilities',  Icon: Landmark },
  { label: 'Budget',       href: '/budget',       Icon: PiggyBank },
  { label: 'Goals',        href: '/goals',        Icon: Target },
];

// Account type colours remapped to DesignPage semantic tokens
const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  current:               '#3B82F6',
  savings:               C.success,
  isa:                   C.accent,
  stocks_and_shares_isa: C.primary,
  credit:                C.warning,
  investment:            C.success,
  loan:                  C.destroy,
  asset:                 C.success,
  liability:             C.warning,
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  current:               'Current',
  savings:               'Savings',
  isa:                   'ISA',
  stocks_and_shares_isa: 'S&S ISA',
  credit:                'Credit',
  investment:            'Investment',
  loan:                  'Loan',
  asset:                 'Asset',
  liability:             'Liability',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard7Page() {
  const location  = useLocation();
  const { user, logout, authStatus } = useAuthStore();

  // Load fonts once
  useEffect(() => {
    const id = 'dashboard7-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id   = id;
      link.rel  = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700' +
        '&family=Inter:wght@400;500;600' +
        '&family=JetBrains+Mono:wght@400;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────
  // enabled: authStatus === 'authenticated' is CRITICAL here.
  // App.tsx renders Dashboard7Page before auth resolves (same pattern as /design).
  // Without this guard, useQuery fires immediately with no access token → 401 →
  // api.ts handleTokenRefresh() runs in parallel with initializeAuth(), causing a
  // refresh-token race that ends with window.location.href = '/login' → redirect
  // to /dashboard once auth re-resolves.  With this guard, only initializeAuth()
  // touches the refresh endpoint; once authStatus becomes 'authenticated' the
  // queries fire cleanly with a valid token already in the store.
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardService.getSummary(),
    enabled:  authStatus === 'authenticated',
  });

  const { data: incomeExpenseTrendResponse } = useQuery({
    queryKey: ['dashboard-income-expense-trend', 6],
    queryFn:  () => dashboardService.getIncomeExpenseTrend(6),
    enabled:  authStatus === 'authenticated',
  });

  // ── Derived values ───────────────────────────────────────────────────────
  const summary            = data?.summary;
  const accounts           = data?.accounts           ?? [];
  const recentTransactions = data?.recentTransactions ?? [];
  const topCategories      = data?.topCategories      ?? [];

  const totalCash        = summary?.totalCash ?? summary?.totalBalance ?? 0;
  const totalAssets      = summary?.totalAssets      ?? 0;
  const totalLiabilities = summary?.totalLiabilities ?? 0;
  const netWorth         = totalCash + totalAssets - totalLiabilities;
  const monthlyIncome    = summary?.monthlyIncome  ?? 0;
  const monthlyExpense   = summary?.monthlyExpense ?? 0;
  const savingsRate      = summary?.savingsRate ??
    (monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)
      : 0);

  const categoryChartData = topCategories.map((item) => ({
    name:  item.category?.name  ?? 'Unknown',
    value: item.amount,
    color: item.category?.color ?? '#888',
  }));

  const incomeExpenseData =
    incomeExpenseTrendResponse?.trend?.map((p) => ({
      date:    `${p.month}-01`,
      income:  p.income  ?? 0,
      expense: p.expense ?? 0,
    })) ?? [{ date: new Date().toISOString(), income: monthlyIncome, expense: monthlyExpense }];

  const firstName   = user?.name?.split(' ')[0] ?? 'there';
  const userInitial = (user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position:        'fixed',
        top:             '64px',
        left:            0,
        right:           0,
        bottom:          0,
        zIndex:          10,
        display:         'flex',
        overflow:        'hidden',
        fontFamily:      FONT_BODY,
        backgroundColor: C.mainBg,
        color:           C.fg,
      }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        style={{
          width:           220,
          minWidth:        220,
          backgroundColor: C.sidebarBg,
          borderRight:     `1px solid ${C.border}`,
          display:         'flex',
          flexDirection:   'column',
          padding:         '32px 0',
          position:        'sticky',
          top:             0,
          height:          '100%',
          overflowY:       'auto',
          overflowX:       'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 24px 28px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width:           34,
                height:          34,
                borderRadius:    '50%',
                backgroundColor: C.primary,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                color:           '#fff',
                fontFamily:      FONT_SERIF,
                fontWeight:      700,
                fontSize:        13,
                flexShrink:      0,
              }}
            >
              FP
            </div>
            <span
              style={{
                fontFamily:    FONT_SERIF,
                fontSize:      19,
                fontWeight:    700,
                color:         C.fg,
                letterSpacing: '-0.02em',
              }}
            >
              FinPlan
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex:          1,
            padding:       '20px 12px 0',
            display:       'flex',
            flexDirection: 'column',
            gap:           2,
          }}
        >
          {navItems.map(({ label, href, Icon }) => {
            const isActive =
              location.pathname === href ||
              (href === '/dashboard' && location.pathname === '/dashboard7');
            return (
              <Link
                key={href}
                to={href}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  gap:             10,
                  padding:         '10px 12px',
                  borderRadius:    8,
                  textDecoration:  'none',
                  fontSize:        13,
                  fontWeight:      isActive ? 600 : 400,
                  color:           isActive ? C.primary : C.mutedFg,
                  backgroundColor: isActive ? 'rgba(255,122,24,0.1)' : 'transparent',
                  borderLeft:      isActive ? `3px solid ${C.primary}` : '3px solid transparent',
                  transition:      'color 0.15s ease, background-color 0.15s ease',
                }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{ padding: '20px 24px', borderTop: `1px solid ${C.border}`, marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width:           30,
                height:          30,
                borderRadius:    '50%',
                backgroundColor: 'rgba(255,122,24,0.15)',
                border:          '1px solid rgba(255,122,24,0.3)',
                color:           C.primary,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                fontWeight:      700,
                fontSize:        12,
                flexShrink:      0,
              }}
            >
              {userInitial}
            </div>
            <div
              style={{
                fontFamily:   FONT_BODY,
                fontSize:     13,
                fontWeight:   500,
                color:        C.fg,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}
            >
              {user?.name ?? user?.email ?? 'User'}
            </div>
          </div>
          <button
            onClick={() => void logout()}
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             8,
              padding:         '7px 10px',
              borderRadius:    8,
              border:          'none',
              backgroundColor: 'transparent',
              color:           C.mutedFg,
              fontSize:        12,
              cursor:          'pointer',
              width:           '100%',
              fontFamily:      FONT_BODY,
              transition:      'color 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.fg; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.mutedFg; }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '36px 40px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Greeting */}
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontFamily: FONT_BODY,
                fontWeight: 600,
                fontSize:   22,
                color:      C.fg,
                margin:     0,
                lineHeight: 1.3,
              }}
            >
              {getGreeting()}, {firstName}
            </h1>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.mutedFg, margin: '4px 0 0' }}>
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
          </div>

          {/* Net Worth Card */}
          {isLoading ? (
            <div
              style={{
                height:          148,
                borderRadius:    16,
                backgroundColor: C.card,
                marginBottom:    20,
                opacity:         0.4,
              }}
            />
          ) : (
            <div
              style={{
                background:     'linear-gradient(135deg, #191D32 0%, #22263D 60%, #252A42 100%)',
                borderRadius:   16,
                padding:        '32px 36px',
                marginBottom:   20,
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                position:       'relative',
                overflow:       'hidden',
                border:         '1px solid rgba(255,122,24,0.22)',
                boxShadow:      '0 0 40px rgba(255,122,24,0.07), 0 8px 32px rgba(0,0,0,0.35)',
                flexWrap:       'wrap',
                gap:            24,
              }}
            >
              {/* Dot texture */}
              <div
                style={{
                  position:        'absolute',
                  inset:           0,
                  backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,122,24,0.07) 1px, transparent 1px)',
                  backgroundSize:  '28px 28px',
                  pointerEvents:   'none',
                }}
              />

              {/* Left — net worth */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    fontFamily:    FONT_BODY,
                    fontSize:      10,
                    fontWeight:    600,
                    color:         C.mutedFg,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom:  10,
                  }}
                >
                  Net Worth
                </div>
                <div
                  style={{
                    fontFamily:    FONT_SERIF,
                    fontSize:      60,
                    fontWeight:    700,
                    color:         C.primary,
                    lineHeight:    1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {formatCurrency(netWorth)}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(157,161,184,0.65)', marginTop: 10 }}>
                  Cash + Assets &ndash; Liabilities
                </div>
              </div>

              {/* Right — mini stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
                {([
                  { label: 'Cash',        value: totalCash,        color: C.success  },
                  { label: 'Assets',      value: totalAssets,      color: C.fg       },
                  { label: 'Liabilities', value: totalLiabilities, color: C.warning  },
                ] as const).map(({ label, value, color }) => (
                  <div key={label}>
                    <div
                      style={{
                        fontFamily:    FONT_BODY,
                        fontSize:      10,
                        color:         C.mutedFg,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom:  2,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 600, color }}>
                      {formatCurrency(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Three stat cards */}
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 14,
              marginBottom:        20,
            }}
          >
            {[
              {
                label: 'Income',
                value: formatCurrency(monthlyIncome),
                color: C.success,
                bg:    'rgba(7,190,184,0.07)',
                bdr:   'rgba(7,190,184,0.2)',
                Icon:  TrendingUp,
              },
              {
                label: 'Expenses',
                value: formatCurrency(monthlyExpense),
                color: C.primary,
                bg:    'rgba(255,122,24,0.07)',
                bdr:   'rgba(255,122,24,0.2)',
                Icon:  TrendingDown,
              },
              {
                label: 'Savings Rate',
                value: `${savingsRate}%`,
                color: C.accent,
                bg:    'rgba(179,139,163,0.07)',
                bdr:   'rgba(179,139,163,0.2)',
                Icon:  PiggyBank,
              },
            ].map(({ label, value, color, bg, bdr, Icon: StatIcon }) => (
              <div
                key={label}
                style={{ backgroundColor: bg, border: `1px solid ${bdr}`, borderRadius: 12, padding: 20 }}
              >
                <div
                  style={{
                    width:           34,
                    height:          34,
                    borderRadius:    10,
                    backgroundColor: bg,
                    border:          `1px solid ${bdr}`,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    marginBottom:    12,
                  }}
                >
                  <StatIcon size={16} color={color} />
                </div>
                <div
                  style={{
                    fontFamily:    FONT_BODY,
                    fontSize:      10,
                    fontWeight:    600,
                    color,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom:  6,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 30, fontWeight: 700, color, lineHeight: 1.1 }}>
                  {value}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.mutedFg, marginTop: 5 }}>
                  This month
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: '60% 1fr',
              gap:                 14,
              marginBottom:        20,
            }}
          >
            <div
              style={{
                backgroundColor: C.card,
                border:          '1px solid rgba(255,122,24,0.14)',
                borderRadius:    16,
                padding:         24,
              }}
            >
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.fg, marginBottom: 18 }}>
                Money In vs Out
              </div>
              <IncomeExpenseChart data={incomeExpenseData} />
            </div>
            <div
              style={{
                backgroundColor: C.card,
                border:          '1px solid rgba(255,122,24,0.14)',
                borderRadius:    16,
                padding:         24,
              }}
            >
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.fg, marginBottom: 18 }}>
                Spending Breakdown
              </div>
              <CategoryPieChart data={categoryChartData} />
            </div>
          </div>

          {/* Accounts */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: C.fg, marginBottom: 12 }}>
              Your Accounts
            </div>
            {accounts.length === 0 ? (
              <div
                style={{
                  backgroundColor: C.card,
                  border:          '1px solid rgba(255,122,24,0.14)',
                  borderRadius:    16,
                  padding:         24,
                  fontFamily:      FONT_BODY,
                  fontSize:        13,
                  color:           C.mutedFg,
                }}
              >
                No accounts yet. Head to Accounts to add your first one.
              </div>
            ) : (
              <div
                style={{
                  display:        'flex',
                  gap:            12,
                  overflowX:      'auto',
                  paddingBottom:  8,
                  scrollbarWidth: 'thin',
                }}
              >
                {accounts.map((account) => {
                  const accentColor = ACCOUNT_TYPE_COLORS[account.type] ?? C.accent;
                  const typeLabel   = ACCOUNT_TYPE_LABELS[account.type] ?? account.type.replace(/_/g, ' ');
                  return (
                    <div
                      key={account.id}
                      style={{
                        minWidth:     190,
                        backgroundColor: C.card,
                        borderRadius: 12,
                        padding:      '16px 18px',
                        borderTop:    '1px solid rgba(255,122,24,0.14)',
                        borderRight:  '1px solid rgba(255,122,24,0.14)',
                        borderBottom: '1px solid rgba(255,122,24,0.14)',
                        borderLeft:   `4px solid ${accentColor}`,
                        flexShrink:   0,
                        cursor:       'default',
                        transition:   'transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                    >
                      <div
                        style={{
                          fontFamily:   FONT_BODY,
                          fontSize:     13,
                          fontWeight:   700,
                          color:        C.fg,
                          marginBottom: 4,
                          overflow:     'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace:   'nowrap',
                        }}
                      >
                        {account.name}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <span
                          style={{
                            display:         'inline-block',
                            fontFamily:      FONT_BODY,
                            fontSize:        10,
                            fontWeight:      700,
                            letterSpacing:   '0.05em',
                            textTransform:   'capitalize',
                            color:           accentColor,
                            backgroundColor: `${accentColor}18`,
                            padding:         '2px 8px',
                            borderRadius:    20,
                          }}
                        >
                          {typeLabel}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: FONT_SERIF,
                          fontSize:   19,
                          fontWeight: 700,
                          color:      account.balance < 0 ? C.primary : C.fg,
                        }}
                      >
                        {formatCurrency(account.balance, getCurrencySymbol(account.currency))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: C.fg, marginBottom: 12 }}>
              Recent Transactions
            </div>
            <div
              style={{
                backgroundColor: C.card,
                border:          '1px solid rgba(255,122,24,0.14)',
                borderRadius:    16,
                overflow:        'hidden',
              }}
            >
              {recentTransactions.length === 0 ? (
                <div style={{ padding: 24, fontFamily: FONT_BODY, fontSize: 13, color: C.mutedFg }}>
                  No transactions yet.
                </div>
              ) : (
                recentTransactions.map((tx, idx) => {
                  const isIncome    = tx.type === 'income';
                  const dotColor    = isIncome ? C.success : C.primary;
                  const amountColor = isIncome ? C.success : C.primary;
                  const catColor    = tx.category?.color ?? C.mutedFg;
                  return (
                    <div
                      key={tx.id}
                      style={{
                        display:     'flex',
                        alignItems:  'center',
                        gap:         14,
                        padding:     '11px 16px',
                        borderBottom: idx < recentTransactions.length - 1
                          ? `1px solid ${C.border}`
                          : 'none',
                        transition:  'background-color 0.15s ease',
                        cursor:      'default',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,122,24,0.04)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                    >
                      <div
                        style={{
                          width:           8,
                          height:          8,
                          borderRadius:    '50%',
                          backgroundColor: dotColor,
                          flexShrink:      0,
                        }}
                      />
                      <div
                        style={{
                          flex:         1,
                          fontFamily:   FONT_BODY,
                          fontSize:     13,
                          fontWeight:   500,
                          color:        C.fg,
                          overflow:     'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace:   'nowrap',
                        }}
                      >
                        {tx.description}
                      </div>
                      {tx.category && (
                        <span
                          style={{
                            fontFamily:      FONT_BODY,
                            fontSize:        11,
                            fontWeight:      600,
                            color:           catColor,
                            backgroundColor: `${catColor}18`,
                            padding:         '3px 10px',
                            borderRadius:    20,
                            flexShrink:      0,
                            whiteSpace:      'nowrap',
                          }}
                        >
                          {tx.category.name}
                        </span>
                      )}
                      <div
                        style={{
                          fontFamily: FONT_BODY,
                          fontSize:   11,
                          color:      C.mutedFg,
                          flexShrink: 0,
                          minWidth:   40,
                          textAlign:  'right',
                        }}
                      >
                        {format(new Date(tx.date), 'd MMM')}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize:   13,
                          fontWeight: 600,
                          color:      amountColor,
                          flexShrink: 0,
                          minWidth:   80,
                          textAlign:  'right',
                        }}
                      >
                        {isIncome ? '+' : '\u2013'}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
