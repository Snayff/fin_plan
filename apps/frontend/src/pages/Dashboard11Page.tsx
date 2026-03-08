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
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:         '#0D1117',
  sidebar:    '#0A0D12',
  panel:      '#111827',
  gold:       '#C9A84C',
  goldLight:  '#E8C96A',
  goldDim:    'rgba(201, 168, 76, 0.3)',
  champagne:  '#F5F0E8',
  navy:       '#1A2436',
  text:       '#F5F0E8',
  textMuted:  '#8B8077',
  textDim:    '#5A5450',
  redMuted:   '#8B4049',
} as const;

const PIE_COLORS = ['#C9A84C', '#E8C96A', '#8B7035', '#A08040', '#D4AE6E'];

// ── Fonts ────────────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Bodoni Moda', Georgia, serif";
const FONT_UI      = "'Josefin Sans', system-ui, sans-serif";

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',    Icon: LayoutDashboard },
  { label: 'Accounts',     href: '/accounts',     Icon: CreditCard       },
  { label: 'Transactions', href: '/transactions', Icon: ArrowRightLeft   },
  { label: 'Assets',       href: '/assets',       Icon: Building         },
  { label: 'Liabilities',  href: '/liabilities',  Icon: Landmark         },
  { label: 'Budget',       href: '/budget',       Icon: PiggyBank        },
  { label: 'Goals',        href: '/goals',        Icon: Target           },
];

// ── Small reusable pieces ─────────────────────────────────────────────────────

/** Decorative Art-Deco diamond divider */
function GoldDivider() {
  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        12,
        margin:     '32px 0',
      }}
    >
      <div style={{ flex: 1, height: 1, background: C.goldDim }} />
      <span style={{ color: C.gold, fontSize: 12 }}>◆</span>
      <div style={{ flex: 1, height: 1, background: C.goldDim }} />
    </div>
  );
}

/** Thin decorative line with a centre diamond dot */
function CentreLine() {
  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        8,
        margin:     '12px 0',
      }}
    >
      <div style={{ flex: 1, height: 1, background: C.goldDim }} />
      <div
        style={{
          width:     4,
          height:    4,
          background: C.gold,
          transform: 'rotate(45deg)',
        }}
      />
      <div style={{ flex: 1, height: 1, background: C.goldDim }} />
    </div>
  );
}

/** Section header with gold left-border accent */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily:    FONT_DISPLAY,
        fontSize:      20,
        fontWeight:    600,
        color:         C.champagne,
        borderLeft:    `3px solid ${C.gold}`,
        paddingLeft:   14,
        marginBottom:  24,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </div>
  );
}

