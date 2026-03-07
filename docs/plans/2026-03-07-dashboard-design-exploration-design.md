# Dashboard Design Exploration

**Date:** 2026-03-07
**Branch:** feature/ui_revamp
**Status:** Implemented — 6 alternative dashboards live at /dashboard1–/dashboard6

## Context

The existing `/dashboard` uses a dark navy theme (`#191D32`) with orange primary (`#FF7A18`), top-nav layout, and uniform card grids. User feedback: the aesthetic feels generic and lacks personality.

## Design Goals

- Explore 3 distinct aesthetic directions, 2 variants each
- Allow full structural changes (sidebar nav, layout recomposition, information hierarchy)
- Keep all existing data and service integrations intact
- Navigate between variants via URL: `/dashboard`, `/dashboard1`…`/dashboard6`

## Directions

### Direction A — Warm Clarity (approachable)

Inspired by Monzo, Notion. Friendlier, less intimidating. Financial data that feels comfortable.

**Dashboard1 — "The Journal"**
- Sidebar navigation (220px), fixed full-viewport layout
- Crimson Pro (serif) for numbers, DM Sans for UI
- Warm cream palette: `#FAF8F3` bg, `#F3EDE0` sidebar, `#D4722A` amber accent
- Positive: `#2D6A4F` forest green, Negative: `#C44B2B` terracotta
- Sections separated by thin warm dividers with small-caps labels
- Hero: 72px Crimson Pro net worth with amber underline decoration
- Layout: sidebar | hero | month stats | accounts+pie | transactions (flex rows)

**Dashboard2 — "Friendly Finance"**
- Top pill-tab navigation (no sidebar)
- Fraunces (italic serif) for numbers, Nunito for UI
- Light/colorful: white base, coral expenses, teal income, purple accents
- Dark gradient net worth hero card with radial dot texture
- Flat stat cards (no shadow), emoji-adjacent iconography
- Horizontally scrolling account cards

### Direction B — Command Center (bold, energetic)

Inspired by Bloomberg, Linear. High-contrast, data-forward, motivating.

**Dashboard3 — "The Terminal"**
- No sidebar, full-width bento grid layout
- Space Mono for all data/numbers, Syne for headings
- Near-black `#070809` with electric mint `#00F5C3` accent, hot pink-red `#FF3D71` negative
- CSS grid-line background texture (40px grid)
- Sticky top bar: FINPLAN wordmark + live blinking cursor + dominant net worth number
- Asymmetric 4-column bento: chart 3-wide, position summary 1-wide, stats row, full-width transaction log in monospace fixed columns
- Loading state: `----` placeholders in Space Mono

**Dashboard4 — "Power Board"**
- No sidebar, full-width editorial layout
- Bebas Neue for all display numbers, IBM Plex Sans for body
- Dark `#0F1117` with amber `#FFB700` as signature accent (ticker bar + left panel borders)
- Amber ticker bar at very top showing all key stats
- Massive 96px Bebas Neue net worth dominates the header
- All panels: 0px border-radius (sharp), 4px amber left border
- Layout: ticker | header+mega-number | chart+metrics | charts+pie | accounts | transactions

### Direction C — Warm Command (hybrid, recommended)

Inspired by Mercury Bank. Warm enough to live in daily, confident enough to feel like a serious tool.

**Dashboard5 — "Mercury"**
- Sidebar (240px), fixed full-viewport layout
- Playfair Display for hero number, Plus Jakarta Sans for everything else
- Light warm white `#FAFAF8`, amber accent `#B45309` used extremely sparingly (active nav only, one metric card)
- Positive: deep emerald `#047857`, Negative: deep red `#B91C1C`
- Asymmetric hero card: 60% Playfair 64px net worth | 40% three stacked metric chips
- Full-width income/expense chart below hero
- 3-column bottom: accounts | spending pie | recent transactions
- 24px border-radius on all cards, very subtle shadows

**Dashboard6 — "Dark Journal"**
- Sidebar (240px), fixed full-viewport layout
- DM Serif Display for headings/numbers, Outfit for body
- Warm dark walnut `#1A1612` (not cold navy), warm cream `#F0E6D3` text
- Emerald `#10B981` for positive/income/active nav, amber `#F59E0B` for savings
- Hero card: gradient `#221E1A` → `#1E2820` (walnut bleeding into dark forest)
- Large decorative emerald circle (opacity 0.03) as background texture in hero
- Stat pills with dim colored backgrounds (emerald dim, red dim, amber dim)
- Layout: sidebar | hero | net worth chart | income+pie | accounts | transactions

## Technical Implementation

All 6 pages:
- Use identical React Query hooks (`dashboard-summary`, `dashboard-net-worth-trend`, `dashboard-income-expense-trend`)
- Escape the Layout container via `position: fixed; top: 64px; inset: 0; z-index: 10; overflow: auto`
- Load Google Fonts lazily via `document.createElement('link')` in a `useEffect`
- Use inline styles for all custom colors (not in Tailwind config), Tailwind for layout utilities
- Reuse existing chart components: `NetWorthChart`, `IncomeExpenseChart`, `CategoryPieChart`

## Files Changed

```
apps/frontend/src/pages/Dashboard1Page.tsx   (created)
apps/frontend/src/pages/Dashboard2Page.tsx   (created)
apps/frontend/src/pages/Dashboard3Page.tsx   (created)
apps/frontend/src/pages/Dashboard4Page.tsx   (created)
apps/frontend/src/pages/Dashboard5Page.tsx   (created)
apps/frontend/src/pages/Dashboard6Page.tsx   (created)
apps/frontend/src/App.tsx                    (routes added: /dashboard1–/dashboard6)
```

## Next Steps

After reviewing all 6 variants, decide:
1. Which direction to pursue (or which elements to combine)
2. Whether to extend the chosen design to other pages (Accounts, Transactions, etc.)
3. Whether to update the global design tokens (`src/index.css`) or keep the new palette isolated
