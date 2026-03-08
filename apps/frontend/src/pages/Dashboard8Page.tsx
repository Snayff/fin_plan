import React, { useEffect, useState } from 'react';
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

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '#FFFFFF',
  black:   '#0A0A0A',
  accent:  '#CAFF00', // electric lime
  muted:   '#888888',
  border:  '#0A0A0A',
  income:  '#1A5C2A',
  expense: '#8B1A1A',
  stripe:  '#F5F5F5',
};

// ── Typography ────────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Anton', Impact, sans-serif";
const FONT_MONO    = "'Space Mono', 'Courier New', monospace";

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'DASHBOARD',    href: '/dashboard',    Icon: LayoutDashboard },
  { label: 'ACCOUNTS',     href: '/accounts',     Icon: CreditCard },
  { label: 'TRANSACTIONS', href: '/transactions', Icon: ArrowRightLeft },
  { label: 'ASSETS',       href: '/assets',       Icon: Building },
  { label: 'LIABILITIES',  href: '/liabilities',  Icon: Landmark },
  { label: 'BUDGET',       href: '/budget',       Icon: PiggyBank },
  { label: 'GOALS',        href: '/goals',        Icon: Target },
];

// ── Account type labels ───────────────────────────────────────────────────────
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  current:               'CURRENT',
  savings:               'SAVINGS',
  isa:                   'ISA',
  stocks_and_shares_isa: 'S&S ISA',
  credit:                'CREDIT',
  investment:            'INVEST',
  loan:                  'LOAN',
  asset:                 'ASSET',
  liability:             'LIABILITY',
};

// ── Skeleton block ────────────────────────────────────────────────────────────
function SkeletonBlock({ height, width = '100%' }: { height: number | string; width?: number | string }) {
  return (
    <div
      style={{
        height,
        width,
        backgroundColor: '#D8D8D8',
        display: 'block',
      }}
    />
  );
}

// ── Shared label style ────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontFamily:    FONT_MONO,
  fontSize:      11,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color:         C.muted,
  marginBottom:  8,
};

// ── Section border helper ─────────────────────────────────────────────────────
const SECTION_BORDER = `4px solid ${C.black}`;

