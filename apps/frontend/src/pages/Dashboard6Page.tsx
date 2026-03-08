import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  Building2,
  Landmark,
  PieChart,
  Target,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import NetWorthChart from '../components/charts/NetWorthChart';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { useDashboardPreviewAuth } from '../hooks/useDashboardPreviewAuth';
import { useAuthStore } from '../stores/authStore';

// ─── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  pageBg:        '#1A1612',
  sidebarBg:     '#151210',
  sidebarBorder: '1px solid #2D2720',
  cardBg:        '#221E1A',
  cardBorder:    '1px solid #2D2720',
  textPrimary:   '#F0E6D3',
  textSecondary: '#A09080',
  textTertiary:  '#5C5248',
  emerald:       '#10B981',
  emeraldDim:    '#064E3B',
  amber:         '#F59E0B',
  amberDim:      '#451A03',
  negative:      '#F87171',
  negativeDim:   '#3B1010',
};

const fontSerif = "'DM Serif Display', Georgia, serif";
const fontBody  = "'Outfit', system-ui, sans-serif";

// ─── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard6',    Icon: LayoutDashboard },
  { label: 'Accounts',     path: '/accounts',      Icon: CreditCard       },
  { label: 'Transactions', path: '/transactions',  Icon: ArrowRightLeft   },
  { label: 'Assets',       path: '/assets',        Icon: Building2        },
  { label: 'Liabilities',  path: '/liabilities',   Icon: Landmark         },
  { label: 'Budget',       path: '/budget',        Icon: PieChart         },
  { label: 'Goals',        path: '/goals',         Icon: Target           },
];

