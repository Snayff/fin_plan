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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:          '#F0EBE3',
  cardBg:      '#FEFCF9',
  sage:        '#8BAF8A',
  forest:      '#4A6741',
  terracotta:  '#C4956A',
  blush:       '#E8D5C4',
  dustyRose:   '#D4A5A5',
  text:        '#2C2018',
  textMuted:   '#7A6456',
  textLight:   '#A89288',
};

// ── Typography ────────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Nunito', system-ui, sans-serif";

// ── Nav items ─────────────────────────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard',    href: '/dashboard',    Icon: LayoutDashboard },
  { label: 'Accounts',     href: '/accounts',     Icon: CreditCard },
  { label: 'Transactions', href: '/transactions', Icon: ArrowRightLeft },
  { label: 'Assets',       href: '/assets',       Icon: Building },
  { label: 'Liabilities',  href: '/liabilities',  Icon: Landmark },
  { label: 'Budget',       href: '/budget',       Icon: PiggyBank },
  { label: 'Goals',        href: '/goals',        Icon: Target },
];

// ── Account type helpers ──────────────────────────────────────────────────────
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

function getAccountDotColor(type: string): string {
  switch (type) {
    case 'savings':
    case 'current':
      return C.sage;
    case 'investment':
    case 'isa':
    case 'stocks_and_shares_isa':
      return C.forest;
    case 'credit':
    case 'loan':
      return C.terracotta;
    case 'liability':
      return C.dustyRose;
    default:
      return C.sage;
  }
}