export default function Dashboard8Page() {
  const location = useLocation();

  // ── Google Fonts ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = 'dashboard8-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id   = id;
      link.rel  = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardService.getSummary(),
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-net-worth-trend'],
    queryFn:  () => dashboardService.getNetWorthTrend(6),
  });

  const summary             = summaryData?.summary;
  const accounts            = summaryData?.accounts            || [];
  const recentTransactions  = summaryData?.recentTransactions  || [];

  const netWorth        = summary?.netWorth        ?? 0;
  const totalAssets     = summary?.totalAssets     ?? 0;
  const totalLiabilities = summary?.totalLiabilities ?? 0;
  const monthlyIncome   = summary?.monthlyIncome   ?? 0;
  const monthlyExpenses = summary?.monthlyExpenses ?? summary?.monthlyExpense ?? 0;
  const netCashFlow     = monthlyIncome - monthlyExpenses;
  const isPositive      = netWorth >= 0;

  const chartPoints = trendData?.trend?.map((p) => ({
    month:    p.month,
    netWorth: p.netWorth ?? 0,
  })) || [];

  // ── Row hover state ───────────────────────────────────────────────────────
  const [hoveredAccount, setHoveredAccount]     = useState<number | null>(null);
  const [hoveredTx, setHoveredTx]               = useState<number | null>(null);

  // ── Nav link hover state ──────────────────────────────────────────────────
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const isLoading = !summaryData;

  return (
    <div
      style={{
        position:        'fixed',
        top:             '64px',
        left:            0,
        right:           0,
        bottom:          0,
        zIndex:          10,
        overflowY:       'auto',
        fontFamily:      FONT_MONO,
        backgroundColor: C.bg,
        color:           C.black,
      }}
    >
      {/* ── TOP NAV BAR ─────────────────────────────────────────────────── */}
      <nav
        style={{
          position:       'sticky',
          top:            0,
          zIndex:         100,
          height:         56,
          backgroundColor: C.bg,
          borderBottom:   SECTION_BORDER,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 32px',
          gap:            24,
        }}
      >
        {/* Brand */}
        <div
          style={{
            fontFamily:    FONT_DISPLAY,
            fontSize:      20,
            letterSpacing: '0.04em',
            whiteSpace:    'nowrap',
            flexShrink:    0,
          }}
        >
          THE LEDGER
        </div>

        {/* Nav links */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            24,
            flex:           1,
            justifyContent: 'center',
            overflow:       'hidden',
          }}
        >
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const isActive =
              location.pathname === href ||
              (href === '/dashboard' && location.pathname === '/dashboard8');
            const isHovered = hoveredNav === href;
            return (
              <Link
                key={href}
                to={href}
                onMouseEnter={() => setHoveredNav(href)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            6,
                  fontFamily:     FONT_MONO,
                  fontSize:       11,
                  fontWeight:     700,
                  letterSpacing:  '0.15em',
                  textDecoration: 'none',
                  color:          isActive ? C.black : isHovered ? C.black : C.muted,
                  backgroundColor: isActive
                    ? C.accent
                    : isHovered
                    ? C.accent
                    : 'transparent',
                  padding:        '4px 8px',
                  whiteSpace:     'nowrap',
                  transition:     'background-color 0.1s, color 0.1s',
                }}
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Date */}
        <div
          style={{
            fontFamily:    FONT_MONO,
            fontSize:      11,
            letterSpacing: '0.1em',
            color:         C.muted,
            whiteSpace:    'nowrap',
            flexShrink:    0,
          }}
        >
          {format(new Date(), 'dd.MM.yyyy')}
        </div>
      </nav>

      {/* ── HEADLINE ZONE — NET WORTH ────────────────────────────────────── */}
      <section
        style={{
          padding:      '48px 48px 40px',
          borderBottom: SECTION_BORDER,
          backgroundColor: C.bg,
        }}
      >
        <div style={labelStyle}>Net Worth</div>

        {isLoading ? (
          <SkeletonBlock height={100} width={400} />
        ) : (
          <>
            <div
              style={{
                display:         'inline-block',
                fontFamily:      FONT_DISPLAY,
                fontSize:        'clamp(72px, 10vw, 140px)',
                lineHeight:      1,
                color:           C.black,
                backgroundColor: isPositive ? C.accent : 'transparent',
                padding:         isPositive ? '0 16px' : '0',
                letterSpacing:   '0.01em',
              }}
            >
              {formatCurrency(netWorth)}
            </div>

            <div
              style={{
                marginTop:   20,
                fontFamily:  FONT_MONO,
                fontSize:    13,
                letterSpacing: '0.05em',
                color:       C.muted,
                display:     'flex',
                gap:         32,
                flexWrap:    'wrap',
              }}
            >
              <span>
                <span style={{ color: C.income, fontWeight: 700 }}>+</span>
                {' ASSETS '}
                <span style={{ color: C.black, fontWeight: 700 }}>
                  {formatCurrency(totalAssets)}
                </span>
              </span>
              <span>
                <span style={{ color: C.expense, fontWeight: 700 }}>—</span>
                {' LIABILITIES '}
                <span style={{ color: C.black, fontWeight: 700 }}>
                  {formatCurrency(totalLiabilities)}
                </span>
              </span>
            </div>
          </>
        )}
      </section>

      {/* ── MONTHLY SECTION — 3-column grid ─────────────────────────────── */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom:        SECTION_BORDER,
        }}
      >
        {/* INCOME */}
        <div
          style={{
            padding:     '36px 40px',
            borderRight: SECTION_BORDER,
          }}
        >
          <div style={labelStyle}>Income This Month</div>
          {isLoading ? (
            <SkeletonBlock height={56} width={200} />
          ) : (
            <>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize:   'clamp(36px, 4vw, 56px)',
                  lineHeight: 1,
                  color:      C.income,
                }}
              >
                {formatCurrency(monthlyIncome)}
              </div>
              <div
                style={{
                  marginTop:   12,
                  fontFamily:  FONT_MONO,
                  fontSize:    11,
                  letterSpacing: '0.2em',
                  color:       C.muted,
                  textTransform: 'uppercase',
                }}
              >
                This period
              </div>
            </>
          )}
        </div>

        {/* EXPENSES */}
        <div
          style={{
            padding:     '36px 40px',
            borderRight: SECTION_BORDER,
          }}
        >
          <div style={labelStyle}>Expenses This Month</div>
          {isLoading ? (
            <SkeletonBlock height={56} width={200} />
          ) : (
            <>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize:   'clamp(36px, 4vw, 56px)',
                  lineHeight: 1,
                  color:      C.expense,
                }}
              >
                {formatCurrency(monthlyExpenses)}
              </div>
              <div
                style={{
                  marginTop:   12,
                  fontFamily:  FONT_MONO,
                  fontSize:    11,
                  letterSpacing: '0.2em',
                  color:       C.muted,
                  textTransform: 'uppercase',
                }}
              >
                This period
              </div>
            </>
          )}
        </div>

        {/* NET CASH FLOW */}
        <div
          style={{
            padding: '36px 40px',
          }}
        >
          <div style={labelStyle}>Net Cash Flow</div>
          {isLoading ? (
            <SkeletonBlock height={56} width={200} />
          ) : (
            <>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize:   'clamp(36px, 4vw, 56px)',
                  lineHeight: 1,
                  color:      netCashFlow >= 0 ? C.income : C.expense,
                }}
              >
                {netCashFlow < 0 ? '-' : '+'}
                {formatCurrency(Math.abs(netCashFlow))}
              </div>
              <div
                style={{
                  marginTop:   12,
                  fontFamily:  FONT_MONO,
                  fontSize:    11,
                  letterSpacing: '0.2em',
                  color:       C.muted,
                  textTransform: 'uppercase',
                }}
              >
                {netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ACCOUNTS TABLE ───────────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: SECTION_BORDER,
        }}
      >
        {/* Table header bar */}
        <div
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
            padding:         '20px 40px',
            borderBottom:    `2px solid ${C.black}`,
            backgroundColor: C.bg,
          }}
        >
          <div
            style={{
              fontFamily:    FONT_MONO,
              fontSize:      11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color:         C.muted,
            }}
          >
            Accounts
          </div>
          <div
            style={{
              fontFamily:  FONT_DISPLAY,
              fontSize:    20,
              letterSpacing: '0.04em',
            }}
          >
            {accounts.length} TOTAL
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: '1fr 160px 160px',
            padding:             '10px 40px',
            borderBottom:        `2px solid ${C.black}`,
            backgroundColor:     C.black,
          }}
        >
          {['ACCOUNT NAME', 'TYPE', 'BALANCE'].map((col) => (
            <div
              key={col}
              style={{
                fontFamily:    FONT_MONO,
                fontSize:      10,
                letterSpacing: '0.3em',
                color:         C.accent,
                textAlign:     col === 'BALANCE' ? 'right' : 'left',
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonBlock key={i} height={36} />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div
            style={{
              padding:    '32px 40px',
              fontFamily: FONT_MONO,
              fontSize:   13,
              color:      C.muted,
              letterSpacing: '0.05em',
            }}
          >
            NO ACCOUNTS FOUND. ADD AN ACCOUNT TO GET STARTED.
          </div>
        ) : (
          accounts.map((account, idx) => {
            const isHovered = hoveredAccount === idx;
            const isOdd     = idx % 2 !== 0;
            return (
              <div
                key={account.id ?? idx}
                onMouseEnter={() => setHoveredAccount(idx)}
                onMouseLeave={() => setHoveredAccount(null)}
                style={{
                  display:             'grid',
                  gridTemplateColumns: '1fr 160px 160px',
                  padding:             '14px 40px',
                  backgroundColor:     isHovered
                    ? C.accent
                    : isOdd
                    ? C.stripe
                    : C.bg,
                  borderBottom:        `1px solid #D0D0D0`,
                  cursor:              'default',
                  transition:          'background-color 0.08s',
                }}
              >
                <div
                  style={{
                    fontFamily:    FONT_MONO,
                    fontSize:      13,
                    fontWeight:    700,
                    color:         C.black,
                    letterSpacing: '0.02em',
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                    whiteSpace:    'nowrap',
                  }}
                >
                  {account.name}
                </div>
                <div
                  style={{
                    fontFamily:    FONT_MONO,
                    fontSize:      11,
                    letterSpacing: '0.15em',
                    color:         C.muted,
                    textTransform: 'uppercase',
                  }}
                >
                  {ACCOUNT_TYPE_LABELS[account.type] || account.type?.toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily:  FONT_MONO,
                    fontSize:    13,
                    fontWeight:  700,
                    color:       account.balance < 0 ? C.expense : C.black,
                    textAlign:   'right',
                  }}
                >
                  {formatCurrency(account.balance, getCurrencySymbol(account.currency))}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ── NET WORTH TREND ──────────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: SECTION_BORDER,
        }}
      >
        <div
          style={{
            padding:      '20px 40px',
            borderBottom: `2px solid ${C.black}`,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={labelStyle}>Net Worth Trend</div>
          <div
            style={{
              fontFamily:    FONT_MONO,
              fontSize:      10,
              letterSpacing: '0.2em',
              color:         C.muted,
              textTransform: 'uppercase',
            }}
          >
            6 months
          </div>
        </div>

        <div style={{ padding: '24px 32px 16px', backgroundColor: C.bg }}>
          {isLoading || chartPoints.length === 0 ? (
            <SkeletonBlock height={240} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartPoints} margin={{ top: 8, right: 0, left: 0, bottom: 8 }}>
                <XAxis
                  dataKey="month"
                  tick={{
                    fontFamily:    FONT_MONO,
                    fontSize:      10,
                    letterSpacing: '0.1em',
                    fill:          C.muted,
                  }}
                  axisLine={{ stroke: C.black, strokeWidth: 2 }}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: C.black,
                    border:          'none',
                    fontFamily:      FONT_MONO,
                    fontSize:        12,
                    color:           C.accent,
                    letterSpacing:   '0.05em',
                    borderRadius:    0,
                  }}
                  labelStyle={{ color: C.muted, fontSize: 10 }}
                  formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke={C.black}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r:           5,
                    fill:        C.accent,
                    stroke:      C.black,
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── RECENT TRANSACTIONS ──────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: SECTION_BORDER,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:         '20px 40px',
            borderBottom:    `2px solid ${C.black}`,
            backgroundColor: C.bg,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
          }}
        >
          <div style={labelStyle}>Recent Activity</div>
          <Link
            to="/transactions"
            style={{
              fontFamily:     FONT_MONO,
              fontSize:       10,
              letterSpacing:  '0.2em',
              color:          C.muted,
              textDecoration: 'none',
              textTransform:  'uppercase',
            }}
          >
            ALL TRANSACTIONS →
          </Link>
        </div>

        {/* Column header row */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: '120px 1fr 160px',
            padding:             '10px 40px',
            borderBottom:        `2px solid ${C.black}`,
            backgroundColor:     C.black,
          }}
        >
          {['DATE', 'DESCRIPTION', 'AMOUNT'].map((col) => (
            <div
              key={col}
              style={{
                fontFamily:    FONT_MONO,
                fontSize:      10,
                letterSpacing: '0.3em',
                color:         C.accent,
                textAlign:     col === 'AMOUNT' ? 'right' : 'left',
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} height={32} />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div
            style={{
              padding:       '32px 40px',
              fontFamily:    FONT_MONO,
              fontSize:      13,
              color:         C.muted,
              letterSpacing: '0.05em',
            }}
          >
            NO TRANSACTIONS YET.
          </div>
        ) : (
          recentTransactions.slice(0, 10).map((tx, idx) => {
            const isHovered  = hoveredTx === idx;
            const isOdd      = idx % 2 !== 0;
            const isIncome   = tx.type === 'income' || tx.amount > 0;
            const amount     = tx.amount;
            const absAmount  = Math.abs(amount);

            return (
              <div
                key={tx.id ?? idx}
                onMouseEnter={() => setHoveredTx(idx)}
                onMouseLeave={() => setHoveredTx(null)}
                style={{
                  display:             'grid',
                  gridTemplateColumns: '120px 1fr 160px',
                  alignItems:          'center',
                  padding:             '13px 40px',
                  backgroundColor:     isHovered
                    ? C.accent
                    : isOdd
                    ? C.stripe
                    : C.bg,
                  borderBottom:        `1px solid #D0D0D0`,
                  cursor:              'default',
                  transition:          'background-color 0.08s',
                }}
              >
                {/* Date */}
                <div
                  style={{
                    fontFamily:    FONT_MONO,
                    fontSize:      11,
                    letterSpacing: '0.1em',
                    color:         C.muted,
                  }}
                >
                  {tx.date ? format(new Date(tx.date), 'dd MMM yyyy') : '—'}
                </div>

                {/* Description + category */}
                <div
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        12,
                    overflow:   'hidden',
                  }}
                >
                  <span
                    style={{
                      fontFamily:    FONT_MONO,
                      fontSize:      13,
                      fontWeight:    700,
                      color:         C.black,
                      letterSpacing: '0.02em',
                      overflow:      'hidden',
                      textOverflow:  'ellipsis',
                      whiteSpace:    'nowrap',
                    }}
                  >
                    {tx.description || 'Unnamed transaction'}
                  </span>
                  {(tx.categoryName || tx.category?.name) && (
                    <span
                      style={{
                        fontFamily:    FONT_MONO,
                        fontSize:      9,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color:         C.muted,
                        border:        `1px solid #CCCCCC`,
                        padding:       '2px 6px',
                        whiteSpace:    'nowrap',
                        flexShrink:    0,
                      }}
                    >
                      {tx.categoryName || tx.category?.name}
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div
                  style={{
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {isIncome ? (
                    <span
                      style={{
                        display:         'inline-block',
                        fontFamily:      FONT_MONO,
                        fontSize:        13,
                        fontWeight:      700,
                        color:           C.black,
                        backgroundColor: C.accent,
                        padding:         '2px 8px',
                        letterSpacing:   '0.02em',
                      }}
                    >
                      +{formatCurrency(absAmount)}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontFamily:    FONT_MONO,
                        fontSize:      13,
                        fontWeight:    700,
                        color:         C.expense,
                        letterSpacing: '0.02em',
                      }}
                    >
                      -{formatCurrency(absAmount)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          padding:         '20px 40px',
          backgroundColor: C.black,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
        }}
      >
        <div
          style={{
            fontFamily:    FONT_DISPLAY,
            fontSize:      16,
            letterSpacing: '0.08em',
            color:         C.accent,
          }}
        >
          THE LEDGER
        </div>
        <div
          style={{
            fontFamily:    FONT_MONO,
            fontSize:      10,
            letterSpacing: '0.2em',
            color:         C.muted,
            textTransform: 'uppercase',
          }}
        >
          Money confronted head-on.
        </div>
      </footer>
    </div>
  );
}
