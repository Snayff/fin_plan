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
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

// ── Palette ─────────────────────────────────────────────────────────────────
const P = {
  bg:           '#060918',
  text:         '#F0F4FF',
  textMuted:    'rgba(240,244,255,0.5)',
  glass:        'rgba(255,255,255,0.07)',
  glassBorder:  'rgba(255,255,255,0.12)',
  glassHover:   'rgba(255,255,255,0.11)',
  teal:         '#0EA5E9',
  violet:       '#8B5CF6',
  violetLight:  '#A78BFA',
  rose:         '#F43F5E',
};

const PIE_COLORS = ['#0EA5E9', '#8B5CF6', '#F43F5E', '#A78BFA', '#38BDF8', '#C084FC'];

// ── Fonts ────────────────────────────────────────────────────────────────────
const SORA    = "'Sora', system-ui, sans-serif";
const FIGTREE = "'Figtree', system-ui, sans-serif";

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',    Icon: LayoutDashboard },
  { label: 'Accounts',     href: '/accounts',     Icon: CreditCard       },
  { label: 'Transactions', href: '/transactions', Icon: ArrowRightLeft   },
  { label: 'Assets',       href: '/assets',       Icon: Building         },
  { label: 'Liabilities',  href: '/liabilities',  Icon: Landmark         },
  { label: 'Budget',       href: '/budget',       Icon: PiggyBank        },
  { label: 'Goals',        href: '/goals',        Icon: Target           },
];

// ── Glass panel style ────────────────────────────────────────────────────────
const glassPanel: React.CSSProperties = {
  background:              'rgba(255,255,255,0.07)',
  backdropFilter:          'blur(24px)',
  WebkitBackdropFilter:    'blur(24px)',
  border:                  '1px solid rgba(255,255,255,0.12)',
  boxShadow:               '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
  borderRadius:            '20px',
};

// ── Account type → orb colour ────────────────────────────────────────────────
function accountDotColor(type: string): string {
  if (['savings', 'current', 'isa'].includes(type)) return P.teal;
  if (['investment', 'stocks_and_shares_isa'].includes(type)) return P.violetLight;
  return P.rose;
}

// ── Shimmer block ────────────────────────────────────────────────────────────
function Shimmer({ width = '100%', height = 16, radius = 8 }: { width?: string | number; height?: number; radius?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
        backgroundSize: '200% 100%',
        animation: 'aetherShimmer 1.6s ease-in-out infinite',
      }}
    />
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function AetherTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        ...glassPanel,
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 12,
        fontFamily: FIGTREE,
        color: P.text,
        pointerEvents: 'none',
      }}
    >
      <div style={{ color: P.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ color: P.violetLight, fontFamily: SORA, fontWeight: 600 }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
}