// ─── Shared card style ─────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background:   '#221E1A',
  border:       '1px solid #2D2720',
  borderRadius: 16,
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard6Page() {
  // Font loading
  useEffect(() => {
    const id = 'dashboard6-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id   = id;
      link.rel  = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Auth
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const { queriesEnabled } = useDashboardPreviewAuth();
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Data
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardService.getSummary(),
    enabled: queriesEnabled,
  });

  const { data: netWorthTrendResponse } = useQuery({
    queryKey: ['dashboard-net-worth-trend', 6],
    queryFn:  () => dashboardService.getNetWorthTrend(6),
    enabled: queriesEnabled,
  });

  const { data: incomeExpenseTrendResponse } = useQuery({
    queryKey: ['dashboard-income-expense-trend', 6],
    queryFn:  () => dashboardService.getIncomeExpenseTrend(6),
    enabled: queriesEnabled,
  });

  // Derived values
  const summary            = data?.summary;
  const accounts           = data?.accounts            || [];
  const recentTransactions = data?.recentTransactions  || [];
  const topCategories      = data?.topCategories       || [];
  const totalCash          = summary?.totalCash ?? summary?.totalBalance ?? 0;
  const totalAssets        = summary?.totalAssets      || 0;
  const totalLiabilities   = summary?.totalLiabilities || 0;
  const netWorth           = totalCash + totalAssets - totalLiabilities;
  const monthlyIncome      = summary?.monthlyIncome    || 0;
  const monthlyExpense     = summary?.monthlyExpense   || 0;
  const netCashFlow        = summary?.netCashFlow ?? (monthlyIncome - monthlyExpense);
  const savingsRate        = summary?.savingsRate      || 0;

  const categoryChartData = topCategories.map((item) => ({
    name:  item.category?.name  || 'Unknown',
    value: item.amount,
    color: item.category?.color || '#888',
  }));

  const netWorthData = netWorthTrendResponse?.trend?.map((point) => ({
    date:     `${point.month}-01`,
    netWorth: point.netWorth ?? (point.cash ?? point.balance ?? 0) + (point.assets || 0) - (point.liabilities || 0),
  })) || [{ date: new Date().toISOString(), netWorth }];

  const incomeExpenseData = incomeExpenseTrendResponse?.trend?.map((point) => ({
    date:    `${point.month}-01`,
    income:  point.income  || 0,
    expense: point.expense || 0,
  })) || [{ date: new Date().toISOString(), income: monthlyIncome, expense: monthlyExpense }];

  const isCurrentPath = (path: string) => window.location.pathname === path;

  return (
    <div
      style={{
        position:   'fixed',
        top:        '64px',
        left:       0,
        right:      0,
        bottom:     0,
        zIndex:     10,
        overflow:   'auto',
        background: C.pageBg,
        fontFamily: fontBody,
        color:      C.textPrimary,
      }}
    >
      <div className="flex" style={{ minHeight: '100%' }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          style={{
            width:        240,
            minWidth:     240,
            background:   'linear-gradient(180deg, #1C1815 0%, #151210 100%)',
            borderRight:  C.sidebarBorder,
            display:      'flex',
            flexDirection:'column',
            position:     'sticky',
            top:          0,
            height:       '100vh',
            overflowY:    'auto',
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding:      '28px 20px 24px',
              borderBottom: C.sidebarBorder,
              display:      'flex',
              alignItems:   'center',
              gap:          10,
            }}
          >
            <div
              style={{
                width:          28,
                height:         28,
                borderRadius:   '50%',
                background:     C.emerald,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       11,
                fontWeight:     700,
                color:          '#0A0A0A',
                flexShrink:     0,
                fontFamily:     fontBody,
              }}
            >
              FP
            </div>
            <span
              style={{
                fontFamily: fontSerif,
                fontSize:   20,
                color:      C.textPrimary,
                letterSpacing: '-0.01em',
              }}
            >
              FinPlan
            </span>
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 12px', flex: 1 }}>
            {NAV_ITEMS.map(({ label, path, Icon }) => {
              const active = isCurrentPath(path);
              return (
                <Link
                  key={path}
                  to={path}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            10,
                    padding:        '10px 16px',
                    borderRadius:   8,
                    marginBottom:   2,
                    fontSize:       14,
                    fontWeight:     active ? 500 : 400,
                    fontFamily:     fontBody,
                    color:          active ? C.textPrimary : C.textSecondary,
                    background:     active ? C.cardBg      : 'transparent',
                    borderLeft:     active ? `3px solid ${C.emerald}` : '3px solid transparent',
                    textDecoration: 'none',
                    transition:     'background 0.15s, color 0.15s',
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2 : 1.75} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div
            style={{
              borderTop: C.sidebarBorder,
              padding:   '16px 16px 20px',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width:          40,
                  height:         40,
                  borderRadius:   '50%',
                  background:     '#1A1612',
                  border:         `2px solid ${C.emerald}`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       13,
                  fontWeight:     600,
                  color:          C.textPrimary,
                  flexShrink:     0,
                  fontFamily:     fontBody,
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize:     14,
                    fontWeight:   500,
                    color:        C.textPrimary,
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                    fontFamily:   fontBody,
                  }}
                >
                  {user?.name || 'User'}
                </div>
                <button
                  onClick={() => void logout()}
                  style={{
                    background: 'none',
                    border:     'none',
                    padding:    0,
                    cursor:     'pointer',
                    fontSize:   13,
                    color:      C.textTertiary,
                    fontFamily: fontBody,
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main
          style={{
            flex:      1,
            overflowY: 'auto',
            padding:   '40px 48px',
            minWidth:  0,
          }}
        >
          {isLoading ? (
            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                height:         300,
                color:          C.textTertiary,
                fontSize:       14,
                fontFamily:     fontBody,
              }}
            >
              Loading…
            </div>
          ) : (
            <>
              {/* ── Hero card ──────────────────────────────────────────────── */}
              <div
                style={{
                  background:   'linear-gradient(135deg, #221E1A 0%, #1E2820 100%)',
                  border:       '1px solid #2D2720',
                  borderRadius: 16,
                  padding:      48,
                  marginBottom: 24,
                  position:     'relative',
                  overflow:     'hidden',
                }}
              >
                {/* Decorative emerald circle */}
                <div
                  style={{
                    position:     'absolute',
                    right:        -60,
                    top:          '50%',
                    transform:    'translateY(-50%)',
                    width:        300,
                    height:       300,
                    borderRadius: '50%',
                    background:   C.emerald,
                    opacity:      0.03,
                    pointerEvents:'none',
                  }}
                />

                <div className="flex gap-12">
                  {/* Left — Net Worth */}
                  <div style={{ flex: '0 0 55%' }}>
                    <div
                      style={{
                        fontSize:      13,
                        fontWeight:    500,
                        color:         C.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        marginBottom:  16,
                        fontFamily:    fontBody,
                      }}
                    >
                      Total Net Worth
                    </div>

                    <div
                      style={{
                        fontFamily:    fontSerif,
                        fontSize:      72,
                        color:         C.textPrimary,
                        lineHeight:    1,
                        marginBottom:  32,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {formatCurrency(netWorth)}
                    </div>

                    {/* Breakdown row */}
                    <div
                      style={{
                        display: 'flex',
                        gap:     32,
                      }}
                    >
                      {[
                        { label: 'Cash',        value: totalCash        },
                        { label: 'Assets',      value: totalAssets      },
                        { label: 'Liabilities', value: totalLiabilities },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div
                            style={{
                              fontSize:      11,
                              color:         C.textTertiary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              marginBottom:  4,
                              fontFamily:    fontBody,
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize:   15,
                              fontWeight: 500,
                              color:      C.textPrimary,
                              fontFamily: fontBody,
                            }}
                          >
                            {formatCurrency(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right — Stat pills */}
                  <div
                    style={{
                      flex:          '0 0 45%',
                      display:       'flex',
                      flexDirection: 'column',
                      gap:           12,
                      justifyContent:'center',
                      position:      'relative',
                      zIndex:        1,
                    }}
                  >
                    {/* Income pill */}
                    <div
                      style={{
                        background:   C.emeraldDim,
                        borderRadius: 100,
                        padding:      '12px 20px',
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize:   13,
                          color:      C.emerald,
                          fontFamily: fontBody,
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Income
                      </span>
                      <span
                        style={{
                          fontFamily: fontSerif,
                          fontSize:   24,
                          color:      C.emerald,
                        }}
                      >
                        {formatCurrency(monthlyIncome)}
                      </span>
                    </div>

                    {/* Expenses pill */}
                    <div
                      style={{
                        background:   C.negativeDim,
                        borderRadius: 100,
                        padding:      '12px 20px',
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize:   13,
                          color:      C.negative,
                          fontFamily: fontBody,
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Expenses
                      </span>
                      <span
                        style={{
                          fontFamily: fontSerif,
                          fontSize:   24,
                          color:      C.negative,
                        }}
                      >
                        {formatCurrency(monthlyExpense)}
                      </span>
                    </div>

                    {/* Savings pill */}
                    <div
                      style={{
                        background:   C.amberDim,
                        borderRadius: 100,
                        padding:      '12px 20px',
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize:   13,
                          color:      C.amber,
                          fontFamily: fontBody,
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Savings {savingsRate ? `${savingsRate}%` : ''}
                      </span>
                      <span
                        style={{
                          fontFamily: fontSerif,
                          fontSize:   24,
                          color:      C.amber,
                        }}
                      >
                        {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Net Worth Trend ─────────────────────────────────────────── */}
              <div style={{ ...cardStyle, padding: '32px 36px', marginBottom: 24 }}>
                <div style={{ marginBottom: 6 }}>
                  <h2
                    style={{
                      fontFamily: fontSerif,
                      fontSize:   22,
                      color:      C.textPrimary,
                      margin:     0,
                    }}
                  >
                    Wealth Over Time
                  </h2>
                </div>
                <div
                  style={{
                    fontSize:     13,
                    color:        C.textSecondary,
                    marginBottom: 24,
                    fontFamily:   fontBody,
                  }}
                >
                  6-month trajectory
                </div>
                <div style={{ height: 200 }}>
                  <NetWorthChart data={netWorthData} />
                </div>
              </div>

              {/* ── Two-column: Income vs Expenses + Spending ───────────────── */}
              <div className="flex gap-6" style={{ marginBottom: 24 }}>
                {/* Income vs Expenses */}
                <div style={{ ...cardStyle, flex: '0 0 55%', padding: '32px 36px' }}>
                  <h2
                    style={{
                      fontFamily:   fontSerif,
                      fontSize:     22,
                      color:        C.textPrimary,
                      margin:       0,
                      marginBottom: 24,
                    }}
                  >
                    Income vs Expenses
                  </h2>
                  <div style={{ height: 260 }}>
                    <IncomeExpenseChart data={incomeExpenseData} />
                  </div>
                </div>

                {/* Spending breakdown */}
                <div style={{ ...cardStyle, flex: '0 0 45%', padding: '32px 36px' }}>
                  <h2
                    style={{
                      fontFamily:   fontSerif,
                      fontSize:     22,
                      color:        C.textPrimary,
                      margin:       0,
                      marginBottom: 24,
                    }}
                  >
                    Spending
                  </h2>
                  <div style={{ height: 260 }}>
                    <CategoryPieChart data={categoryChartData} />
                  </div>
                </div>
              </div>

              {/* ── Accounts ───────────────────────────────────────────────── */}
              <div style={{ ...cardStyle, padding: '32px 36px', marginBottom: 24 }}>
                <h2
                  style={{
                    fontFamily:   fontSerif,
                    fontSize:     22,
                    color:        C.textPrimary,
                    margin:       0,
                    marginBottom: 24,
                  }}
                >
                  Accounts
                </h2>

                {accounts.length === 0 ? (
                  <p style={{ fontSize: 14, color: C.textTertiary, fontFamily: fontBody }}>
                    No accounts yet.
                  </p>
                ) : (
                  <div>
                    {accounts.slice(0, 6).map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between"
                        style={{
                          padding:      '14px 0',
                          borderBottom: '1px solid #2D2720',
                        }}
                      >
                        <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize:     15,
                                fontWeight:   400,
                                color:        C.textPrimary,
                                fontFamily:   fontBody,
                                overflow:     'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace:   'nowrap',
                              }}
                            >
                              {account.name}
                            </div>
                            <div
                              style={{
                                fontSize:   13,
                                color:      C.textSecondary,
                                fontFamily: fontBody,
                                marginTop:  2,
                              }}
                            >
                              {account.type.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Type badge */}
                          <div
                            style={{
                              background:    '#2D2720',
                              border:        '1px solid #3A3028',
                              borderRadius:  100,
                              padding:       '3px 10px',
                              fontSize:      11,
                              color:         C.textSecondary,
                              fontFamily:    fontBody,
                              textTransform: 'capitalize',
                              whiteSpace:    'nowrap',
                            }}
                          >
                            {account.type.replace(/_/g, ' ')}
                          </div>

                          {/* Balance */}
                          <div
                            style={{
                              fontSize:   15,
                              fontWeight: 500,
                              color:      account.balance >= 0 ? C.emerald : C.negative,
                              fontFamily: fontBody,
                              minWidth:   90,
                              textAlign:  'right',
                            }}
                          >
                            {formatCurrency(account.balance, getCurrencySymbol(account.currency))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Recent Transactions ─────────────────────────────────────── */}
              <div style={{ ...cardStyle, padding: '32px 36px' }}>
                <h2
                  style={{
                    fontFamily:   fontSerif,
                    fontSize:     22,
                    color:        C.textPrimary,
                    margin:       0,
                    marginBottom: 24,
                  }}
                >
                  Recent Transactions
                </h2>

                {recentTransactions.length === 0 ? (
                  <p style={{ fontSize: 14, color: C.textTertiary, fontFamily: fontBody }}>
                    No transactions yet.
                  </p>
                ) : (
                  <div>
                    {recentTransactions.slice(0, 10).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-4"
                        style={{
                          padding:      '12px 0',
                          borderBottom: '1px solid #2D2720',
                        }}
                      >
                        {/* Date */}
                        <div
                          style={{
                            fontSize:   12,
                            color:      C.textTertiary,
                            fontFamily: fontBody,
                            minWidth:   44,
                            flexShrink: 0,
                          }}
                        >
                          {format(new Date(tx.date), 'd MMM')}
                        </div>

                        {/* Description */}
                        <div
                          style={{
                            flex:         1,
                            fontSize:     15,
                            color:        C.textPrimary,
                            fontFamily:   fontBody,
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace:   'nowrap',
                          }}
                        >
                          {tx.description}
                        </div>

                        {/* Category badge */}
                        {tx.category && (
                          <div
                            style={{
                              background:  '#2D2720',
                              border:      '1px solid #3A3028',
                              borderRadius: 100,
                              padding:     '3px 10px',
                              fontSize:    11,
                              color:       C.textSecondary,
                              fontFamily:  fontBody,
                              whiteSpace:  'nowrap',
                              flexShrink:  0,
                            }}
                          >
                            {tx.category.name}
                          </div>
                        )}

                        {/* Amount */}
                        <div
                          style={{
                            fontSize:   15,
                            fontWeight: 600,
                            color:      tx.type === 'income' ? C.emerald : C.negative,
                            fontFamily: fontBody,
                            flexShrink: 0,
                            minWidth:   80,
                            textAlign:  'right',
                          }}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