/** Gold-cornered stat card */
function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  const cornerStyle: React.CSSProperties = {
    position: 'absolute',
    width:    20,
    height:   20,
  };
  return (
    <div
      style={{
        background: C.panel,
        border:     `1px solid ${C.goldDim}`,
        padding:    '24px 28px',
        position:   'relative',
        flex:       1,
      }}
    >
      {/* Top-left L bracket */}
      <div
        style={{
          ...cornerStyle,
          top:        0,
          left:       0,
          borderTop:  `2px solid ${C.gold}`,
          borderLeft: `2px solid ${C.gold}`,
        }}
      />
      {/* Top-right L bracket */}
      <div
        style={{
          ...cornerStyle,
          top:         0,
          right:       0,
          borderTop:   `2px solid ${C.gold}`,
          borderRight: `2px solid ${C.gold}`,
        }}
      />
      {/* Bottom-left L bracket */}
      <div
        style={{
          ...cornerStyle,
          bottom:     0,
          left:       0,
          borderBottom: `2px solid ${C.gold}`,
          borderLeft:   `2px solid ${C.gold}`,
        }}
      />
      {/* Bottom-right L bracket */}
      <div
        style={{
          ...cornerStyle,
          bottom:      0,
          right:       0,
          borderBottom: `2px solid ${C.gold}`,
          borderRight:  `2px solid ${C.gold}`,
        }}
      />

      <div
        style={{
          fontFamily:    FONT_UI,
          fontSize:      10,
          letterSpacing: '0.3em',
          color:         C.textDim,
          textTransform: 'uppercase',
          marginBottom:  12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize:   32,
          fontWeight: 600,
          color:      valueColor,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/** ── Ornamental SVG emblem ─────────────────────────────────────────────────── */
function MeridianEmblem() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" style={{ display: 'block', margin: '0 auto' }}>
      {/* Center diamond */}
      <polygon
        points="60,15 80,40 60,65 40,40"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="1"
      />
      {/* Inner diamond */}
      <polygon
        points="60,25 72,40 60,55 48,40"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="0.5"
        opacity="0.6"
      />
      {/* Top lines with dots */}
      <line x1="10" y1="8" x2="50" y2="8" stroke="#C9A84C" strokeWidth="0.8" />
      <circle cx="10" cy="8" r="2" fill="#C9A84C" />
      <line x1="70" y1="8" x2="110" y2="8" stroke="#C9A84C" strokeWidth="0.8" />
      <circle cx="110" cy="8" r="2" fill="#C9A84C" />
      {/* Bottom lines with dots */}
      <line x1="10" y1="72" x2="50" y2="72" stroke="#C9A84C" strokeWidth="0.8" />
      <circle cx="10" cy="72" r="2" fill="#C9A84C" />
      <line x1="70" y1="72" x2="110" y2="72" stroke="#C9A84C" strokeWidth="0.8" />
      <circle cx="110" cy="72" r="2" fill="#C9A84C" />
      {/* Side triangles */}
      <polygon points="22,40 30,35 30,45" fill="#C9A84C" opacity="0.6" />
      <polygon points="98,40 90,35 90,45" fill="#C9A84C" opacity="0.6" />
    </svg>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ height = 60, width = '100%' }: { height?: number; width?: string | number }) {
  return (
    <div
      style={{
        height,
        width,
        background:     C.panel,
        border:         `1px solid ${C.goldDim}`,
        borderRadius:   0,
        marginBottom:   8,
      }}
    />
  );
}

// ── Custom recharts tooltip ───────────────────────────────────────────────────
function GoldTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  const firstPoint = payload?.[0];
  if (!active || !firstPoint) return null;
  return (
    <div
      style={{
        background:  C.panel,
        border:      `1px solid ${C.goldDim}`,
        padding:     '8px 14px',
        fontFamily:  FONT_UI,
        fontSize:    12,
        color:       C.gold,
        letterSpacing: '0.1em',
      }}
    >
      {formatCurrency(firstPoint.value)}
    </div>
  );
}

