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
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { useAuthStore } from '../stores/authStore';

// ─── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  pageBg:         '#FAFAF8',
  sidebarBg:      '#F5F3EF',
  sidebarBorder:  '1px solid #E8E4DC',
  cardBg:         '#FFFFFF',
  cardBorder:     '1px solid #E8E4DC',
  textPrimary:    '#111111',
  textSecondary:  '#6B6866',
  textTertiary:   '#9E9B98',
  amber:          '#B45309',
  amberLight:     '#FEF3C7',
  positive:       '#047857',
  positiveBg:     '#ECFDF5',
  negative:       '#B91C1C',
  negativeBg:     '#FEF2F2',
  shadow:         '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
};

const fontPlayfair = "'Playfair Display', Georgia, serif";
const fontJakarta  = "'Plus Jakarta Sans', system-ui, sans-serif";

// ─── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard5',    Icon: LayoutDashboard },
  { label: 'Accounts',     path: '/accounts',      Icon: CreditCard       },
  { label: 'Transactions', path: '/transactions',  Icon: ArrowRightLeft   },
  { label: 'Assets',       path: '/assets',        Icon: Building2        },
  { label: 'Liabilities',  path: '/liabilities',   Icon: Landmark         },
  { label: 'Budget',       path: '/budget',        Icon: PieChart         },
  { label: 'Goals',        path: '/goals',         Icon: Target           },
];

