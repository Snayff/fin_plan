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
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import NetWorthChart from '../components/charts/NetWorthChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';

const COLORS = {
  bg: '#FAF8F3',
  sidebarBg: '#F3EDE0',
  textPrimary: '#2D2926',
  textSecondary: '#6B5E53',
  textTertiary: '#9A8B7F',
  income: '#2D6A4F',
  expense: '#C44B2B',
  accent: '#D4722A',
  border: '#E8DDD1',
  cardBg: '#FFFFFF',
  sidebarActive: '#D4722A',
};

const FONT_SERIF = "'Crimson Pro', Georgia, serif";
const FONT_SANS = "'DM Sans', system-ui, sans-serif";

const navItems = [
  { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
  { label: 'Accounts', href: '/accounts', Icon: CreditCard },
  { label: 'Transactions', href: '/transactions', Icon: ArrowRightLeft },
  { label: 'Assets', href: '/assets', Icon: Building },
  { label: 'Liabilities', href: '/liabilities', Icon: Landmark },
  { label: 'Budget', href: '/budget', Icon: PiggyBank },
  { label: 'Goals', href: '/goals', Icon: Target },
];

function Divider() {
  return (
    <div style={{ height: 1, backgroundColor: COLORS.border, margin: '32px 0' }} />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT_SANS,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: COLORS.textTertiary,
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

export default function Dashboard1Page() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const id = 'dashboard1-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const { data: netWorthTrendResponse } = useQuery({
    queryKey: ['dashboard-net-worth-trend', 6],
    queryFn: () => dashboardService.getNetWorthTrend(6),
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
  const netCashFlow = monthlyIncome - monthlyExpense;

  const categoryChartData = topCategories.map((item) => ({
    name: item.category?.name || 'Unknown',
    value: item.amount,
    color: item.category?.color || '#888',
  }));

  const netWorthData =
    netWorthTrendResponse?.trend?.map((point) => ({
      date: `${point.month}-01`,
      netWorth:
        point.netWorth ??
        (point.cash ?? point.balance ?? 0) +
          (point.assets || 0) -
          (point.liabilities || 0),
    })) || [{ date: new Date().toISOString(), netWorth: netWorth }];

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const getAccountTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      current: 'Current',
      savings: 'Savings',
      isa: 'ISA',
      stocks_and_shares_isa: 'S&S ISA',
      credit: 'Credit',
      investment: 'Investment',
      loan: 'Loan',
      asset: 'Asset',
      liability: 'Liability',
    };
    return labels[type] || type;
  };

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
        display: 'flex',
        fontFamily: FONT_SANS,
        backgroundColor: COLORS.bg,
        color: COLORS.textPrimary,
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          minWidth: 220,
          backgroundColor: COLORS.sidebarBg,
          borderRight: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 0',
          position: 'sticky',
          top: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 24px 32px', borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: COLORS.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              FP
            </div>
            <span
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.textPrimary,
                letterSpacing: '-0.02em',
              }}
            >
              FinPlan
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '24px 12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ label, href, Icon }) => {
            const isActive = location.pathname === href || (href === '/dashboard' && location.pathname === '/dashboard1');
            return (
              <Link
                key={href}
                to={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? COLORS.sidebarActive : COLORS.textSecondary,
                  backgroundColor: isActive ? `${COLORS.sidebarActive}14` : 'transparent',
                  borderLeft: isActive ? `3px solid ${COLORS.sidebarActive}` : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div
          style={{
            padding: '24px',
            borderTop: `1px solid ${COLORS.border}`,
            marginTop: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: COLORS.accent,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLORS.textPrimary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || user?.email || 'User'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: COLORS.textTertiary,
              padding: '4px 0',
              fontFamily: FONT_SANS,
              transition: 'color 0.15s ease',
            }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '48px 40px',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 36,
              fontWeight: 600,
              color: COLORS.textPrimary,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Your Financial Picture
          </h1>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: 14,
              color: COLORS.textTertiary,
              marginTop: 6,
            }}
          >
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>

        {/* Hero — Net Worth */}
        {isLoading ? (
          <div
            style={{
              height: 120,
              backgroundColor: COLORS.cardBg,
              borderRadius: 16,
              marginBottom: 40,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ) : (
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                display: 'inline-block',
                fontFamily: FONT_SERIF,
                fontSize: 72,
                fontWeight: 700,
                color: COLORS.textPrimary,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                borderBottom: `3px solid ${COLORS.accent}`,
                paddingBottom: 4,
              }}
            >
              {formatCurrency(netWorth)}
            </div>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                color: COLORS.textTertiary,
                marginTop: 12,
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
              }}
            >
              Net Worth
            </div>
            <div
              style={{
                display: 'flex',
                gap: 32,
                marginTop: 16,
                flexWrap: 'wrap' as const,
              }}
            >
              {[
                { label: 'Cash', value: totalCash, color: COLORS.textSecondary },
                { label: 'Assets', value: totalAssets, color: COLORS.income },
                { label: 'Liabilities', value: totalLiabilities, color: COLORS.expense },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 11,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.08em',
                      color: COLORS.textTertiary,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_SERIF,
                      fontSize: 22,
                      fontWeight: 600,
                      color,
                    }}
                  >
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Divider />

        {/* This Month */}
        <SectionLabel>This Month</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginBottom: 40,
          }}
        >
          {[
            {
              label: 'Income',
              value: monthlyIncome,
              color: COLORS.income,
              bgAccent: `${COLORS.income}10`,
            },
            {
              label: 'Expenses',
              value: monthlyExpense,
              color: COLORS.expense,
              bgAccent: `${COLORS.expense}10`,
            },
            {
              label: 'Net Cash Flow',
              value: netCashFlow,
              color: netCashFlow >= 0 ? COLORS.income : COLORS.expense,
              bgAccent: netCashFlow >= 0 ? `${COLORS.income}10` : `${COLORS.expense}10`,
            },
          ].map(({ label, value, color, bgAccent }) => (
            <div
              key={label}
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 2px 12px rgba(45,41,38,0.08)',
                borderTop: `3px solid ${color}`,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 11,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  color: COLORS.textTertiary,
                  marginBottom: 10,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 32,
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                }}
              >
                {netCashFlow < 0 && label === 'Net Cash Flow' ? '-' : ''}
                {formatCurrency(Math.abs(value))}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  fontSize: 11,
                  fontFamily: FONT_SANS,
                  color,
                  backgroundColor: bgAccent,
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                {label === 'Net Cash Flow'
                  ? `${summary?.savingsRate ?? 0}% savings rate`
                  : 'This period'}
              </div>
            </div>
          ))}
        </div>

        <Divider />

        {/* Net Worth Trend */}
        <SectionLabel>Net Worth Over Time</SectionLabel>
        <div
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 2px 12px rgba(45,41,38,0.08)',
            marginBottom: 40,
          }}
        >
          <NetWorthChart data={netWorthData} />
        </div>

        <Divider />

        {/* Where Your Money Goes */}
        <SectionLabel>Where Your Money Goes</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '55% 45%',
            gap: 24,
            marginBottom: 40,
          }}
        >
          {/* Accounts list */}
          <div
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 2px 12px rgba(45,41,38,0.08)',
            }}
          >
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 18,
                fontWeight: 600,
                color: COLORS.textPrimary,
                marginBottom: 20,
              }}
            >
              Accounts
            </div>
            {accounts.length === 0 ? (
              <p style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.textTertiary }}>
                No accounts yet. Add your first account to get started.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {accounts.slice(0, 7).map((account, idx) => (
                  <div
                    key={account.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 10px',
                      borderRadius: 8,
                      borderBottom:
                        idx < Math.min(accounts.length, 7) - 1
                          ? `1px solid ${COLORS.border}`
                          : 'none',
                      transition: 'background-color 0.15s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = `${COLORS.sidebarBg}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: FONT_SANS,
                          fontSize: 14,
                          fontWeight: 500,
                          color: COLORS.textPrimary,
                        }}
                      >
                        {account.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontFamily: FONT_SANS,
                            fontSize: 10,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.06em',
                            color: COLORS.accent,
                            backgroundColor: `${COLORS.accent}18`,
                            padding: '2px 7px',
                            borderRadius: 10,
                            fontWeight: 600,
                          }}
                        >
                          {getAccountTypeBadge(account.type)}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_SERIF,
                        fontSize: 18,
                        fontWeight: 600,
                        color: account.balance < 0 ? COLORS.expense : COLORS.textPrimary,
                      }}
                    >
                      {formatCurrency(account.balance, getCurrencySymbol(account.currency))}
                    </div>
                  </div>
                ))}
                {accounts.length > 7 && (
                  <Link
                    to="/accounts"
                    style={{
                      display: 'block',
                      marginTop: 12,
                      fontSize: 13,
                      fontFamily: FONT_SANS,
                      color: COLORS.accent,
                      textDecoration: 'none',
                    }}
                  >
                    View all {accounts.length} accounts →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Category breakdown */}
          <div
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 2px 12px rgba(45,41,38,0.08)',
            }}
          >
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 18,
                fontWeight: 600,
                color: COLORS.textPrimary,
                marginBottom: 20,
              }}
            >
              Spending by Category
            </div>
            <CategoryPieChart data={categoryChartData} />
          </div>
        </div>

        <Divider />

        {/* Recent Activity */}
        <SectionLabel>Recent Activity</SectionLabel>
        <div
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 2px 12px rgba(45,41,38,0.08)',
            marginBottom: 40,
          }}
        >
          {recentTransactions.length === 0 ? (
            <p style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.textTertiary }}>
              No transactions yet. Add your first transaction to get started.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentTransactions.map((tx, idx) => {
                const isIncome = tx.type === 'income';
                const amountColor = isIncome ? COLORS.income : COLORS.expense;
                return (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '13px 10px',
                      borderRadius: 8,
                      borderBottom:
                        idx < recentTransactions.length - 1
                          ? `1px solid ${COLORS.border}`
                          : 'none',
                      transition: 'background-color 0.15s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = COLORS.sidebarBg;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Date */}
                    <div
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 12,
                        color: COLORS.textTertiary,
                        minWidth: 48,
                        flexShrink: 0,
                      }}
                    >
                      {format(new Date(tx.date), 'd MMM')}
                    </div>

                    {/* Description */}
                    <div
                      style={{
                        flex: 1,
                        fontFamily: FONT_SANS,
                        fontSize: 14,
                        color: COLORS.textPrimary,
                        fontWeight: 500,
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
                          fontFamily: FONT_SANS,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          color: tx.category.color || COLORS.textTertiary,
                          backgroundColor: `${tx.category.color || '#888'}18`,
                          padding: '3px 10px',
                          borderRadius: 20,
                          flexShrink: 0,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {tx.category.name}
                      </span>
                    )}

                    {/* Amount */}
                    <div
                      style={{
                        fontFamily: FONT_SERIF,
                        fontSize: 18,
                        fontWeight: 600,
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
              })}
            </div>
          )}
        </div>

        {/* Footer greeting */}
        <div
          style={{
            textAlign: 'center' as const,
            paddingBottom: 24,
            fontFamily: FONT_SERIF,
            fontSize: 15,
            color: COLORS.textTertiary,
            fontStyle: 'italic',
          }}
        >
          Keep it up, {firstName}. Every entry is a step toward clarity.
        </div>
      </main>
    </div>
  );
}