// ── Recharts custom tooltip ───────────────────────────────────────────────────
function BloomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background:   C.cardBg,
        border:       `1px solid rgba(232,213,196,0.6)`,
        borderRadius: 16,
        padding:      '10px 16px',
        boxShadow:    `0 4px 20px rgba(44,32,24,0.1)`,
        fontFamily:   FONT_BODY,
        fontSize:     13,
        color:        C.text,
      }}
    >
      <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: C.forest }}>{formatCurrency(payload[0].value)}</div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonBlock({ height, borderRadius = 24 }: { height: number; borderRadius?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius,
        background: `linear-gradient(90deg, rgba(232,213,196,0.4) 0%, rgba(232,213,196,0.7) 50%, rgba(232,213,196,0.4) 100%)`,
        backgroundSize: '200% 100%',
        animation: 'bloomShimmer 1.8s ease-in-out infinite',
      }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard10Page() {
  const location = useLocation();
  const { user, logout, authStatus } = useAuthStore();

  // Inject fonts + blob keyframes once
  useEffect(() => {
    const fontId = 'dashboard10-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id  = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@400;600;700&display=swap';
      document.head.appendChild(link);
    }

    const styleId = 'bloom-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes blob1 {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        @keyframes blob2 {
          0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          50%       { border-radius: 60% 40% 30% 70% / 60% 40% 70% 30%; }
        }
        @keyframes blob3 {
          0%, 100% { border-radius: 50% 50% 40% 60% / 30% 60% 40% 70%; }
          50%       { border-radius: 40% 60% 60% 40% / 60% 30% 60% 40%; }
        }
        @keyframes bloomShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardService.getSummary(),
    enabled:  authStatus === 'authenticated',
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-net-worth-trend'],
    queryFn:  () => dashboardService.getNetWorthTrend(6),
    enabled:  authStatus === 'authenticated',
  });

  // ── Derived values ───────────────────────────────────────────────────────────
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
  const netFlow          = monthlyIncome - monthlyExpense;

  const chartData =
    trendData?.trend?.map((p) => ({
      label: p.month ? format(new Date(`${p.month}-01`), 'MMM') : '',
      value: p.netWorth ?? (p.cash ?? p.balance ?? 0) + (p.assets ?? 0) - (p.liabilities ?? 0),
    })) ?? [{ label: 'Now', value: netWorth }];

  const maxCategory = topCategories.reduce((m, c) => Math.max(m, c.amount), 0) || 1;

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  // ── Shared card style ────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background:   C.cardBg,
    borderRadius: 28,
    padding:      28,
    boxShadow:    '0 2px 20px rgba(44,32,24,0.06)',
    border:       `1px solid rgba(232,213,196,0.5)`,
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position:   'fixed',
        top:        '64px',
        left:       0,
        right:      0,
        bottom:     0,
        zIndex:     10,
        overflowY:  'auto',
        overflowX:  'hidden',
        background: C.bg,
        fontFamily: FONT_BODY,
        color:      C.text,
      }}
    >
      {/* ── Animated blob backgrounds ─────────────────────────────────── */}
      <div
        style={{
          position:   'absolute',
          width:      500,
          height:     500,
          top:        -100,
          left:       -150,
          background: 'rgba(139,175,138,0.25)',
          animation:  'blob1 8s ease-in-out infinite',
          filter:     'blur(40px)',
          zIndex:     0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position:   'absolute',
          width:      400,
          height:     400,
          top:        200,
          right:      -100,
          background: 'rgba(212,165,165,0.2)',
          animation:  'blob2 10s ease-in-out infinite 2s',
          filter:     'blur(50px)',
          zIndex:     0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position:   'absolute',
          width:      350,
          height:     350,
          bottom:     100,
          left:       '30%',
          background: 'rgba(196,149,106,0.15)',
          animation:  'blob3 12s ease-in-out infinite 4s',
          filter:     'blur(45px)',
          zIndex:     0,
          pointerEvents: 'none',
        }}
      />

      {/* ── All content above blobs ──────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Floating pill navigation ──────────────────────────────────── */}
        <div
          style={{
            position:       'sticky',
            top:            16,
            zIndex:         100,
            display:        'flex',
            justifyContent: 'center',
            padding:        '16px 0',
          }}
        >
          <div
            style={{
              display:         'inline-flex',
              gap:             4,
              background:      'rgba(255,255,255,0.7)',
              backdropFilter:  'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius:    100,
              padding:         '8px 16px',
              border:          '1px solid rgba(255,255,255,0.9)',
              boxShadow:       '0 4px 24px rgba(44,32,24,0.08)',
              alignItems:      'center',
            }}
          >
            {navItems.map(({ label, href, Icon }) => {
              const isActive =
                location.pathname === href ||
                (href === '/dashboard' && location.pathname === '/dashboard10');
              return (
                <Link
                  key={href}
                  to={href}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             6,
                    padding:         '6px 14px',
                    borderRadius:    100,
                    textDecoration:  'none',
                    fontSize:        13,
                    fontWeight:      isActive ? 700 : 400,
                    color:           isActive ? '#FEFCF9' : C.textMuted,
                    background:      isActive ? C.forest : 'transparent',
                    transition:      'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    whiteSpace:      'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.color = C.forest;
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(74,103,65,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.color = C.textMuted;
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={13} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>

          {/* ── Hero — Net Worth ──────────────────────────────────────── */}
          <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
            <div
              style={{
                fontFamily:  FONT_DISPLAY,
                fontStyle:   'italic',
                fontSize:    16,
                color:       C.textMuted,
                marginBottom: 16,
                letterSpacing: '0.02em',
              }}
            >
              Your financial garden
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <SkeletonBlock height={72} borderRadius={20} />
                <SkeletonBlock height={20} borderRadius={100} />
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontFamily:    FONT_BODY,
                    fontWeight:    700,
                    fontSize:      72,
                    color:         C.forest,
                    lineHeight:    1,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {formatCurrency(netWorth)}
                </div>

                <div
                  style={{
                    fontFamily:  FONT_BODY,
                    fontSize:    14,
                    color:       C.textMuted,
                    marginTop:   20,
                    display:     'flex',
                    justifyContent: 'center',
                    alignItems:  'center',
                    gap:         12,
                    flexWrap:    'wrap',
                  }}
                >
                  <span>🌱 Assets: <strong style={{ color: C.forest }}>{formatCurrency(totalAssets + totalCash)}</strong></span>
                  <span style={{ color: C.textLight }}>•</span>
                  <span>Liabilities: <strong style={{ color: C.terracotta }}>{formatCurrency(totalLiabilities)}</strong></span>
                </div>
              </>
            )}

            {/* Organic divider */}
            <div
              style={{
                borderBottom: `2px solid rgba(139,175,138,0.3)`,
                margin:       '28px auto 0',
                maxWidth:     480,
              }}
            />
          </div>

          {/* ── This Month — 3 cards ─────────────────────────────────────── */}
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 16,
              marginBottom:        32,
            }}
          >
            {isLoading ? (
              <>
                <SkeletonBlock height={140} />
                <SkeletonBlock height={140} />
                <SkeletonBlock height={140} />
              </>
            ) : (
              <>
                {/* Income */}
                <div style={cardStyle}>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize:   20,
                      fontWeight: 600,
                      color:      C.text,
                      marginBottom: 10,
                    }}
                  >
                    Income
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontWeight: 700,
                      fontSize:   36,
                      color:      C.forest,
                      lineHeight: 1.1,
                    }}
                  >
                    {formatCurrency(monthlyIncome)}
                  </div>
                  <div
                    style={{
                      fontFamily:  FONT_BODY,
                      fontSize:    12,
                      color:       C.textLight,
                      marginTop:   8,
                    }}
                  >
                    This month
                  </div>
                </div>

                {/* Expenses */}
                <div style={cardStyle}>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize:   20,
                      fontWeight: 600,
                      color:      C.text,
                      marginBottom: 10,
                    }}
                  >
                    Expenses
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontWeight: 700,
                      fontSize:   36,
                      color:      C.terracotta,
                      lineHeight: 1.1,
                    }}
                  >
                    {formatCurrency(monthlyExpense)}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize:   12,
                      color:      C.textLight,
                      marginTop:  8,
                    }}
                  >
                    This month
                  </div>
                </div>

                {/* Net Flow */}
                <div style={cardStyle}>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize:   20,
                      fontWeight: 600,
                      color:      C.text,
                      marginBottom: 10,
                    }}
                  >
                    Net Flow
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontWeight: 700,
                      fontSize:   36,
                      color:      netFlow >= 0 ? C.forest : C.dustyRose,
                      lineHeight: 1.1,
                    }}
                  >
                    {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize:   12,
                      color:      netFlow >= 0 ? C.sage : C.dustyRose,
                      marginTop:  8,
                      fontWeight: 600,
                    }}
                  >
                    {netFlow >= 0 ? 'Positive flow' : 'Spending more than earning'}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Accounts — 2-column grid ──────────────────────────────────── */}
          <div
            style={{
              ...cardStyle,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontFamily:   FONT_DISPLAY,
                fontSize:     22,
                fontWeight:   600,
                color:        C.text,
                marginBottom: 20,
              }}
            >
              Accounts
            </div>

            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[1,2,3,4].map((k) => <SkeletonBlock key={k} height={72} borderRadius={20} />)}
              </div>
            ) : accounts.length === 0 ? (
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMuted }}>
                No accounts yet. Add your first account to get started.
              </p>
            ) : (
              <div
                style={{
                  display:             'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap:                 12,
                }}
              >
                {accounts.map((account) => {
                  const dotColor  = getAccountDotColor(account.type);
                  const typeLabel = ACCOUNT_TYPE_LABELS[account.type] ?? account.type.replace(/_/g, ' ');
                  const isNegative = account.balance < 0;
                  return (
                    <div
                      key={account.id}
                      style={{
                        display:         'flex',
                        justifyContent:  'space-between',
                        alignItems:      'center',
                        background:      `rgba(254,252,249,0.8)`,
                        border:          `1px solid rgba(232,213,196,0.4)`,
                        borderRadius:    20,
                        padding:         '16px 20px',
                        transition:      'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        cursor:          'default',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(44,32,24,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width:           10,
                            height:          10,
                            borderRadius:    '50%',
                            background:      dotColor,
                            flexShrink:      0,
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontFamily: FONT_BODY,
                              fontWeight: 600,
                              fontSize:   14,
                              color:      C.text,
                            }}
                          >
                            {account.name}
                          </div>
                          <div
                            style={{
                              fontFamily:  FONT_BODY,
                              fontSize:    11,
                              color:       C.textLight,
                              marginTop:   2,
                              textTransform: 'capitalize',
                            }}
                          >
                            {typeLabel}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: FONT_BODY,
                          fontWeight: 700,
                          fontSize:   16,
                          color:      isNegative ? C.terracotta : C.text,
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

          {/* ── Spending & Trends — 2-column ──────────────────────────────── */}
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: '60% 1fr',
              gap:                 16,
              marginBottom:        32,
            }}
          >
            {/* Where it goes */}
            <div style={cardStyle}>
              <div
                style={{
                  fontFamily:   FONT_DISPLAY,
                  fontSize:     22,
                  fontWeight:   600,
                  color:        C.text,
                  marginBottom: 20,
                }}
              >
                Where it goes
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3,4].map((k) => <SkeletonBlock key={k} height={36} borderRadius={100} />)}
                </div>
              ) : topCategories.length === 0 ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMuted }}>
                  No spending data available yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topCategories.map((cat) => {
                    const pct = Math.min((cat.amount / maxCategory) * 100, 100);
                    return (
                      <div key={cat.category?.name ?? cat.amount}>
                        <div
                          style={{
                            display:        'flex',
                            justifyContent: 'space-between',
                            alignItems:     'center',
                            marginBottom:   6,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize:   13,
                              fontWeight: 600,
                              color:      C.text,
                            }}
                          >
                            {cat.category?.name ?? 'Other'}
                          </span>
                          <span
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize:   13,
                              fontWeight: 700,
                              color:      C.terracotta,
                            }}
                          >
                            {formatCurrency(cat.amount)}
                          </span>
                        </div>
                        {/* Organic progress track */}
                        <div
                          style={{
                            height:       8,
                            borderRadius: 100,
                            background:   'rgba(139,175,138,0.15)',
                            overflow:     'hidden',
                          }}
                        >
                          <div
                            style={{
                              width:        `${pct}%`,
                              height:       '100%',
                              borderRadius: 100,
                              background:   pct > 75
                                ? C.terracotta
                                : pct > 50
                                ? C.sage
                                : C.forest,
                              opacity:      0.7 + (pct / 100) * 0.3,
                              transition:   'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Net worth trend */}
            <div style={cardStyle}>
              <div
                style={{
                  fontFamily:   FONT_DISPLAY,
                  fontSize:     22,
                  fontWeight:   600,
                  color:        C.text,
                  marginBottom: 20,
                }}
              >
                Net worth trend
              </div>

              {isLoading ? (
                <SkeletonBlock height={180} borderRadius={20} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontFamily: FONT_BODY, fontSize: 11, fill: C.textLight }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip content={<BloomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={C.sage}
                      strokeWidth={2.5}
                      dot={{ fill: C.forest, r: 4, strokeWidth: 0 }}
                      activeDot={{ fill: C.forest, r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Recent Transactions ───────────────────────────────────────── */}
          <div style={cardStyle}>
            <div
              style={{
                fontFamily:   FONT_DISPLAY,
                fontSize:     22,
                fontWeight:   600,
                color:        C.text,
                marginBottom: 16,
              }}
            >
              Recent Transactions
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3,4,5].map((k) => <SkeletonBlock key={k} height={52} borderRadius={16} />)}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMuted }}>
                No transactions yet. Add your first transaction to get started.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentTransactions.map((tx, idx) => {
                  const isIncome  = tx.type === 'income';
                  const dotColor  = isIncome ? C.sage : C.terracotta;
                  const amountColor = isIncome ? C.forest : C.terracotta;
                  const isEven    = idx % 2 === 0;
                  return (
                    <div
                      key={tx.id}
                      style={{
                        display:         'flex',
                        alignItems:      'center',
                        gap:             14,
                        padding:         '12px 20px',
                        borderRadius:    16,
                        background:      isEven ? '#FFFFFF' : 'rgba(232,213,196,0.2)',
                        transition:      'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        cursor:          'default',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = `rgba(139,175,138,0.12)`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = isEven
                          ? '#FFFFFF'
                          : 'rgba(232,213,196,0.2)';
                      }}
                    >
                      {/* Dot */}
                      <div
                        style={{
                          width:           9,
                          height:          9,
                          borderRadius:    '50%',
                          background:      dotColor,
                          flexShrink:      0,
                        }}
                      />

                      {/* Description */}
                      <div
                        style={{
                          flex:         1,
                          fontFamily:   FONT_BODY,
                          fontSize:     14,
                          fontWeight:   600,
                          color:        C.text,
                          overflow:     'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace:   'nowrap',
                        }}
                      >
                        {tx.description}
                      </div>

                      {/* Category pill */}
                      {tx.category && (
                        <span
                          style={{
                            fontFamily:      FONT_BODY,
                            fontSize:        11,
                            fontWeight:      600,
                            color:           tx.category.color || C.textMuted,
                            background:      `${tx.category.color || '#888'}18`,
                            padding:         '3px 10px',
                            borderRadius:    100,
                            flexShrink:      0,
                            whiteSpace:      'nowrap',
                          }}
                        >
                          {tx.category.name}
                        </span>
                      )}

                      {/* Date */}
                      <div
                        style={{
                          fontFamily: FONT_BODY,
                          fontSize:   12,
                          color:      C.textLight,
                          flexShrink: 0,
                          minWidth:   40,
                          textAlign:  'right',
                        }}
                      >
                        {format(new Date(tx.date), 'd MMM')}
                      </div>

                      {/* Amount */}
                      <div
                        style={{
                          fontFamily: FONT_BODY,
                          fontWeight: 700,
                          fontSize:   15,
                          color:      amountColor,
                          flexShrink: 0,
                          minWidth:   90,
                          textAlign:  'right',
                        }}
                      >
                        {isIncome ? '+' : '–'}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div
            style={{
              textAlign:   'center',
              paddingTop:  40,
              fontFamily:  FONT_DISPLAY,
              fontStyle:   'italic',
              fontSize:    16,
              color:       C.textMuted,
              letterSpacing: '0.01em',
            }}
          >
            Tend to your finances, {firstName}. Small steps grow into gardens.
          </div>

        </div>
      </div>
    </div>
  );
}
