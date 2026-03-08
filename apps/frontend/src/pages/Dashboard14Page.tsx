import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency } from '../lib/utils';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0A0A',
  primary: '#F5F0E8',
  secondary: '#9A9490',
  accent: '#C17A2A',
  expense: '#B85C4A',
  rule: 'rgba(245,240,232,0.08)',
  panelBg: '#111111',
} as const;

// ─── Nav items ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Assets', href: '/assets' },
  { label: 'Liabilities', href: '/liabilities' },
  { label: 'Budget', href: '/budget' },
  { label: 'Goals', href: '/goals' },
] as const;

// ─── Thin rule ────────────────────────────────────────────────────────────────
function Rule() {
  return (
    <div
      style={{
        height: '1px',
        background: 'rgba(245,240,232,0.08)',
      }}
    />
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '10px',
        fontWeight: 300,
        letterSpacing: '0.35em',
        color: C.secondary,
        textTransform: 'uppercase',
        marginBottom: '24px',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid rgba(245,240,232,0.1)',
        padding: '8px 12px',
        borderRadius: '2px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        fontWeight: 400,
        color: C.primary,
      }}
    >
      {formatCurrency(payload[0].value)}
    </div>
  );
}

// ─── Skeleton block ───────────────────────────────────────────────────────────
function Skeleton({ width, height }: { width: string; height: string }) {
  return (
    <div
      style={{
        width,
        height,
        background: 'rgba(245,240,232,0.10)',
        borderRadius: '2px',
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard14Page() {
  const location = useLocation();

  // Inject fonts
  useEffect(() => {
    const fontId = 'dashboard14-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Inject keyframes
  useEffect(() => {
    const kfId = 'still-keyframes';
    if (!document.getElementById(kfId)) {
      const style = document.createElement('style');
      style.id = kfId;
      style.textContent = `
        @keyframes numberReveal {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ─── Data queries ────────────────────────────────────────────────────────────
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-net-worth-trend'],
    queryFn: () => dashboardService.getNetWorthTrend(6),
  });

  // ─── Derived values ──────────────────────────────────────────────────────────
  const summary = summaryData?.summary;
  const accounts = summaryData?.accounts ?? [];
  const recentTransactions = summaryData?.recentTransactions ?? [];
  const topCategories = (summaryData?.topCategories ?? []).slice(0, 6);

  const netWorth = summary?.netWorth ?? 0;
  const totalAssets = summary?.totalAssets ?? 0;
  const totalLiabilities = summary?.totalLiabilities ?? 0;
  const monthlyIncome = summary?.monthlyIncome ?? 0;
  const monthlyExpenses = summary?.monthlyExpense ?? 0;
  const netFlow = monthlyIncome - monthlyExpenses;

  const maxCategoryAmount =
    topCategories.length > 0
      ? Math.max(...topCategories.map((c) => c.amount))
      : 1;

  const isLoaded = !!summary;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: C.bg,
        minHeight: '100vh',
        color: C.primary,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Fixed top bar ─────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '52px',
          background: C.bg,
          borderBottom: '1px solid rgba(245,240,232,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          zIndex: 100,
        }}
      >
        {/* Wordmark */}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px',
            fontWeight: 300,
            letterSpacing: '0.45em',
            color: C.secondary,
            textTransform: 'uppercase',
          } as React.CSSProperties}
        >
          STILL
        </span>

        {/* Nav */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 0,
          }}
        >
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive =
              location.pathname === href ||
              (href === '/dashboard' &&
                location.pathname.startsWith('/dashboard14'));
            return (
              <Link
                key={href}
                to={href}
                style={{
                  padding: '16px 16px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  fontWeight: 400,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: isActive ? C.primary : C.secondary,
                  textDecoration: 'none',
                } as React.CSSProperties}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Date */}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px',
            fontWeight: 400,
            color: C.secondary,
          }}
        >
          {format(new Date(), 'dd MMMM yyyy')}
        </span>
      </header>

      {/* ── Content wrapper (below fixed nav) ─────────────────────────────── */}
      <div style={{ paddingTop: '68px' }}>

        {/* ── Hero section ────────────────────────────────────────────────── */}
        <section
          style={{
            paddingTop: '120px',
            paddingBottom: '72px',
            paddingLeft: '48px',
            paddingRight: '48px',
          }}
        >
          {/* Label row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 300,
                letterSpacing: '0.4em',
                color: C.secondary,
                textTransform: 'uppercase',
              } as React.CSSProperties}
            >
              NET WORTH
            </span>
            {netWorth > 0 && (
              <span
                style={{
                  width: '32px',
                  height: '1px',
                  background: C.accent,
                  display: 'inline-block',
                }}
              />
            )}
          </div>

          {/* Monumental number */}
          {isLoaded ? (
            <div
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: 'clamp(64px, 9vw, 130px)',
                fontWeight: 400,
                lineHeight: 1.0,
                color: netWorth >= 0 ? C.primary : '#C17040',
                animation: 'numberReveal 1s ease both',
                letterSpacing: '-0.02em',
              }}
            >
              {formatCurrency(netWorth)}
            </div>
          ) : (
            <Skeleton width="45%" height="96px" />
          )}

          {/* Sub-row: Assets / Liabilities / This Month */}
          <div
            style={{
              marginTop: '28px',
              display: 'flex',
              gap: '48px',
              alignItems: 'baseline',
              flexWrap: 'wrap',
            } as React.CSSProperties}
          >
            {/* Assets */}
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 300,
                  letterSpacing: '0.3em',
                  color: C.secondary,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                } as React.CSSProperties}
              >
                ASSETS
              </div>
              {isLoaded ? (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: 400,
                    color: C.primary,
                  }}
                >
                  {formatCurrency(totalAssets)}
                </div>
              ) : (
                <Skeleton width="80px" height="18px" />
              )}
            </div>

            {/* Liabilities */}
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 300,
                  letterSpacing: '0.3em',
                  color: C.secondary,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                } as React.CSSProperties}
              >
                LIABILITIES
              </div>
              {isLoaded ? (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: 400,
                    color: C.primary,
                  }}
                >
                  {formatCurrency(totalLiabilities)}
                </div>
              ) : (
                <Skeleton width="80px" height="18px" />
              )}
            </div>

            {/* This Month */}
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 300,
                  letterSpacing: '0.3em',
                  color: C.secondary,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                } as React.CSSProperties}
              >
                THIS MONTH
              </div>
              {isLoaded ? (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: 400,
                    color: netFlow >= 0 ? C.accent : 'rgba(245,240,232,0.5)',
                  }}
                >
                  {formatCurrency(netFlow)}
                </div>
              ) : (
                <Skeleton width="80px" height="18px" />
              )}
            </div>
          </div>

          {/* Full-width rule */}
          <div style={{ marginTop: '56px' }}>
            <Rule />
          </div>
        </section>

        {/* ── Monthly section ──────────────────────────────────────────────── */}
        <section
          style={{
            padding: '56px 48px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '48px',
          }}
        >
          {/* Section label spanning all columns */}
          <div
            style={{
              gridColumn: '1 / -1',
              marginBottom: '32px',
            }}
          >
            <SectionLabel>THIS MONTH</SectionLabel>
          </div>

          {/* Income */}
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.2em',
                color: C.secondary,
                textTransform: 'uppercase',
                marginBottom: '12px',
              } as React.CSSProperties}
            >
              INCOME
            </div>
            {isLoaded ? (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '28px',
                  fontWeight: 500,
                  color: C.primary,
                }}
              >
                {formatCurrency(monthlyIncome)}
              </div>
            ) : (
              <Skeleton width="80%" height="32px" />
            )}
          </div>

          {/* Expenses */}
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.2em',
                color: C.secondary,
                textTransform: 'uppercase',
                marginBottom: '12px',
              } as React.CSSProperties}
            >
              EXPENSES
            </div>
            {isLoaded ? (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '28px',
                  fontWeight: 500,
                  color: C.primary,
                }}
              >
                {formatCurrency(monthlyExpenses)}
              </div>
            ) : (
              <Skeleton width="80%" height="32px" />
            )}
          </div>

          {/* Net Flow */}
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.2em',
                color: C.secondary,
                textTransform: 'uppercase',
                marginBottom: '12px',
              } as React.CSSProperties}
            >
              NET FLOW
            </div>
            {isLoaded ? (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '28px',
                  fontWeight: 500,
                  color: netFlow >= 0 ? C.accent : 'rgba(245,240,232,0.4)',
                }}
              >
                {formatCurrency(netFlow)}
              </div>
            ) : (
              <Skeleton width="80%" height="32px" />
            )}
          </div>
        </section>

        <div style={{ padding: '0 48px' }}>
          <Rule />
        </div>

        {/* ── Trend + Accounts section ─────────────────────────────────────── */}
        <section
          style={{
            padding: '56px 48px',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: '64px',
            alignItems: 'start',
          }}
        >
          {/* Left — 6-Month Trend */}
          <div>
            <SectionLabel>6-MONTH TREND</SectionLabel>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData?.trend ?? []}>
                <XAxis
                  dataKey="month"
                  tick={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    fill: C.secondary,
                    fontWeight: 400,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke={C.primary}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: C.accent, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Right — Accounts */}
          <div>
            <SectionLabel>ACCOUNTS</SectionLabel>
            {isLoaded ? (
              <div>
                {accounts.map((account) => {
                  const isDebtType =
                    account.type === 'credit' ||
                    account.type === 'loan' ||
                    account.type === 'liability';
                  const balanceColor =
                    account.balance < 0 || isDebtType
                      ? 'rgba(245,240,232,0.4)'
                      : C.primary;
                  return (
                    <div
                      key={account.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(245,240,232,0.06)',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '14px',
                            fontWeight: 400,
                            color: C.primary,
                          }}
                        >
                          {account.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '10px',
                            fontWeight: 400,
                            color: C.secondary,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            marginTop: '2px',
                          } as React.CSSProperties}
                        >
                          {account.type}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '14px',
                          fontWeight: 500,
                          color: balanceColor,
                        }}
                      >
                        {formatCurrency(account.balance)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(245,240,232,0.06)',
                    }}
                  >
                    <Skeleton width="80%" height="18px" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div style={{ padding: '0 48px' }}>
          <Rule />
        </div>

        {/* ── Transactions section ─────────────────────────────────────────── */}
        <section style={{ padding: '56px 48px' }}>
          <SectionLabel>RECENT</SectionLabel>

          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 120px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(245,240,232,0.08)',
              marginBottom: '4px',
            }}
          >
            {(['DATE', 'DESCRIPTION', 'AMOUNT'] as const).map((h) => (
              <div
                key={h}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 400,
                  color: C.secondary,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  textAlign: h === 'AMOUNT' ? 'right' : 'left',
                } as React.CSSProperties}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Transaction rows */}
          {isLoaded ? (
            recentTransactions.slice(0, 10).map((tx) => {
              const isIncome = tx.type === 'income';
              const amountColor = isIncome ? C.accent : C.expense;
              const label = tx.name ?? tx.description ?? '—';
              const truncated =
                label.length > 40 ? label.slice(0, 40) + '…' : label;
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 120px',
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(245,240,232,0.04)',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      color: C.secondary,
                    }}
                  >
                    {format(new Date(tx.date), 'd MMM')}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      fontWeight: 400,
                      color: C.primary,
                    }}
                  >
                    {truncated}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      color: amountColor,
                      textAlign: 'right',
                    } as React.CSSProperties}
                  >
                    {formatCurrency(Math.abs(tx.amount))}
                  </div>
                </div>
              );
            })
          ) : (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 120px',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(245,240,232,0.04)',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Skeleton width="60px" height="14px" />
                <Skeleton width="70%" height="14px" />
                <Skeleton width="80px" height="14px" />
              </div>
            ))
          )}
        </section>

        <div style={{ padding: '0 48px' }}>
          <Rule />
        </div>

        {/* ── Spending section ─────────────────────────────────────────────── */}
        <section style={{ padding: '0 48px 80px' }}>
          <div style={{ paddingTop: '56px' }}>
            <SectionLabel>WHERE IT GOES</SectionLabel>

            {isLoaded ? (
              topCategories.map((cat, idx) => {
                const catName = cat.category?.name ?? 'Other';
                const pct = (cat.amount / maxCategoryAmount) * 100;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(245,240,232,0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '14px',
                          fontWeight: 400,
                          color: C.primary,
                        }}
                      >
                        {catName}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '14px',
                          fontWeight: 500,
                          color: C.secondary,
                        }}
                      >
                        {formatCurrency(cat.amount)}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        height: '1px',
                        background: 'rgba(245,240,232,0.12)',
                        marginTop: '8px',
                      }}
                    >
                      <div
                        style={{
                          height: '1px',
                          background: 'rgba(245,240,232,0.5)',
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(245,240,232,0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Skeleton width="40%" height="14px" />
                    <Skeleton width="80px" height="14px" />
                  </div>
                  <div
                    style={{
                      height: '1px',
                      background: 'rgba(245,240,232,0.12)',
                      marginTop: '8px',
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
