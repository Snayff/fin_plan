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
import { useDashboardPreviewAuth } from '../hooks/useDashboardPreviewAuth';

const C = {
  bg: '#07000F',
  panel: '#0D0820',
  magenta: '#FF0090',
  cyan: '#00CFFF',
  acid: '#F5FF00',
  textPrimary: '#E8E0FF',
  textMuted: '#6B5F8A',
  green: '#00FF88',
};

const navItems = [
  { label: 'DASHBOARD', href: '/dashboard', Icon: LayoutDashboard },
  { label: 'ACCOUNTS', href: '/accounts', Icon: CreditCard },
  { label: 'TRANSACTIONS', href: '/transactions', Icon: ArrowRightLeft },
  { label: 'ASSETS', href: '/assets', Icon: Building },
  { label: 'LIABILITIES', href: '/liabilities', Icon: Landmark },
  { label: 'BUDGET', href: '/budget', Icon: PiggyBank },
  { label: 'GOALS', href: '/goals', Icon: Target },
];

const panelStyle: React.CSSProperties = {
  background: C.panel,
  border: '1px solid rgba(0,207,255,0.15)',
  borderRadius: '6px',
  padding: '20px',
  position: 'relative',
  overflow: 'hidden',
};

function PanelCorners() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 16,
          height: 16,
          borderTop: `2px solid ${C.magenta}`,
          borderLeft: `2px solid ${C.magenta}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          width: 16,
          height: 16,
          borderBottom: '2px solid rgba(255,0,144,0.3)',
          borderRight: '2px solid rgba(255,0,144,0.3)',
        }}
      />
    </>
  );
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.3em',
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: '4px',
        borderBottom: '1px solid rgba(255,0,144,0.2)',
        paddingBottom: 12,
        marginTop: 4,
      }}
    >
      {title}
    </div>
  );
}

function SkeletonLine({ width = '100%', height = 12 }: { width?: string; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        background: 'rgba(255,0,144,0.08)',
        borderRadius: 3,
        marginBottom: 10,
      }}
    />
  );
}

function LoadingPanel() {
  return (
    <div
      style={{
        ...panelStyle,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <PanelCorners />
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '9px',
          color: C.textMuted,
          letterSpacing: '0.3em',
          marginBottom: 16,
        }}
      >
        LOADING DATA...
      </div>
      <SkeletonLine width="60%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="50%" />
      <SkeletonLine width="90%" />
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CyberTooltip({ active, payload, label }: TooltipProps) {
  const firstPoint = payload?.[0];
  if (!active || !firstPoint) return null;
  return (
    <div
      style={{
        background: C.panel,
        border: '1px solid rgba(0,207,255,0.3)',
        borderRadius: '4px',
        padding: '8px 12px',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px',
        color: C.cyan,
      }}
    >
      <div style={{ color: C.textMuted, fontSize: '9px', marginBottom: 4 }}>{label}</div>
      <div>{formatCurrency(firstPoint.value)}</div>
    </div>
  );
}

export default function Dashboard13Page() {
  const location = useLocation();
  const { queriesEnabled, isBootstrappingAuth } = useDashboardPreviewAuth();

  useEffect(() => {
    const fontId = 'dashboard13-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Share+Tech+Mono&display=swap';
      document.head.appendChild(link);
    }

    const styleId = 'netrunner-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes glitch {
          0%,89%,100% { transform:translate(0,0); opacity:1; }
          90% { transform:translate(-4px,0); color:#FF0090; text-shadow:4px 0 0 #00CFFF; }
          92% { transform:translate(4px,0); color:#00CFFF; text-shadow:-4px 0 0 #FF0090; }
          94% { transform:translate(-2px,0); opacity:0.8; }
          96% { transform:translate(0,0); opacity:1; }
        }
        @keyframes neonPulse {
          0%,100% { opacity:1; box-shadow:0 0 20px #FF0090, 0 0 40px rgba(255,0,144,0.5); }
          50% { opacity:0.75; box-shadow:0 0 10px #FF0090, 0 0 20px rgba(255,0,144,0.3); }
        }
        @keyframes flicker {
          0%,18%,20%,50.1%,60%,65.1%,80%,90.1%,92%,100% { opacity:1; }
          19%,50%,60.1%,65%,80.1%,90% { opacity:0.4; }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanMove { from{background-position:0 0} to{background-position:0 100%} }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
    enabled: queriesEnabled,
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['dashboard-net-worth-trend'],
    queryFn: () => dashboardService.getNetWorthTrend(6),
    enabled: queriesEnabled,
  });

  const summary = summaryData?.summary;
  const accounts = summaryData?.accounts || [];
  const recentTransactions = summaryData?.recentTransactions || [];
  const topCategories = summaryData?.topCategories || [];

  const totalAssets = summary?.totalAssets || 0;
  const totalLiabilities = summary?.totalLiabilities || 0;
  const totalCash = summary?.totalCash ?? summary?.totalBalance ?? 0;
  const netWorth = totalCash + totalAssets - totalLiabilities;
  const monthlyIncome = summary?.monthlyIncome || 0;
  const monthlyExpenses = summary?.monthlyExpense || 0;
  const netFlow = monthlyIncome - monthlyExpenses;

  const trendChartData =
    trendData?.trend?.map((point) => ({
      month: point.month,
      netWorth:
        point.netWorth ??
        (point.cash ?? point.balance ?? 0) + (point.assets || 0) - (point.liabilities || 0),
    })) || [];

  const maxCategoryAmount =
    topCategories.length > 0 ? Math.max(...topCategories.map((c) => c.amount)) : 1;

  const getAccountTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      current: 'CURRENT',
      savings: 'SAVINGS',
      isa: 'ISA',
      stocks_and_shares_isa: 'S&S ISA',
      credit: 'CREDIT',
      investment: 'INVEST',
      loan: 'LOAN',
      asset: 'ASSET',
      liability: 'LIAB',
    };
    return labels[type] || type.toUpperCase();
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: C.bg,
        fontFamily: "'Chakra Petch', sans-serif",
        color: C.textPrimary,
        overflow: 'hidden',
      }}
    >
      {/* CRT Scanline overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
        }}
      />

      {/* All content above scanline */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          minHeight: '100vh',
        }}
      >
        {/* SIDEBAR */}
        <aside
          style={{
            width: 220,
            minWidth: 220,
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            zIndex: 3,
            background: C.panel,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Left neon strip */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '3px',
              background: C.magenta,
              animation: 'neonPulse 3s ease-in-out infinite',
            }}
          />

          {/* Header */}
          <div style={{ padding: '24px 20px 0 24px' }}>
            <div
              style={{
                fontFamily: "'Chakra Petch', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                color: C.magenta,
                letterSpacing: '0.2em',
                animation: 'flicker 10s step-start infinite',
              }}
            >
              NETRUNNER
            </div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                color: C.textMuted,
                letterSpacing: '0.15em',
                marginTop: 4,
              }}
            >
              FINANCE SYSTEM
            </div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                color: C.green,
                marginTop: 4,
              }}
            >
              v2.0.77 // ONLINE
            </div>
            <div
              style={{
                height: 1,
                background: 'rgba(255,0,144,0.3)',
                margin: '16px -20px 16px 0',
              }}
            />
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(({ label, href, Icon }) => {
              const isActive =
                location.pathname === href ||
                (href === '/dashboard' && location.pathname.startsWith('/dashboard'));
              return (
                <Link
                  key={href}
                  to={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    paddingLeft: isActive ? 14 : 16,
                    textDecoration: 'none',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    color: isActive ? C.cyan : C.textMuted,
                    borderLeft: isActive ? `2px solid ${C.cyan}` : '2px solid transparent',
                    textShadow: isActive ? '0 0 8px rgba(0,207,255,0.8)' : 'none',
                    background: isActive ? 'rgba(0,207,255,0.05)' : 'transparent',
                    borderRadius: '0 4px 4px 0',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* System status */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,0,144,0.15)',
            }}
          >
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                color: C.textMuted,
                letterSpacing: '0.25em',
                marginBottom: 8,
              }}
            >
              SYS STATUS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: C.green,
                  boxShadow: `0 0 8px ${C.green}`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '9px',
                  color: C.green,
                  letterSpacing: '0.05em',
                }}
              >
                ALL SYSTEMS NOMINAL
              </span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main
          style={{
            marginLeft: 220,
            padding: '20px',
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
          }}
        >
          {/* TOP METRICS STRIP */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
            }}
          >
            {/* Chip 1: Net Worth */}
            <div
              style={{
                background: 'rgba(255,0,144,0.06)',
                border: '1px solid rgba(255,0,144,0.25)',
                borderRadius: '4px',
                padding: '12px 20px',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '9px',
                  color: C.textMuted,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                // NET WORTH
              </div>
              <div
                style={{
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 700,
                  fontSize: '28px',
                  color: C.textPrimary,
                  animation: 'glitch 8s infinite',
                  display: 'inline-block',
                }}
              >
                {summaryLoading || isBootstrappingAuth ? '——' : formatCurrency(netWorth)}
              </div>
            </div>

            {/* Chip 2: Income */}
            <div
              style={{
                background: 'rgba(255,0,144,0.06)',
                border: '1px solid rgba(255,0,144,0.25)',
                borderRadius: '4px',
                padding: '12px 20px',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '9px',
                  color: C.textMuted,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                // INCOME
              </div>
              <div
                style={{
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 600,
                  fontSize: '20px',
                  color: C.cyan,
                }}
              >
                {summaryLoading || isBootstrappingAuth ? '——' : formatCurrency(monthlyIncome)}
              </div>
            </div>

            {/* Chip 3: Expenses */}
            <div
              style={{
                background: 'rgba(255,0,144,0.06)',
                border: '1px solid rgba(255,0,144,0.25)',
                borderRadius: '4px',
                padding: '12px 20px',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '9px',
                  color: C.textMuted,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                // EXPENSES
              </div>
              <div
                style={{
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 600,
                  fontSize: '20px',
                  color: C.magenta,
                }}
              >
                {summaryLoading || isBootstrappingAuth ? '——' : formatCurrency(monthlyExpenses)}
              </div>
            </div>

            {/* Chip 4: Net Flow */}
            <div
              style={{
                background: 'rgba(255,0,144,0.06)',
                border: '1px solid rgba(255,0,144,0.25)',
                borderRadius: '4px',
                padding: '12px 20px',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '9px',
                  color: C.textMuted,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                // NET FLOW
              </div>
              <div
                style={{
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 600,
                  fontSize: '20px',
                  color: summaryLoading || isBootstrappingAuth ? C.textMuted : netFlow >= 0 ? C.acid : C.magenta,
                }}
              >
                {summaryLoading || isBootstrappingAuth ? '——' : formatCurrency(netFlow)}
              </div>
            </div>
          </div>

          {/* CONTENT GRID */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            {/* Panel 1: Net Worth Timeline */}
            {trendLoading || isBootstrappingAuth ? (
              <LoadingPanel />
            ) : (
              <div style={panelStyle}>
                <PanelCorners />
                <PanelHeader title="// NET WORTH / TIMELINE" />
                <div style={{ marginTop: 16, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendChartData}
                      margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="cyberGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.cyan} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        tick={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 9,
                          fill: C.textMuted,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CyberTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="netWorth"
                        stroke={C.cyan}
                        strokeWidth={2}
                        fill="url(#cyberGrad)"
                        style={{
                          filter: 'drop-shadow(0 0 6px rgba(0,207,255,0.8))',
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Panel 2: Expenditure Matrix */}
            {summaryLoading || isBootstrappingAuth ? (
              <LoadingPanel />
            ) : (
              <div style={panelStyle}>
                <PanelCorners />
                <PanelHeader title="// EXPENDITURE MATRIX" />
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topCategories.slice(0, 6).map((cat, idx) => (
                    <div key={idx}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '11px',
                            color: C.textPrimary,
                          }}
                        >
                          {(cat.category?.name || 'UNKNOWN').toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '11px',
                            color: C.magenta,
                          }}
                        >
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: 'rgba(255,0,144,0.15)',
                          marginTop: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${(cat.amount / maxCategoryAmount) * 100}%`,
                            background: C.magenta,
                            borderRadius: 2,
                            boxShadow: '0 0 8px rgba(255,0,144,0.6)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {topCategories.length === 0 && (
                    <div
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '11px',
                        color: C.textMuted,
                      }}
                    >
                      NO DATA FOUND
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Panel 3: Account Nodes */}
            {summaryLoading || isBootstrappingAuth ? (
              <LoadingPanel />
            ) : (
              <div style={panelStyle}>
                <PanelCorners />
                <PanelHeader title="// ACCOUNT NODES" />
                <div style={{ marginTop: 16 }}>
                  {accounts.length === 0 ? (
                    <div
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '11px',
                        color: C.textMuted,
                      }}
                    >
                      NO NODES DETECTED
                    </div>
                  ) : (
                    accounts.slice(0, 8).map((account, idx) => (
                      <div
                        key={account.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom:
                            idx < Math.min(accounts.length, 8) - 1
                              ? '1px solid rgba(255,255,255,0.05)'
                              : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span
                            style={{
                              color: C.cyan,
                              fontSize: '14px',
                              flexShrink: 0,
                            }}
                          >
                            ◈
                          </span>
                          <span
                            style={{
                              fontFamily: "'Chakra Petch', sans-serif",
                              fontSize: '13px',
                              color: C.textPrimary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {account.name}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: '9px',
                              color: C.textMuted,
                              border: '1px solid rgba(107,95,138,0.4)',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {getAccountTypeBadge(account.type)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '13px',
                            color: account.balance < 0 ? C.magenta : C.cyan,
                            flexShrink: 0,
                            marginLeft: 12,
                          }}
                        >
                          {formatCurrency(account.balance)}
                        </div>
                      </div>
                    ))
                  )}
                  {accounts.length > 8 && (
                    <Link
                      to="/accounts"
                      style={{
                        display: 'block',
                        marginTop: 10,
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '9px',
                        color: C.cyan,
                        textDecoration: 'none',
                        letterSpacing: '0.1em',
                      }}
                    >
                      + {accounts.length - 8} MORE NODES →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Panel 4: Transaction Feed */}
            {summaryLoading || isBootstrappingAuth ? (
              <LoadingPanel />
            ) : (
              <div style={panelStyle}>
                <PanelCorners />
                <PanelHeader title="// TRANSACTION FEED" />
                <div style={{ marginTop: 16 }}>
                  {recentTransactions.length === 0 ? (
                    <div
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '11px',
                        color: C.textMuted,
                      }}
                    >
                      FEED EMPTY
                    </div>
                  ) : (
                    recentTransactions.slice(0, 8).map((tx, idx) => {
                      const isIncome =
                        tx.type === 'income' ||
                        (tx.type === undefined && tx.amount > 0);
                      const description = tx.description || 'UNKNOWN';
                      const truncated =
                        description.length > 22
                          ? description.slice(0, 22) + '…'
                          : description;
                      return (
                        <div
                          key={tx.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0',
                            borderBottom:
                              idx < Math.min(recentTransactions.length, 8) - 1
                                ? '1px solid rgba(255,255,255,0.04)'
                                : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                            <span
                              style={{
                                fontFamily: "'Share Tech Mono', monospace",
                                fontSize: '10px',
                                color: isIncome ? C.cyan : C.magenta,
                                animation: 'blink 1.5s step-end infinite',
                                flexShrink: 0,
                                lineHeight: '16px',
                              }}
                            >
                              {isIncome ? '▲' : '▶'}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontFamily: "'Share Tech Mono', monospace",
                                  fontSize: '11px',
                                  color: C.textPrimary,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {truncated.toUpperCase()}
                              </div>
                              <div
                                style={{
                                  fontFamily: "'Share Tech Mono', monospace",
                                  fontSize: '9px',
                                  color: C.textMuted,
                                  marginTop: 2,
                                }}
                              >
                                {format(new Date(tx.date), 'dd MMM')}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: '13px',
                              color: isIncome ? C.cyan : C.magenta,
                              flexShrink: 0,
                              marginLeft: 12,
                            }}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(Math.abs(tx.amount))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 20,
              textAlign: 'center',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '9px',
              color: C.textMuted,
              letterSpacing: '0.2em',
              padding: '12px 0',
              borderTop: '1px solid rgba(255,0,144,0.1)',
            }}
          >
            NETRUNNER FINANCE SYSTEM // {format(new Date(), 'yyyy.MM.dd HH:mm')} // ALL DATA ENCRYPTED
          </div>
        </main>
      </div>
    </div>
  );
}
