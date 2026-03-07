import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';

const C = {
  bg: '#FFFFFF',
  surface: '#F8F9FA',
  textPrimary: '#1A1A2E',
  textSecondary: '#6C757D',
  incomeGreen: '#0FA86E',
  expenseOrange: '#F97316',
  accentBlue: '#3B82F6',
  purple: '#8B5CF6',
  warmYellow: '#F59E0B',
  border: '#E5E7EB',
  navBg: '#FFFFFF',
  darkGradStart: '#1A1A2E',
  darkGradEnd: '#2D3561',
};

const FONT_DISPLAY = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Nunito', system-ui, sans-serif";

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Budget', href: '/budget' },
  { label: 'Goals', href: '/goals' },
];

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  current: C.accentBlue,
  savings: C.incomeGreen,
  isa: C.purple,
  stocks_and_shares_isa: C.warmYellow,
  credit: C.expenseOrange,
  investment: '#14B8A6',
  loan: '#EF4444',
  asset: '#10B981',
  liability: '#F97316',
};

const ACCOUNT_TYPE_EMOJI: Record<string, string> = {
  current: '🏦',
  savings: '🐷',
  isa: '📈',
  stocks_and_shares_isa: '📊',
  credit: '💳',
  investment: '💰',
  loan: '📋',
  asset: '🏠',
  liability: '📄',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard2Page() {
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    const id = 'dashboard2-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Nunito:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const { data: incomeExpenseTrendResponse } = useQuery({
    queryKey: ['dashboard-income-expense-trend', 6],
    queryFn: () => dashboardService.getIncomeExpenseTrend(6),
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
  const savingsRate = summary?.savingsRate ?? (monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0);

  const categoryChartData = topCategories.map((item) => ({
    name: item.category?.name || 'Unknown',
    value: item.amount,
    color: item.category?.color || '#888',
  }));

  const incomeExpenseData =
    incomeExpenseTrendResponse?.trend?.map((point) => ({
      date: `${point.month}-01`,
      income: point.income || 0,
      expense: point.expense || 0,
    })) || [
      {
        date: new Date().toISOString(),
        income: summary?.monthlyIncome || 0,
        expense: summary?.monthlyExpense || 0,
      },
    ];

  const firstName = user?.name?.split(' ')[0] || 'there';
  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        overflow: 'auto',
        fontFamily: FONT_BODY,
        backgroundColor: C.bg,
        color: C.textPrimary,
      }}
    >
      {/* Top Navigation Bar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: C.navBg,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: 56,
        }}
      >
        {/* Left: Logo */}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 20,
            color: C.accentBlue,
            letterSpacing: '-0.02em',
          }}
        >
          FinPlan
        </div>

        {/* Center: Tab navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: C.surface,
            borderRadius: 40,
            padding: '4px',
            gap: 2,
          }}
        >
          {navLinks.map(({ label, href }) => {
            const isActive =
              location.pathname === href ||
              (href === '/dashboard' && location.pathname === '/dashboard2');
            return (
              <Link
                key={href}
                to={href}
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: 30,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: FONT_BODY,
                  backgroundColor: isActive ? C.textPrimary : 'transparent',
                  color: isActive ? '#FFFFFF' : C.textSecondary,
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: C.purple,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT_BODY,
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
            cursor: 'default',
          }}
        >
          {userInitial}
        </div>
      </nav>

      {/* Main content */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '40px 32px',
        }}
      >
        {/* Greeting hero */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 700,
              fontSize: 28,
              color: C.textPrimary,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 15,
              color: C.textSecondary,
              margin: '6px 0 0',
            }}
          >
            Here's how your finances look this month
          </p>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 13,
              color: C.textSecondary,
              margin: '4px 0 0',
              opacity: 0.7,
            }}
          >
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>

        {/* Net worth card */}
        {isLoading ? (
          <div
            style={{
              height: 160,
              borderRadius: 20,
              backgroundColor: C.surface,
              marginBottom: 28,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ) : (
          <div
            style={{
              background: `linear-gradient(135deg, ${C.darkGradStart} 0%, ${C.darkGradEnd} 100%)`,
              borderRadius: 20,
              padding: '36px 40px',
              marginBottom: 28,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative' as const,
              overflow: 'hidden',
              flexWrap: 'wrap' as const,
              gap: 24,
            }}
          >
            {/* Texture overlay */}
            <div
              style={{
                position: 'absolute' as const,
                inset: 0,
                backgroundImage:
                  'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                pointerEvents: 'none',
              }}
            />

            {/* Left: Net worth */}
            <div style={{ position: 'relative' as const, zIndex: 1 }}>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 10,
                }}
              >
                Your Net Worth
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 56,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(netWorth)}
              </div>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 10,
                }}
              >
                Cash + Assets − Liabilities
              </div>
            </div>

            {/* Right: Mini stats */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 16,
                position: 'relative' as const,
                zIndex: 1,
              }}
            >
              {[
                { label: 'Cash', value: totalCash },
                { label: 'Assets', value: totalAssets },
                { label: 'Liabilities', value: totalLiabilities },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.5)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 22,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.9)',
                    }}
                  >
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
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Income */}
          <div
            style={{
              backgroundColor: '#ECFDF5',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${C.incomeGreen}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              💚
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                color: C.incomeGreen,
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                marginBottom: 6,
              }}
            >
              Income
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 28,
                fontWeight: 700,
                color: C.incomeGreen,
                lineHeight: 1.1,
              }}
            >
              {formatCurrency(monthlyIncome)}
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: `${C.incomeGreen}99`,
                marginTop: 6,
              }}
            >
              This month
            </div>
          </div>

          {/* Expenses */}
          <div
            style={{
              backgroundColor: '#FFF7ED',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${C.expenseOrange}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              🧾
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                color: C.expenseOrange,
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                marginBottom: 6,
              }}
            >
              Expenses
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 28,
                fontWeight: 700,
                color: C.expenseOrange,
                lineHeight: 1.1,
              }}
            >
              {formatCurrency(monthlyExpense)}
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: `${C.expenseOrange}99`,
                marginTop: 6,
              }}
            >
              This month
            </div>
          </div>

          {/* Savings rate */}
          <div
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${C.accentBlue}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              📊
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                color: C.accentBlue,
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                marginBottom: 6,
              }}
            >
              Savings Rate
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 28,
                fontWeight: 700,
                color: C.accentBlue,
                lineHeight: 1.1,
              }}
            >
              {savingsRate}%
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: `${C.accentBlue}99`,
                marginTop: 6,
              }}
            >
              This month
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60% 40%',
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Income vs Expense chart */}
          <div
            style={{
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 15,
                fontWeight: 700,
                color: C.textPrimary,
                marginBottom: 20,
              }}
            >
              Money In vs Out
            </div>
            <IncomeExpenseChart data={incomeExpenseData} />
          </div>

          {/* Category pie */}
          <div
            style={{
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 15,
                fontWeight: 700,
                color: C.textPrimary,
                marginBottom: 20,
              }}
            >
              Spending Breakdown
            </div>
            <CategoryPieChart data={categoryChartData} />
          </div>
        </div>

        {/* Accounts section */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 17,
              fontWeight: 700,
              color: C.textPrimary,
              marginBottom: 16,
            }}
          >
            Your Accounts
          </div>
          {accounts.length === 0 ? (
            <div
              style={{
                backgroundColor: C.surface,
                borderRadius: 16,
                padding: 24,
                fontFamily: FONT_BODY,
                fontSize: 14,
                color: C.textSecondary,
              }}
            >
              No accounts yet. Head to Accounts to add your first one.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 14,
                overflowX: 'auto',
                paddingBottom: 8,
                scrollbarWidth: 'thin' as const,
              }}
            >
              {accounts.map((account) => {
                const borderColor = ACCOUNT_TYPE_COLORS[account.type] || C.accentBlue;
                const emoji = ACCOUNT_TYPE_EMOJI[account.type] || '💼';
                const typeLabel = account.type.replace(/_/g, ' ');
                return (
                  <div
                    key={account.id}
                    style={{
                      minWidth: 200,
                      backgroundColor: C.surface,
                      borderRadius: 12,
                      padding: '18px 20px',
                      borderLeft: `4px solid ${borderColor}`,
                      flexShrink: 0,
                      cursor: 'default',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = 'translateY(-2px)';
                      el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = 'translateY(0)';
                      el.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 10 }}>{emoji}</div>
                    <div
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.textPrimary,
                        marginBottom: 4,
                        whiteSpace: 'nowrap' as const,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {account.name}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontFamily: FONT_BODY,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'capitalize' as const,
                          color: borderColor,
                          backgroundColor: `${borderColor}18`,
                          padding: '2px 8px',
                          borderRadius: 20,
                        }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 20,
                        fontWeight: 700,
                        color: account.balance < 0 ? C.expenseOrange : C.textPrimary,
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

        {/* Recent transactions */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 17,
              fontWeight: 700,
              color: C.textPrimary,
              marginBottom: 16,
            }}
          >
            Latest Transactions
          </div>
          <div
            style={{
              backgroundColor: C.surface,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {recentTransactions.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  fontFamily: FONT_BODY,
                  fontSize: 14,
                  color: C.textSecondary,
                }}
              >
                No transactions yet. Add your first transaction to get started.
              </div>
            ) : (
              recentTransactions.map((tx, idx) => {
                const isIncome = tx.type === 'income';
                const dotColor = isIncome ? C.incomeGreen : C.expenseOrange;
                const amountColor = isIncome ? C.incomeGreen : C.expenseOrange;
                const catColor = tx.category?.color || C.textSecondary;

                return (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 20px',
                      borderBottom:
                        idx < recentTransactions.length - 1
                          ? `1px solid ${C.border}`
                          : 'none',
                      transition: 'background-color 0.15s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F1F3F5';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Colored dot */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        flexShrink: 0,
                      }}
                    />

                    {/* Description */}
                    <div
                      style={{
                        flex: 1,
                        fontFamily: FONT_BODY,
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      {tx.description}
                    </div>

                    {/* Category pill */}
                    {tx.category && (
                      <span
                        style={{
                          fontFamily: FONT_BODY,
                          fontSize: 11,
                          fontWeight: 700,
                          color: catColor,
                          backgroundColor: `${catColor}18`,
                          padding: '3px 10px',
                          borderRadius: 20,
                          flexShrink: 0,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {tx.category.name}
                      </span>
                    )}

                    {/* Date */}
                    <div
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 12,
                        color: C.textSecondary,
                        flexShrink: 0,
                        minWidth: 44,
                        textAlign: 'right' as const,
                      }}
                    >
                      {format(new Date(tx.date), 'd MMM')}
                    </div>

                    {/* Amount */}
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 16,
                        fontWeight: 700,
                        color: amountColor,
                        flexShrink: 0,
                        minWidth: 80,
                        textAlign: 'right' as const,
                      }}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
