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
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

const C = {
  bg: '#1A0E50',
  sidebar: '#140B40',
  panel: '#251565',
  panelBorder: 'rgba(212,175,55,0.18)',
  gold: '#D4AF37',
  goldLight: '#ECD078',
  goldDim: 'rgba(212,175,55,0.35)',
  text: '#F5EDD8',
  textMuted: 'rgba(245,237,216,0.55)',
  textDim: 'rgba(245,237,216,0.3)',
  expense: '#D4706A',
};

const navItems = [
  { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
  { label: 'Accounts', href: '/accounts', Icon: CreditCard },
  { label: 'Transactions', href: '/transactions', Icon: ArrowRightLeft },
  { label: 'Assets', href: '/assets', Icon: Building },
  { label: 'Liabilities', href: '/liabilities', Icon: Landmark },
  { label: 'Budget', href: '/budget', Icon: PiggyBank },
  { label: 'Goals', href: '/goals', Icon: Target },
];

const panelCard: React.CSSProperties = {
  background: '#251565',
  border: '1px solid rgba(212,175,55,0.18)',
  borderRadius: 8,
  padding: 24,
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "'Raleway', sans-serif",
  fontSize: 10,
  fontWeight: 400,
  color: C.textMuted,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  marginBottom: 20,
};

const GoldDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '48px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,0.2)' }} />
    <span style={{ color: '#D4AF37', fontSize: 8, opacity: 0.7 }}>◆</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,0.2)' }} />
  </div>
);