// ─── Account type dot colors ───────────────────────────────────────────────────
function accountDotColor(type: string): string {
  const map: Record<string, string> = {
    current:              '#047857',
    savings:              '#0284C7',
    isa:                  '#7C3AED',
    stocks_and_shares_isa:'#6D28D9',
    credit:               '#B91C1C',
    investment:           '#D97706',
    loan:                 '#DC2626',
    asset:                '#065F46',
    liability:            '#991B1B',
  };
  return map[type] ?? '#9E9B98';
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard5Page() {
  // Font loading
  useEffect(() => {
    const id = 'dashboard5-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id   = id;
      link.rel  = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Auth
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Data
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardService.getSummary(),
  });

  const { data: incomeExpenseTrendResponse } = useQuery({
    queryKey: ['dashboard-income-expense-trend', 6],
    queryFn:  () => dashboardService.getIncomeExpenseTrend(6),
  });

  // Derived values
  const summary             = data?.summary;
  const accounts            = data?.accounts            || [];
  const recentTransactions  = data?.recentTransactions  || [];
  const topCategories       = data?.topCategories       || [];
  const totalCash           = summary?.totalCash ?? summary?.totalBalance ?? 0;
  const totalAssets         = summary?.totalAssets       || 0;
  const totalLiabilities    = summary?.totalLiabilities  || 0;
  const netWorth            = totalCash + totalAssets - totalLiabilities;
  const monthlyIncome       = summary?.monthlyIncome     || 0;
  const monthlyExpense      = summary?.monthlyExpense    || 0;
  const netCashFlow         = summary?.netCashFlow ?? (monthlyIncome - monthlyExpense);

  const categoryChartData = topCategories.map((item) => ({
    name:  item.category?.name  || 'Unknown',
    value: item.amount,
    color: item.category?.color || '#888',
  }));

  const incomeExpenseData = incomeExpenseTrendResponse?.trend?.map((point) => ({
    date:    `${point.month}-01`,
    income:  point.income  || 0,
    expense: point.expense || 0,
  })) || [{ date: new Date().toISOString(), income: monthlyIncome, expense: monthlyExpense }];

  const currentMonthLabel = format(new Date(), 'MMMM yyyy');
  const isCurrentPath = (path: string) => window.location.pathname === path;

  // ── Shared card style ────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background:   C.cardBg,
    border:       C.cardBorder,
    borderRadius: 24,
    boxShadow:    C.shadow,
  };

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
        fontFamily: fontJakarta,
      }}
    >
      <div className="flex h-full" style={{ minHeight: '100%' }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          style={{
            width:        240,
            minWidth:     240,
            background:   C.sidebarBg,
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
            }}
          >
            <span
              style={{
                fontFamily: fontPlayfair,
                fontSize:   20,
                fontWeight: 700,
                color:      C.textPrimary,
                letterSpacing: '-0.01em',
              }}
            >
              FinPlan
            </span>
            <span
              style={{
                display:         'inline-block',
                width:           6,
                height:          6,
                borderRadius:    '50%',
                background:      C.amber,
                marginLeft:      4,
                verticalAlign:   'middle',
                position:        'relative',
                top:             -2,
              }}
            />
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
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                    padding:      '10px 16px',
                    borderRadius: 8,
                    marginBottom: 2,
                    fontSize:     14,
                    fontWeight:   500,
                    fontFamily:   fontJakarta,
                    color:        active ? C.textPrimary : C.textSecondary,
                    background:   active ? C.cardBg      : 'transparent',
                    boxShadow:    active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    borderLeft:   active ? `3px solid ${C.amber}` : '3px solid transparent',
                    textDecoration: 'none',
                    transition:   'background 0.15s, color 0.15s',
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
                  background:     C.amberLight,
                  color:          C.amber,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       13,
                  fontWeight:     700,
                  flexShrink:     0,
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
                    fontFamily: fontJakarta,
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
            flex:       1,
            overflowY:  'auto',
            padding:    '48px 56px',
            minWidth:   0,
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
              }}
            >
              Loading…
            </div>
          ) : (
            <>
              {/* ── Header ─────────────────────────────────────────────────── */}
              <div style={{ marginBottom: 40 }}>
                <div
                  style={{
                    fontSize:      14,
                    color:         C.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom:  8,
                    fontWeight:    500,
                  }}
                >
                  Overview
                </div>
                <h1
                  style={{
                    fontFamily:    fontPlayfair,
                    fontSize:      32,
                    fontWeight:    600,
                    color:         C.textPrimary,
                    margin:        0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {currentMonthLabel}
                </h1>
              </div>

              {/* ── Hero card ──────────────────────────────────────────────── */}
              <div style={{ ...cardStyle, padding: 40, marginBottom: 24 }}>
                <div className="flex gap-8">
                  {/* Left — Net Worth */}
                  <div style={{ flex: '0 0 60%' }}>
                    <div
                      style={{
                        fontSize:      13,
                        fontWeight:    500,
                        color:         C.textTertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom:  16,
                      }}
                    >
                      Net Worth
                    </div>
                    <div
                      style={{
                        fontFamily: fontPlayfair,
                        fontSize:   64,
                        fontWeight: 700,
                        color:      C.textPrimary,
                        lineHeight: 1,
                        marginBottom: 28,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {formatCurrency(netWorth)}
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        borderTop:   '1px solid #E8E4DC',
                        paddingTop:  20,
                        display:     'flex',
                        gap:         32,
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
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize:   16,
                              fontWeight: 500,
                              color:      C.textPrimary,
                              fontFamily: fontJakarta,
                            }}
                          >
                            {formatCurrency(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right — Metric cards */}
                  <div
                    style={{
                      flex:          '0 0 40%',
                      display:       'flex',
                      flexDirection: 'column',
                      gap:           10,
                      justifyContent:'center',
                    }}
                  >
                    {/* Income */}
                    <div
                      style={{
                        background:   C.positiveBg,
                        borderRadius: 12,
                        padding:      12,
                      }}
                    >
                      <div
                        style={{
                          fontSize:   12,
                          fontWeight: 500,
                          color:      C.positive,
                          marginBottom: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Income
                      </div>
                      <div
                        style={{
                          fontSize:   22,
                          fontWeight: 700,
                          color:      C.positive,
                          fontFamily: fontJakarta,
                        }}
                      >
                        {formatCurrency(monthlyIncome)}
                      </div>
                    </div>

                    {/* Expenses */}
                    <div
                      style={{
                        background:   C.negativeBg,
                        borderRadius: 12,
                        padding:      12,
                      }}
                    >
                      <div
                        style={{
                          fontSize:   12,
                          fontWeight: 500,
                          color:      C.negative,
                          marginBottom: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Expenses
                      </div>
                      <div
                        style={{
                          fontSize:   22,
                          fontWeight: 700,
                          color:      C.negative,
                          fontFamily: fontJakarta,
                        }}
                      >
                        {formatCurrency(monthlyExpense)}
                      </div>
                    </div>

                    {/* Net Cash Flow */}
                    <div
                      style={{
                        background:   netCashFlow >= 0 ? C.amberLight : C.negativeBg,
                        borderRadius: 12,
                        padding:      12,
                      }}
                    >
                      <div
                        style={{
                          fontSize:   12,
                          fontWeight: 500,
                          color:      netCashFlow >= 0 ? C.amber : C.negative,
                          marginBottom: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Net Cash Flow
                      </div>
                      <div
                        style={{
                          fontSize:   22,
                          fontWeight: 700,
                          color:      netCashFlow >= 0 ? C.amber : C.negative,
                          fontFamily: fontJakarta,
                        }}
                      >
                        {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Income vs Expenses chart ────────────────────────────────── */}
              <div style={{ ...cardStyle, padding: '28px 32px', marginBottom: 24 }}>
                <div
                  style={{
                    fontSize:     16,
                    fontWeight:   600,
                    color:        C.textPrimary,
                    marginBottom: 24,
                    fontFamily:   fontJakarta,
                  }}
                >
                  Income vs Expenses · Last 6 Months
                </div>
                <div style={{ height: 260 }}>
                  <IncomeExpenseChart data={incomeExpenseData} />
                </div>
              </div>

              {/* ── Bottom 3-column section ─────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-6">

                {/* Col 1 — Accounts */}
                <div style={{ ...cardStyle, padding: '24px 24px' }}>
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 20 }}
                  >
                    <span
                      style={{
                        fontSize:   15,
                        fontWeight: 600,
                        color:      C.textPrimary,
                        fontFamily: fontJakarta,
                      }}
                    >
                      Accounts
                    </span>
                    <Link
                      to="/accounts"
                      style={{
                        fontSize:       13,
                        color:          C.amber,
                        textDecoration: 'none',
                        fontWeight:     500,
                      }}
                    >
                      View all →
                    </Link>
                  </div>

                  {accounts.length === 0 ? (
                    <p style={{ fontSize: 13, color: C.textTertiary }}>
                      No accounts yet.
                    </p>
                  ) : (
                    <div>
                      {accounts.slice(0, 6).map((account, idx) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between"
                          style={{
                            padding:      '10px 0',
                            borderBottom: idx < Math.min(accounts.length, 6) - 1
                              ? '1px solid #E8E4DC'
                              : 'none',
                          }}
                        >
                          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                            <div
                              style={{
                                width:        8,
                                height:       8,
                                borderRadius: '50%',
                                background:   accountDotColor(account.type),
                                flexShrink:   0,
                              }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize:     14,
                                  fontWeight:   500,
                                  color:        C.textPrimary,
                                  overflow:     'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace:   'nowrap',
                                }}
                              >
                                {account.name}
                              </div>
                              <div
                                style={{
                                  fontSize:      11,
                                  color:         C.textTertiary,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {account.type.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize:   14,
                              fontWeight: 500,
                              color:      C.textPrimary,
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            {formatCurrency(account.balance, getCurrencySymbol(account.currency))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Col 2 — Spending */}
                <div style={{ ...cardStyle, padding: '24px 24px' }}>
                  <div
                    style={{
                      fontSize:     15,
                      fontWeight:   600,
                      color:        C.textPrimary,
                      marginBottom: 20,
                      fontFamily:   fontJakarta,
                    }}
                  >
                    Top Spending
                  </div>
                  <CategoryPieChart data={categoryChartData} />
                </div>

                {/* Col 3 — Recent transactions */}
                <div style={{ ...cardStyle, padding: '24px 24px' }}>
                  <div
                    style={{
                      fontSize:     15,
                      fontWeight:   600,
                      color:        C.textPrimary,
                      marginBottom: 20,
                      fontFamily:   fontJakarta,
                    }}
                  >
                    Recent
                  </div>

                  {recentTransactions.length === 0 ? (
                    <p style={{ fontSize: 13, color: C.textTertiary }}>
                      No transactions yet.
                    </p>
                  ) : (
                    <div>
                      {recentTransactions.slice(0, 10).map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between"
                          style={{
                            padding:      '8px 0',
                            borderBottom: '1px solid #F0EDE8',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize:      11,
                                color:         C.textTertiary,
                                marginBottom:  2,
                              }}
                            >
                              {format(new Date(tx.date), 'd MMM')}
                            </div>
                            <div
                              style={{
                                fontSize:     13,
                                fontWeight:   500,
                                color:        C.textPrimary,
                                overflow:     'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace:   'nowrap',
                                maxWidth:     140,
                              }}
                            >
                              {tx.description}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize:   13,
                              fontWeight: 600,
                              color:      tx.type === 'income' ? C.positive : C.negative,
                              flexShrink: 0,
                              marginLeft: 8,
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
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