// ── Account type label ────────────────────────────────────────────────────────
function accountTypeLabel(type: string) {
  const MAP: Record<string, string> = {
    current:              'CURRENT',
    savings:              'SAVINGS',
    isa:                  'ISA',
    stocks_and_shares_isa:'S&S ISA',
    credit:               'CREDIT',
    investment:           'INVESTMENT',
    loan:                 'LOAN',
    asset:                'ASSET',
    liability:            'LIABILITY',
  };
  return MAP[type] ?? type.toUpperCase();
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard11Page() {
  const location = useLocation();
  const { user } = useAuthStore();

  // Inject fonts + keyframe animation
  useEffect(() => {
    const fontId = 'meridian-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id   = fontId;
      link.rel  = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Josefin+Sans:wght@300;400;600&display=swap';
      document.head.appendChild(link);
    }

    const styleId = 'meridian-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardService.getSummary(),
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-net-worth-trend'],
    queryFn:  () => dashboardService.getNetWorthTrend(6),
  });

  const summary            = data?.summary;
  const accounts           = data?.accounts           ?? [];
  const recentTransactions = data?.recentTransactions ?? [];
  const topCategories      = data?.topCategories      ?? [];

  const totalAssets      = summary?.totalAssets      ?? 0;
  const totalLiabilities = summary?.totalLiabilities ?? 0;
  const totalCash        = summary?.totalCash        ?? summary?.totalBalance ?? 0;
  const netWorth         = totalCash + totalAssets - totalLiabilities;
  const monthlyIncome    = summary?.monthlyIncome    ?? 0;
  const monthlyExpense   = summary?.monthlyExpense   ?? 0;
  const netCashFlow      = monthlyIncome - monthlyExpense;

  const netWorthChartData =
    trendData?.trend?.map((point) => ({
      date:     point.month,
      netWorth: point.netWorth ?? (point.cash ?? 0) + (point.assets ?? 0) - (point.liabilities ?? 0),
    })) ?? [{ date: format(new Date(), 'yyyy-MM'), netWorth }];

  const pieData = topCategories.map((item) => ({
    name:  item.category?.name ?? 'Other',
    value: item.amount,
  }));

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const sidebar: React.CSSProperties = {
    background:     C.sidebar,
    borderRight:    `1px solid ${C.goldDim}`,
    position:       'fixed',
    left:           0,
    top:            0,
    bottom:         0,
    width:          240,
    display:        'flex',
    flexDirection:  'column',
    height:         '100vh',
    zIndex:         20,
  };

  // ── Art-deco background ───────────────────────────────────────────────────
  const decoBg: React.CSSProperties = {
    backgroundImage: [
      'repeating-linear-gradient(45deg,  rgba(201,168,76,0.04) 0px, rgba(201,168,76,0.04) 1px, transparent 1px, transparent 20px)',
      'repeating-linear-gradient(-45deg, rgba(201,168,76,0.04) 0px, rgba(201,168,76,0.04) 1px, transparent 1px, transparent 20px)',
    ].join(', '),
    backgroundSize: '28px 28px',
  };

  return (
    <div
      style={{
        display:    'flex',
        minHeight:  '100vh',
        background: C.bg,
        ...decoBg,
        fontFamily: FONT_UI,
        color:      C.text,
        position:   'fixed',
        top:        '64px',
        left:       0,
        right:      0,
        bottom:     0,
        zIndex:     10,
        overflow:   'hidden',
      }}
    >
      {/* ──────────────── SIDEBAR ──────────────── */}
      <aside style={sidebar}>
        {/* Emblem + wordmark */}
        <div
          style={{
            padding:      '28px 0 20px',
            textAlign:    'center',
            borderBottom: `1px solid ${C.goldDim}`,
          }}
        >
          <MeridianEmblem />
          <div
            style={{
              fontFamily:    FONT_UI,
              fontSize:      11,
              letterSpacing: '0.4em',
              color:         C.gold,
              marginTop:     10,
              fontWeight:    600,
            }}
          >
            MERIDIAN
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '24px 0' }}>
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const isActive =
              location.pathname === href ||
              (href === '/dashboard' && location.pathname === '/dashboard11');
            return (
              <Link
                key={href}
                to={href}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  gap:             10,
                  padding:         '10px 24px',
                  textDecoration:  'none',
                  fontFamily:      FONT_UI,
                  fontSize:        12,
                  fontWeight:      isActive ? 600 : 400,
                  letterSpacing:   '0.2em',
                  textTransform:   'uppercase',
                  color:           isActive ? C.gold : C.textMuted,
                  background:      isActive ? 'rgba(201,168,76,0.05)' : 'transparent',
                  borderLeft:      isActive ? `3px solid ${C.gold}` : '3px solid transparent',
                  transition:      'all 0.15s ease',
                }}
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — private client badge */}
        <div style={{ borderTop: `1px solid ${C.goldDim}`, padding: '20px 24px' }}>
          <div
            style={{
              fontFamily:    FONT_UI,
              fontSize:      10,
              letterSpacing: '0.3em',
              color:         C.textDim,
              textTransform: 'uppercase',
              marginBottom:  6,
            }}
          >
            Private Client
          </div>
          <div
            style={{
              fontFamily:   FONT_UI,
              fontSize:     13,
              color:        C.textMuted,
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.name ?? user?.email ?? 'Client'}
          </div>
        </div>
      </aside>

      {/* ──────────────── MAIN CONTENT ──────────────── */}
      <main
        style={{
          marginLeft: 240,
          flex:       1,
          overflowY:  'auto',
          padding:    '48px 52px',
          minWidth:   0,
          animation:  'fadeIn 0.8s ease',
        }}
      >
        {/* ── SECTION 1: NET WORTH HERO ── */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div
            style={{
              fontFamily:    FONT_UI,
              fontSize:      10,
              letterSpacing: '0.4em',
              color:         C.textMuted,
              textTransform: 'uppercase',
              marginBottom:  4,
            }}
          >
            Total Portfolio Value
          </div>

          <CentreLine />

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <Skeleton height={80} width={360} />
            </div>
          ) : (
            <div
              style={{
                fontFamily:  FONT_DISPLAY,
                fontSize:    72,
                fontWeight:  700,
                color:       C.champagne,
                lineHeight:  1,
                animation:   'fadeIn 0.8s ease',
              }}
            >
              {formatCurrency(netWorth)}
            </div>
          )}

          <CentreLine />

          <div
            style={{
              fontFamily:    FONT_UI,
              fontSize:      13,
              color:         C.textMuted,
              letterSpacing: '0.1em',
              marginTop:     8,
            }}
          >
            ASSETS{' '}
            <span style={{ color: C.goldLight, fontFamily: FONT_DISPLAY }}>
              {formatCurrency(totalAssets)}
            </span>
            {'  '}
            <span style={{ color: C.gold }}>◆</span>
            {'  '}
            LIABILITIES{' '}
            <span style={{ color: C.textMuted, fontFamily: FONT_DISPLAY }}>
              {formatCurrency(totalLiabilities)}
            </span>
          </div>
        </div>

        <GoldDivider />

        {/* ── SECTION 2: STATS ROW ── */}
        {isLoading ? (
          <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
            <Skeleton height={110} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 8 }}>
            <StatCard
              label="Monthly Income"
              value={formatCurrency(monthlyIncome)}
              valueColor={C.goldLight}
            />

            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                padding:        '0 16px',
                color:          C.gold,
                fontSize:       16,
                flexShrink:     0,
                userSelect:     'none',
              }}
            >
              ◆
            </div>

            <StatCard
              label="Monthly Expenses"
              value={formatCurrency(monthlyExpense)}
              valueColor={C.champagne}
            />

            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                padding:    '0 16px',
                color:      C.gold,
                fontSize:   16,
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              ◆
            </div>

            <StatCard
              label="Net Cash Flow"
              value={formatCurrency(Math.abs(netCashFlow))}
              valueColor={netCashFlow >= 0 ? C.gold : C.redMuted}
            />
          </div>
        )}

        <GoldDivider />

        {/* ── SECTION 3: CHARTS ── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1fr',
            gap:                 28,
            marginBottom:        8,
          }}
        >
          {/* Left: Net Worth Trajectory */}
          <div
            style={{
              background: C.panel,
              border:     `1px solid ${C.goldDim}`,
              padding:    '28px 24px',
              position:   'relative',
            }}
          >
            {/* Corner accents */}
            {[
              { top: 0, left: 0,   borderTop: `2px solid ${C.gold}`, borderLeft:  `2px solid ${C.gold}` },
              { top: 0, right: 0,  borderTop: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}` },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
            ))}

            <div
              style={{
                fontFamily:    FONT_UI,
                fontSize:      10,
                letterSpacing: '0.3em',
                color:         C.textDim,
                textTransform: 'uppercase',
                marginBottom:  20,
              }}
            >
              Net Worth Trajectory
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={netWorthChartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.gold} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.gold} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontFamily: FONT_UI, fontSize: 10, fill: C.textDim, letterSpacing: '0.05em' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<GoldTooltip />} />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke={C.gold}
                  strokeWidth={2}
                  fill="url(#goldGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Asset Allocation */}
          <div
            style={{
              background: C.panel,
              border:     `1px solid ${C.goldDim}`,
              padding:    '28px 24px',
              position:   'relative',
            }}
          >
            {[
              { top: 0, left: 0,  borderTop: `2px solid ${C.gold}`, borderLeft:  `2px solid ${C.gold}` },
              { top: 0, right: 0, borderTop: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}` },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
            ))}

            <div
              style={{
                fontFamily:    FONT_UI,
                fontSize:      10,
                letterSpacing: '0.3em',
                color:         C.textDim,
                textTransform: 'uppercase',
                marginBottom:  20,
              }}
            >
              Asset Allocation
            </div>

            {pieData.length === 0 ? (
              <div
                style={{
                  height:         200,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  color:          C.textDim,
                  fontFamily:     FONT_UI,
                  fontSize:       12,
                  letterSpacing:  '0.1em',
                }}
              >
                NO DATA
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background:  C.panel,
                      border:      `1px solid ${C.goldDim}`,
                      fontFamily:  FONT_UI,
                      fontSize:    12,
                      color:       C.gold,
                      borderRadius: 0,
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <GoldDivider />

        {/* ── SECTION 4: ACCOUNTS LEDGER ── */}
        <SectionHeader>Accounts Ledger</SectionHeader>

        <div
          style={{
            background: C.panel,
            border:     `1px solid ${C.goldDim}`,
            padding:    '0 28px',
            position:   'relative',
            marginBottom: 8,
          }}
        >
          {/* Corner accents */}
          {[
            { top: 0, left: 0,    borderTop:    `2px solid ${C.gold}`, borderLeft:   `2px solid ${C.gold}` },
            { top: 0, right: 0,   borderTop:    `2px solid ${C.gold}`, borderRight:  `2px solid ${C.gold}` },
            { bottom: 0, left: 0, borderBottom: `2px solid ${C.gold}`, borderLeft:   `2px solid ${C.gold}` },
            { bottom: 0, right: 0,borderBottom: `2px solid ${C.gold}`, borderRight:  `2px solid ${C.gold}` },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
          ))}

          {/* Column headers */}
          <div
            style={{
              display:       'grid',
              gridTemplateColumns: '1fr 160px 160px',
              padding:       '16px 0',
              borderBottom:  `1px solid ${C.goldDim}`,
            }}
          >
            {['Institution', 'Type', 'Balance'].map((col) => (
              <div
                key={col}
                style={{
                  fontFamily:    FONT_UI,
                  fontSize:      10,
                  letterSpacing: '0.25em',
                  color:         C.gold,
                  textTransform: 'uppercase',
                  textAlign:     col === 'Balance' ? 'right' : 'left',
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: '16px 0' }}>
              {[1, 2, 3].map((n) => <Skeleton key={n} height={44} />)}
            </div>
          ) : accounts.length === 0 ? (
            <div
              style={{
                padding:       '32px 0',
                textAlign:     'center',
                fontFamily:    FONT_UI,
                fontSize:      12,
                letterSpacing: '0.2em',
                color:         C.textDim,
              }}
            >
              NO ACCOUNTS ON RECORD
            </div>
          ) : (
            accounts.map((account, idx) => (
              <div
                key={account.id}
                style={{
                  display:             'grid',
                  gridTemplateColumns: '1fr 160px 160px',
                  padding:             '14px 0',
                  borderBottom:
                    idx < accounts.length - 1
                      ? '1px solid rgba(201,168,76,0.1)'
                      : 'none',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily:    FONT_UI,
                    fontSize:      13,
                    color:         C.champagne,
                    fontWeight:    400,
                    letterSpacing: '0.05em',
                  }}
                >
                  {account.name}
                </div>
                <div
                  style={{
                    fontFamily:    FONT_UI,
                    fontSize:      10,
                    letterSpacing: '0.2em',
                    color:         C.textMuted,
                  }}
                >
                  {accountTypeLabel(account.type)}
                </div>
                <div
                  style={{
                    fontFamily:  FONT_DISPLAY,
                    fontSize:    16,
                    fontWeight:  600,
                    color:       account.balance < 0 ? C.redMuted : C.gold,
                    textAlign:   'right',
                  }}
                >
                  {formatCurrency(account.balance, getCurrencySymbol(account.currency))}
                </div>
              </div>
            ))
          )}
        </div>

        <GoldDivider />

        {/* ── SECTION 5: RECENT TRANSACTIONS ── */}
        <SectionHeader>Recent Transactions</SectionHeader>

        <div
          style={{
            background:   C.panel,
            border:       `1px solid ${C.goldDim}`,
            padding:      '0 28px',
            position:     'relative',
            marginBottom: 48,
          }}
        >
          {/* Corner accents */}
          {[
            { top: 0, left: 0,    borderTop:    `2px solid ${C.gold}`, borderLeft:   `2px solid ${C.gold}` },
            { top: 0, right: 0,   borderTop:    `2px solid ${C.gold}`, borderRight:  `2px solid ${C.gold}` },
            { bottom: 0, left: 0, borderBottom: `2px solid ${C.gold}`, borderLeft:   `2px solid ${C.gold}` },
            { bottom: 0, right: 0,borderBottom: `2px solid ${C.gold}`, borderRight:  `2px solid ${C.gold}` },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
          ))}

          {/* Column headers */}
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: '100px 1fr 120px',
              padding:             '16px 0',
              borderBottom:        `1px solid ${C.goldDim}`,
            }}
          >
            {['Date', 'Description', 'Amount'].map((col) => (
              <div
                key={col}
                style={{
                  fontFamily:    FONT_UI,
                  fontSize:      10,
                  letterSpacing: '0.25em',
                  color:         C.gold,
                  textTransform: 'uppercase',
                  textAlign:     col === 'Amount' ? 'right' : 'left',
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: '16px 0' }}>
              {[1, 2, 3, 4].map((n) => <Skeleton key={n} height={48} />)}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div
              style={{
                padding:       '32px 0',
                textAlign:     'center',
                fontFamily:    FONT_UI,
                fontSize:      12,
                letterSpacing: '0.2em',
                color:         C.textDim,
              }}
            >
              NO TRANSACTIONS ON RECORD
            </div>
          ) : (
            recentTransactions.slice(0, 8).map((tx, idx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  style={{
                    display:             'grid',
                    gridTemplateColumns: '100px 1fr 120px',
                    padding:             '14px 0',
                    borderBottom:
                      idx < Math.min(recentTransactions.length, 8) - 1
                        ? '1px solid rgba(201,168,76,0.1)'
                        : 'none',
                    alignItems: 'center',
                  }}
                >
                  {/* Date + indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        color:    isIncome ? C.gold : C.textDim,
                        lineHeight: 1,
                      }}
                    >
                      {isIncome ? '▲' : '▼'}
                    </span>
                    <span
                      style={{
                        fontFamily:    FONT_UI,
                        fontSize:      11,
                        color:         C.textDim,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {format(new Date(tx.date), 'd MMM yyyy')}
                    </span>
                  </div>

                  {/* Description */}
                  <div
                    style={{
                      fontFamily:    FONT_DISPLAY,
                      fontSize:      14,
                      color:         C.champagne,
                      overflow:      'hidden',
                      textOverflow:  'ellipsis',
                      whiteSpace:    'nowrap',
                      paddingRight:  16,
                    }}
                  >
                    {tx.description}
                  </div>

                  {/* Amount */}
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize:   15,
                      fontWeight: 600,
                      color:      isIncome ? C.gold : C.textMuted,
                      textAlign:  'right',
                    }}
                  >
                    {isIncome ? '+' : '−'}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer inscription */}
        <div
          style={{
            textAlign:     'center',
            paddingBottom: 24,
            fontFamily:    FONT_DISPLAY,
            fontStyle:     'italic',
            fontSize:      14,
            color:         C.textDim,
            letterSpacing: '0.05em',
          }}
        >
          Wealth is not an accident — it is a discipline.
        </div>
      </main>
    </div>
  );
}