export default function Dashboard15Page() {
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    const fontId = 'dashboard15-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@300;400;500;600&display=swap';
      document.head.appendChild(link);
    }

    const keyframeId = 'sovereign-keyframes';
    if (!document.getElementById(keyframeId)) {
      const style = document.createElement('style');
      style.id = keyframeId;
      style.textContent = `
        @keyframes goldReveal { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-net-worth-trend'],
    queryFn: () => dashboardService.getNetWorthTrend(6),
  });

  const summary = summaryData?.summary;
  const accounts = summaryData?.accounts ?? [];
  const recentTransactions = summaryData?.recentTransactions ?? [];
  const topCategories = summaryData?.topCategories ?? [];

  const totalAssets = summary?.totalAssets ?? 0;
  const totalLiabilities = summary?.totalLiabilities ?? 0;
  const monthlyIncome = summary?.monthlyIncome ?? 0;
  const monthlyExpenses = summary?.monthlyExpense ?? 0;
  const netFlow = summary?.netCashFlow ?? 0;

  const maxCategoryAmount = topCategories.length > 0
    ? Math.max(...topCategories.slice(0, 6).map((c) => c.amount))
    : 1;

  const userInitials = (() => {
    const name = user?.name || user?.email || '';
    if (!name) return 'FP';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    return name.charAt(0).toUpperCase();
  })();

  const chartData = trendData?.trend?.map((point) => ({
    month: point.month,
    netWorth:
      point.netWorth ??
      (point.cash ?? point.balance ?? 0) + (point.assets ?? 0) - (point.liabilities ?? 0),
  })) ?? [];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#1A0E50',
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(80,40,180,0.4) 0%, transparent 70%)',
        fontFamily: "'Raleway', sans-serif",
        color: '#F5EDD8',
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          background: '#140B40',
          borderRight: '1px solid rgba(212,175,55,0.25)',
          position: 'fixed',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ padding: '32px 28px 0' }}>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '0.35em',
              color: C.gold,
            }}
          >
            SOVEREIGN
          </div>
          <div style={{ height: 1, background: C.goldDim, margin: '20px 0 0' }} />
        </div>

        {/* Net worth in sidebar */}
        <div style={{ padding: '24px 28px' }}>
          <div
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: 10,
              fontWeight: 400,
              color: C.textMuted,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            NET WORTH
          </div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 22,
              fontWeight: 600,
              color: C.gold,
            }}
          >
            {formatCurrency(summary?.netWorth ?? 0)}
          </div>
          <div
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: 11,
              fontWeight: 400,
              color: C.textDim,
              marginTop: 4,
            }}
          >
            updated today
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(212,175,55,0.15)', margin: '0 28px' }} />

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map(({ label, href, Icon }) => {
            const isActive =
              location.pathname === href ||
              (href === '/dashboard' && location.pathname === '/dashboard15');

            const baseStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 28px',
              cursor: 'pointer',
              textDecoration: 'none',
              color: C.textMuted,
              fontSize: 13,
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 400,
            };

            const activeStyle: React.CSSProperties = {
              color: C.goldLight,
              borderLeft: '2px solid #D4AF37',
              paddingLeft: 26,
              background: 'rgba(212,175,55,0.06)',
              fontWeight: 500,
            };

            return (
              <Link
                key={href}
                to={href}
                style={isActive ? { ...baseStyle, ...activeStyle } : baseStyle}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ height: 1, background: 'rgba(212,175,55,0.15)', marginBottom: 20 }} />
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Cinzel', serif",
              fontSize: 13,
              fontWeight: 600,
              color: C.gold,
            }}
          >
            {userInitials}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main
        style={{
          marginLeft: 240,
          padding: 48,
          flex: 1,
          paddingBottom: 80,
        }}
      >
        {/* SECTION 1 — HERO */}
        <div style={sectionLabelStyle as React.CSSProperties}>PORTFOLIO VALUE</div>

        {!summary ? (
          /* Loading skeleton */
          <div>
            <div
              style={{
                height: 72,
                width: '40%',
                background: 'rgba(212,175,55,0.08)',
                borderRadius: 4,
              }}
            />
            <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ ...panelCard, height: 32, width: 120, background: 'rgba(212,175,55,0.06)', borderRadius: 4 }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(48px, 6vw, 96px)',
                fontWeight: 700,
                color: '#D4AF37',
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                animation: 'goldReveal 1s ease both',
              }}
            >
              {formatCurrency(summary.netWorth ?? 0)}
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 40 }}>
              {/* ASSETS */}
              <div>
                <div
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 10,
                    fontWeight: 400,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.25em',
                    marginBottom: 6,
                  }}
                >
                  ASSETS
                </div>
                <div
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 15,
                    fontWeight: 500,
                    color: C.text,
                  }}
                >
                  {formatCurrency(totalAssets)}
                </div>
              </div>

              {/* LIABILITIES */}
              <div>
                <div
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 10,
                    fontWeight: 400,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.25em',
                    marginBottom: 6,
                  }}
                >
                  LIABILITIES
                </div>
                <div
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 15,
                    fontWeight: 500,
                    color: C.textMuted,
                  }}
                >
                  {formatCurrency(totalLiabilities)}
                </div>
              </div>

              {/* THIS MONTH */}
              <div>
                <div
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 10,
                    fontWeight: 400,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.25em',
                    marginBottom: 6,
                  }}
                >
                  THIS MONTH
                </div>
                <div
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 15,
                    fontWeight: 500,
                    color: netFlow >= 0 ? C.gold : C.expense,
                  }}
                >
                  {formatCurrency(Math.abs(netFlow))}
                </div>
              </div>
            </div>
          </div>
        )}

        <GoldDivider />

        {/* SECTION 2 — THIS MONTH */}
        <div style={sectionLabelStyle as React.CSSProperties}>THIS MONTH</div>

        {!summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={panelCard}>
                <div style={{ height: 32, background: 'rgba(212,175,55,0.06)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {/* INCOME */}
            <div style={panelCard}>
              <div
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 10,
                  fontWeight: 400,
                  color: C.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  marginBottom: 12,
                }}
              >
                INCOME
              </div>
              <div
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 28,
                  fontWeight: 600,
                  color: '#D4AF37',
                }}
              >
                {formatCurrency(monthlyIncome)}
              </div>
            </div>

            {/* EXPENSES */}
            <div style={panelCard}>
              <div
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 10,
                  fontWeight: 400,
                  color: C.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  marginBottom: 12,
                }}
              >
                EXPENSES
              </div>
              <div
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 28,
                  fontWeight: 600,
                  color: '#D4706A',
                }}
              >
                {formatCurrency(monthlyExpenses)}
              </div>
            </div>

            {/* NET FLOW */}
            <div style={panelCard}>
              <div
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 10,
                  fontWeight: 400,
                  color: C.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  marginBottom: 12,
                }}
              >
                NET FLOW
              </div>
              <div
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 28,
                  fontWeight: 600,
                  color: netFlow >= 0 ? C.gold : C.expense,
                }}
              >
                <span style={{ fontSize: 18, marginRight: 2 }}>{netFlow >= 0 ? '+' : '-'}</span>
                {formatCurrency(Math.abs(netFlow))}
              </div>
            </div>
          </div>
        )}

        <GoldDivider />

        {/* SECTION 3 — TREND + SPENDING */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
          {/* Left: NET WORTH TREND */}
          <div>
            <div style={sectionLabelStyle as React.CSSProperties}>NET WORTH TREND</div>
            <div style={panelCard}>
              {!trendData ? (
                <div style={{ height: 200, background: 'rgba(212,175,55,0.06)', borderRadius: 4 }} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sovereignGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: 10,
                        fill: 'rgba(245,237,216,0.55)',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#140B40',
                        border: '1px solid rgba(212,175,55,0.3)',
                        borderRadius: 4,
                        padding: '8px 12px',
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: 12,
                        color: C.text,
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                      labelStyle={{ color: C.textMuted, fontFamily: "'Raleway', sans-serif", fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stroke="#D4AF37"
                      strokeWidth={1.5}
                      fill="url(#sovereignGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right: WHERE IT GOES */}
          <div>
            <div style={sectionLabelStyle as React.CSSProperties}>WHERE IT GOES</div>
            <div>
              {topCategories.slice(0, 6).map((item, idx) => {
                const name = item.category?.name ?? 'Unknown';
                const amount = item.amount;
                const pct = maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0;

                return (
                  <div
                    key={idx}
                    style={{
                      ...panelCard,
                      padding: '12px 16px',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontFamily: "'Raleway', sans-serif",
                          fontSize: 13,
                          fontWeight: 500,
                          color: C.text,
                        }}
                      >
                        {name}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Raleway', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.textMuted,
                        }}
                      >
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 2,
                        background: 'rgba(212,175,55,0.12)',
                        borderRadius: 1,
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          height: 2,
                          background: 'rgba(212,175,55,0.45)',
                          borderRadius: 1,
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <GoldDivider />

        {/* SECTION 4 — ACCOUNTS + TRANSACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32 }}>
          {/* Left: ACCOUNTS */}
          <div>
            <div style={sectionLabelStyle as React.CSSProperties}>ACCOUNTS</div>
            <div>
              {!summary
                ? [1, 2, 3].map((i) => (
                    <div key={i} style={{ ...panelCard, padding: '16px 20px', marginBottom: 8 }}>
                      <div style={{ height: 32, background: 'rgba(212,175,55,0.06)', borderRadius: 4 }} />
                    </div>
                  ))
                : accounts.map((account) => (
                    <div
                      key={account.id}
                      style={{
                        ...panelCard,
                        padding: '16px 20px',
                        marginBottom: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontSize: 14,
                            fontWeight: 500,
                            color: C.text,
                          }}
                        >
                          {account.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontSize: 10,
                            fontWeight: 400,
                            color: C.textDim,
                            textTransform: 'uppercase',
                            marginTop: 3,
                          }}
                        >
                          {account.type}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Raleway', sans-serif",
                          fontSize: 15,
                          fontWeight: 600,
                          color: account.balance < 0 ? C.expense : C.text,
                        }}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Right: RECENT TRANSACTIONS */}
          <div>
            <div style={sectionLabelStyle as React.CSSProperties}>RECENT TRANSACTIONS</div>
            <div style={{ ...panelCard, padding: 20 }}>
              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 100px',
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 10,
                  fontWeight: 400,
                  color: C.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  paddingBottom: 12,
                  borderBottom: '1px solid rgba(212,175,55,0.12)',
                }}
              >
                <span>DATE</span>
                <span>DESCRIPTION</span>
                <span style={{ textAlign: 'right' }}>AMOUNT</span>
              </div>

              {/* Transactions */}
              {!summary
                ? [1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 100px',
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(212,175,55,0.06)',
                      }}
                    >
                      <div style={{ height: 14, background: 'rgba(212,175,55,0.06)', borderRadius: 4 }} />
                      <div style={{ height: 14, background: 'rgba(212,175,55,0.06)', borderRadius: 4, marginRight: 16 }} />
                      <div style={{ height: 14, background: 'rgba(212,175,55,0.06)', borderRadius: 4 }} />
                    </div>
                  ))
                : recentTransactions.slice(0, 10).map((tx, idx) => {
                    const isIncome = tx.type === 'income';
                    const amountColor = isIncome ? '#D4AF37' : '#D4706A';
                    const desc = (tx.name ?? tx.description ?? '').slice(0, 35);

                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '80px 1fr 100px',
                          padding: '12px 0',
                          borderBottom:
                            idx < Math.min(recentTransactions.length, 10) - 1
                              ? '1px solid rgba(212,175,55,0.06)'
                              : 'none',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontSize: 12,
                            fontWeight: 400,
                            color: C.textMuted,
                          }}
                        >
                          {format(new Date(tx.date), 'd MMM')}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontSize: 13,
                            fontWeight: 400,
                            color: C.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {desc || '—'}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: amountColor,
                            textAlign: 'right',
                          }}
                        >
                          {formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