// ── Pie tooltip ───────────────────────────────────────────────────────────────
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        ...glassPanel,
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 12,
        fontFamily: FIGTREE,
        color: P.text,
        pointerEvents: 'none',
      }}
    >
      <div style={{ color: P.textMuted, marginBottom: 2 }}>{payload[0].name}</div>
      <div style={{ color: P.teal, fontFamily: SORA, fontWeight: 600 }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard12Page() {
  const location = useLocation();
  const { user, logout, authStatus } = useAuthStore();

  // ── Font & keyframe injection ─────────────────────────────────────────────
  useEffect(() => {
    // Fonts
    const fontId = 'dashboard12-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id   = fontId;
      link.rel  = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=Figtree:wght@400;500;600&display=swap';
      document.head.appendChild(link);
    }

    // Keyframes
    const kfId = 'aether-keyframes';
    if (!document.getElementById(kfId)) {
      const style = document.createElement('style');
      style.id = kfId;
      style.textContent = `
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.1)} 66%{transform:translate(-30px,60px) scale(0.9)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-80px,30px) scale(1.05)} 66%{transform:translate(40px,-70px) scale(0.95)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,80px) scale(0.92)} 66%{transform:translate(-60px,-30px) scale(1.08)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes aetherShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardService.getSummary(),
    enabled:  authStatus === 'authenticated',
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-net-worth-trend'],
    queryFn:  () => dashboardService.getNetWorthTrend(6),
    enabled:  authStatus === 'authenticated',
  });

  // ── Derived values ────────────────────────────────────────────────────────
  const summary            = summaryData?.summary;
  const accounts           = summaryData?.accounts           ?? [];
  const recentTransactions = summaryData?.recentTransactions ?? [];
  const topCategories      = summaryData?.topCategories      ?? [];

  const totalCash        = summary?.totalCash ?? summary?.totalBalance ?? 0;
  const totalAssets      = summary?.totalAssets      ?? 0;
  const totalLiabilities = summary?.totalLiabilities ?? 0;
  const netWorth         = totalCash + totalAssets - totalLiabilities;
  const monthlyIncome    = summary?.monthlyIncome  ?? 0;
  const monthlyExpense   = summary?.monthlyExpense ?? 0;
  const delta            = monthlyIncome - monthlyExpense;

  const chartTrend = trendData?.trend?.map((p) => ({
    month:    p.month,
    netWorth: p.netWorth ?? (p.cash ?? p.balance ?? 0) + (p.assets ?? 0) - (p.liabilities ?? 0),
  })) ?? [];

  const pieData = topCategories.map((item) => ({
    name:  item.category?.name ?? 'Unknown',
    value: item.amount,
  }));

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.charAt(0).toUpperCase() ?? 'U');

  const isActive = (href: string) =>
    location.pathname === href || (href === '/dashboard' && location.pathname === '/dashboard12');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position:   'relative',
        minHeight:  '100vh',
        background: P.bg,
        overflow:   'hidden',
        fontFamily: FIGTREE,
        color:      P.text,
      }}
    >
      {/* ── Orb 1 — Teal, top-left ─────────────────────────────────────── */}
      <div
        style={{
          width:        '600px',
          height:       '600px',
          position:     'absolute',
          top:          '-200px',
          left:         '-150px',
          borderRadius: '50%',
          background:   '#0EA5E9',
          opacity:       0.35,
          filter:       'blur(120px)',
          animation:    'float1 18s ease-in-out infinite',
          pointerEvents:'none',
          zIndex:        0,
        }}
      />
      {/* ── Orb 2 — Violet, top-right ──────────────────────────────────── */}
      <div
        style={{
          width:        '700px',
          height:       '700px',
          position:     'absolute',
          top:          '100px',
          right:        '-200px',
          borderRadius: '50%',
          background:   '#8B5CF6',
          opacity:       0.3,
          filter:       'blur(120px)',
          animation:    'float2 22s ease-in-out infinite 3s',
          pointerEvents:'none',
          zIndex:        0,
        }}
      />
      {/* ── Orb 3 — Rose, bottom-center ────────────────────────────────── */}
      <div
        style={{
          width:        '500px',
          height:       '500px',
          position:     'absolute',
          bottom:       '-100px',
          left:         '30%',
          borderRadius: '50%',
          background:   '#F43F5E',
          opacity:       0.25,
          filter:       'blur(120px)',
          animation:    'float3 20s ease-in-out infinite 7s',
          pointerEvents:'none',
          zIndex:        0,
        }}
      />

      {/* ── All content above orbs ─────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100vh' }}>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          style={{
            width:               220,
            minWidth:            220,
            position:            'fixed',
            left:                0,
            top:                 0,
            height:              '100vh',
            display:             'flex',
            flexDirection:       'column',
            background:          'rgba(255,255,255,0.07)',
            backdropFilter:      'blur(24px)',
            WebkitBackdropFilter:'blur(24px)',
            borderRight:         '1px solid rgba(255,255,255,0.1)',
            boxShadow:           '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            zIndex:              10,
            overflowY:           'auto',
            overflowX:           'hidden',
          }}
        >
          {/* App label */}
          <div
            style={{
              padding:       '32px 24px 0',
              fontFamily:    SORA,
              fontWeight:    300,
              fontSize:      11,
              letterSpacing: '0.4em',
              color:         P.textMuted,
              textTransform: 'uppercase',
            }}
          >
            AETHER
          </div>

          {/* Net worth hero in sidebar */}
          <div style={{ padding: '20px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div
              style={{
                fontFamily:    FIGTREE,
                fontSize:      10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color:         P.textMuted,
                marginBottom:  6,
              }}
            >
              TOTAL NET WORTH
            </div>
            <div
              style={{
                fontFamily: SORA,
                fontWeight: 600,
                fontSize:   '28px',
                color:      P.text,
                lineHeight: 1.15,
              }}
            >
              {summary ? formatCurrency(netWorth) : <Shimmer width={130} height={28} />}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 0' }}>
            {NAV_ITEMS.map(({ label, href, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  to={href}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            10,
                    padding:        '10px 24px',
                    cursor:         'pointer',
                    textDecoration: 'none',
                    fontFamily:     FIGTREE,
                    fontSize:       '14px',
                    fontWeight:     active ? 600 : 400,
                    color:          active ? P.text : P.textMuted,
                    background:     active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    boxShadow:      active ? 'inset 3px 0 0 rgba(139,92,246,0.8)' : 'none',
                    borderRadius:   active ? '0 10px 10px 0' : '10px',
                    margin:         active ? '2px 12px 2px 0' : '2px 12px',
                    paddingLeft:    active ? 24 : undefined,
                    transition:     'background 0.15s, color 0.15s',
                  }}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.75} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div
            style={{
              padding:    '16px 20px 24px',
              borderTop:  '1px solid rgba(255,255,255,0.08)',
              display:    'flex',
              alignItems: 'center',
              gap:        10,
            }}
          >
            {/* Initials circle */}
            <div
              style={{
                width:               36,
                height:              36,
                borderRadius:        '50%',
                background:          'rgba(255,255,255,0.07)',
                backdropFilter:      'blur(24px)',
                WebkitBackdropFilter:'blur(24px)',
                border:              '1px solid rgba(255,255,255,0.12)',
                boxShadow:           '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                display:             'flex',
                alignItems:          'center',
                justifyContent:      'center',
                fontFamily:          SORA,
                fontWeight:          600,
                fontSize:            '13px',
                color:               P.text,
                flexShrink:          0,
              }}
            >
              {userInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize:     13,
                  fontWeight:   500,
                  color:        P.text,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                  fontFamily:   FIGTREE,
                }}
              >
                {user?.name ?? user?.email ?? 'User'}
              </div>
              <button
                onClick={() => void logout()}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        5,
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  fontSize:   11,
                  color:      P.textMuted,
                  padding:    '2px 0 0',
                  fontFamily: FIGTREE,
                }}
              >
                <LogOut size={11} />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main
          style={{
            marginLeft: 220,
            padding:    '32px',
            display:    'flex',
            flexDirection:'column',
            gap:        '24px',
            flex:       1,
            minWidth:   0,
            boxSizing:  'border-box',
          }}
        >

          {/* ── ROW 1 — Hero ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

            {/* Left — Net worth hero */}
            <div style={{ ...glassPanel, flex: 1.5, padding: '32px', minWidth: 280 }}>
              {/* Label */}
              <div
                style={{
                  fontFamily:    FIGTREE,
                  fontSize:      11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color:         P.textMuted,
                  marginBottom:  8,
                }}
              >
                YOUR NET WORTH
              </div>

              {/* Big number */}
              {summary ? (
                <div
                  style={{
                    fontFamily: SORA,
                    fontWeight: 700,
                    fontSize:   '54px',
                    color:      P.text,
                    lineHeight: 1,
                    animation:  'fadeSlideUp 0.6s ease both',
                    marginBottom: 12,
                  }}
                >
                  {formatCurrency(netWorth)}
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <Shimmer width={280} height={54} radius={10} />
                </div>
              )}

              {/* Monthly delta */}
              <div style={{ marginBottom: 20, fontSize: 13, fontFamily: FIGTREE, color: delta >= 0 ? P.teal : P.rose }}>
                {summary ? (
                  <>
                    {delta >= 0 ? '+' : ''}{formatCurrency(Math.abs(delta))} this month
                  </>
                ) : (
                  <Shimmer width={140} height={13} />
                )}
              </div>

              {/* Stat chips */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* Assets chip */}
                <div
                  style={{
                    background:   'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding:      '10px 16px',
                    border:       '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {summary ? (
                    <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 16, color: P.teal, marginBottom: 3 }}>
                      {formatCurrency(totalAssets + totalCash)}
                    </div>
                  ) : (
                    <Shimmer width={90} height={16} />
                  )}
                  <div style={{ fontFamily: FIGTREE, fontSize: 10, color: P.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    ASSETS
                  </div>
                </div>
                {/* Liabilities chip */}
                <div
                  style={{
                    background:   'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding:      '10px 16px',
                    border:       '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {summary ? (
                    <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 16, color: P.rose, marginBottom: 3 }}>
                      {formatCurrency(totalLiabilities)}
                    </div>
                  ) : (
                    <Shimmer width={90} height={16} />
                  )}
                  <div style={{ fontFamily: FIGTREE, fontSize: 10, color: P.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    LIABILITIES
                  </div>
                </div>
              </div>
            </div>

            {/* Right — This Month */}
            <div style={{ ...glassPanel, flex: 1, padding: '32px', minWidth: 200 }}>
              <div
                style={{
                  fontFamily:    FIGTREE,
                  fontSize:      11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color:         P.textMuted,
                  marginBottom:  20,
                }}
              >
                THIS MONTH
              </div>

              {/* Income */}
              <div style={{ marginBottom: 4 }}>
                {summary ? (
                  <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 30, color: P.teal, lineHeight: 1.1 }}>
                    {formatCurrency(monthlyIncome)}
                  </div>
                ) : (
                  <Shimmer width={160} height={30} radius={8} />
                )}
                <div style={{ fontFamily: FIGTREE, fontSize: 11, color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                  INCOME
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

              {/* Expenses */}
              <div>
                {summary ? (
                  <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 30, color: P.rose, lineHeight: 1.1 }}>
                    {formatCurrency(monthlyExpense)}
                  </div>
                ) : (
                  <Shimmer width={160} height={30} radius={8} />
                )}
                <div style={{ fontFamily: FIGTREE, fontSize: 11, color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                  EXPENSES
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2 — Charts ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

            {/* Net worth trend */}
            <div style={{ ...glassPanel, flex: 2, padding: '24px', minWidth: 300, boxSizing: 'border-box' }}>
              <div
                style={{
                  fontFamily:    FIGTREE,
                  fontSize:      11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color:         P.textMuted,
                  marginBottom:  16,
                }}
              >
                NET WORTH TREND
              </div>

              {chartTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartTrend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aetherGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: 'rgba(240,244,255,0.5)', fontSize: 11, fontFamily: FIGTREE }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <Tooltip content={<AetherTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stroke="rgba(167,139,250,0.8)"
                      strokeWidth={2}
                      fill="url(#aetherGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: P.violetLight, stroke: 'none' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                  <Shimmer height={140} radius={8} />
                  <Shimmer width="70%" height={11} />
                </div>
              )}
            </div>

            {/* Spending donut */}
            <div style={{ ...glassPanel, flex: 1, padding: '24px', minWidth: 220, boxSizing: 'border-box' }}>
              <div
                style={{
                  fontFamily:    FIGTREE,
                  fontSize:      11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color:         P.textMuted,
                  marginBottom:  16,
                }}
              >
                SPENDING
              </div>

              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            opacity={0.9}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                    {pieData.slice(0, 5).map((entry, idx) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width:        8,
                            height:       8,
                            borderRadius: '50%',
                            background:   PIE_COLORS[idx % PIE_COLORS.length],
                            flexShrink:   0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily:   FIGTREE,
                            fontSize:     11,
                            color:        P.textMuted,
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace:   'nowrap',
                            flex:         1,
                          }}
                        >
                          {entry.name}
                        </span>
                        <span style={{ fontFamily: SORA, fontSize: 11, color: P.text, flexShrink: 0 }}>
                          {formatCurrency(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
                    <Shimmer width={160} height={160} radius={80} />
                  </div>
                  <Shimmer width="80%" height={11} />
                  <Shimmer width="65%" height={11} />
                  <Shimmer width="55%" height={11} />
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 3 — Accounts + Transactions ─────────────────────────── */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

            {/* Accounts */}
            <div style={{ ...glassPanel, flex: 1, padding: '24px', minWidth: 240, boxSizing: 'border-box' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span
                  style={{
                    fontFamily:    FIGTREE,
                    fontSize:      11,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color:         P.textMuted,
                  }}
                >
                  ACCOUNTS
                </span>
                {accounts.length > 0 && (
                  <span
                    style={{
                      borderRadius: '100px',
                      background:   'rgba(255,255,255,0.08)',
                      padding:      '2px 10px',
                      fontSize:     11,
                      fontFamily:   FIGTREE,
                      color:        P.textMuted,
                    }}
                  >
                    {accounts.length}
                  </span>
                )}
              </div>

              {/* Account list */}
              {accounts.length === 0 && !summaryData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[100, 80, 90, 75].map((w, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px' }}>
                      <Shimmer width={`${w}%`} height={14} />
                    </div>
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <p style={{ fontFamily: FIGTREE, fontSize: 13, color: P.textMuted }}>
                  No accounts yet.
                </p>
              ) : (
                accounts.slice(0, 7).map((account) => {
                  const dotColor = accountDotColor(account.type);
                  return (
                    <div
                      key={account.id}
                      style={{
                        background:     'rgba(255,255,255,0.04)',
                        borderRadius:   12,
                        padding:        '12px 16px',
                        marginBottom:   8,
                        display:        'flex',
                        justifyContent: 'space-between',
                        alignItems:     'center',
                        cursor:         'default',
                        transition:     'background 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width:        8,
                            height:       8,
                            borderRadius: '50%',
                            background:   dotColor,
                            flexShrink:   0,
                            boxShadow:    `0 0 6px ${dotColor}`,
                          }}
                        />
                        <span
                          style={{
                            fontFamily:   FIGTREE,
                            fontSize:     14,
                            color:        P.text,
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace:   'nowrap',
                          }}
                        >
                          {account.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily:  FIGTREE,
                          fontWeight:  600,
                          fontSize:    14,
                          color:       account.balance < 0 ? P.rose : P.teal,
                          flexShrink:  0,
                          marginLeft:  8,
                        }}
                      >
                        {formatCurrency(account.balance, getCurrencySymbol(account.currency))}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Recent transactions */}
            <div style={{ ...glassPanel, flex: 1.5, padding: '24px', minWidth: 300, boxSizing: 'border-box' }}>
              <div
                style={{
                  fontFamily:    FIGTREE,
                  fontSize:      11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color:         P.textMuted,
                  marginBottom:  16,
                }}
              >
                RECENT ACTIVITY
              </div>

              {recentTransactions.length === 0 && !summaryData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[100, 85, 92, 78, 88, 70, 95, 80].map((w, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        <Shimmer width={`${w}%`} height={13} />
                        <Shimmer width="40%" height={10} />
                      </div>
                      <Shimmer width={70} height={16} />
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <p style={{ fontFamily: FIGTREE, fontSize: 13, color: P.textMuted }}>
                  No transactions yet.
                </p>
              ) : (
                recentTransactions.slice(0, 8).map((tx) => {
                  const isIncome  = tx.type === 'income';
                  const dotColor  = isIncome ? P.teal : P.rose;
                  const amtColor  = isIncome ? P.teal : P.rose;
                  const desc      = tx.description.length > 25
                    ? `${tx.description.slice(0, 25)}…`
                    : tx.description;

                  return (
                    <div
                      key={tx.id}
                      style={{
                        background:     'rgba(255,255,255,0.04)',
                        borderRadius:   12,
                        padding:        '12px 16px',
                        marginBottom:   8,
                        display:        'flex',
                        justifyContent: 'space-between',
                        alignItems:     'center',
                        cursor:         'default',
                        transition:     'background 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                      {/* Left */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width:        8,
                            height:       8,
                            borderRadius: '50%',
                            background:   dotColor,
                            flexShrink:   0,
                            boxShadow:    `0 0 6px ${dotColor}`,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily:   FIGTREE,
                              fontSize:     14,
                              color:        P.text,
                              overflow:     'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace:   'nowrap',
                            }}
                          >
                            {desc}
                          </div>
                          <div
                            style={{
                              fontFamily: FIGTREE,
                              fontSize:   11,
                              color:      P.textMuted,
                              marginTop:  2,
                            }}
                          >
                            {format(new Date(tx.date), 'd MMM yyyy')}
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <span
                        style={{
                          fontFamily: SORA,
                          fontWeight: 600,
                          fontSize:   14,
                          color:      amtColor,
                          flexShrink: 0,
                          marginLeft: 12,
                        }}
                      >
                        {isIncome ? '+' : '–'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
