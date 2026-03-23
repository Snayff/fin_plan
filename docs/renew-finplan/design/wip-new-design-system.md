# FinPlan Design System — Work in Progress

_Session: 2026-03-22/23 — all positions agreed, pending final approval_

---

## Theme

Dark only. No light mode. No theme switching.

---

## Base & Depth

| Token        | Value                                                             | Notes                                       |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------- |
| `background` | `#080a14`                                                         | Deep navy, almost black with blue undertone |
| Ambient glow | Radial gradient — indigo/violet at top-right, teal at bottom-left | Subtle depth, never flat                    |

The background is never a plain solid. Ambient radial glows give the canvas depth and warmth without competing with content.

---

## Typography

| Role          | Font               | Weights       | Used for                                                             |
| ------------- | ------------------ | ------------- | -------------------------------------------------------------------- |
| UI / Headings | **Outfit**         | 700, 800      | Tier names, headlines, wordmark, button labels, nav, section headers |
| Body          | **Nunito Sans**    | 400, 500, 600 | Item labels, descriptions, metadata, helper text, breadcrumbs        |
| Numeric       | **JetBrains Mono** | 400, 500, 600 | All monetary values, percentages, numerical data                     |

**Inter is not used anywhere.**

### Tier headings

Tier names use **solid colour** (their tier primary), not gradient. Weight 800, uppercase, wide letter-spacing.

### Callout words

Gradient text is reserved for **callout words** — special engagement phrases, hero headlines, and standout moments. These use the callout tokens below, not tier colours.

---

## Tier Colours

| Tier                | Primary                 | Semantic intent                       |
| ------------------- | ----------------------- | ------------------------------------- |
| **Income**          | `#0ea5e9` electric blue | The source — energetic, positive      |
| **Committed Spend** | `#6366f1` indigo        | Neutral obligation — settled, factual |
| **Discretionary**   | `#a855f7` purple        | Chosen spend — expressive             |
| **Surplus**         | `#4adcd0` teal-mint     | The answer — the reward at the bottom |

Each tier's left accent bar, value colour, and heading text use the solid primary. **Tier colours are semantically protected** — they must only be used in their tier context, never repurposed for status, attention, or other UI signals.

---

## Accent & Action Colours

| Token         | Value                     | Used for                                                           |
| ------------- | ------------------------- | ------------------------------------------------------------------ |
| `action`      | `#7c3aed` electric violet | Buttons, focus rings, active nav state, CTAs                       |
| `page-accent` | `#8b5cf6` soft violet     | Breadcrumbs, section headers, and nav indicators on non-tier pages |

`page-accent` is visually distinct from Discretionary (`#a855f7`) — bluer and cooler — so it never reads as a tier signal.

---

## Callout Tokens

Callout gradients are for **engagement and special highlights only** — hero emphasis, key phrases, standout moments. Never for warnings, attention items, or status signals.

| Token               | Value                                 | Used for                                             |
| ------------------- | ------------------------------------- | ---------------------------------------------------- |
| `callout-primary`   | `#0ea5e9` → `#a855f7` (blue → purple) | Hero emphasis, key phrases, primary standout moments |
| `callout-secondary` | `#a855f7` → `#4adcd0` (purple → teal) | Secondary emphasis, variety                          |

Applied as gradient text (`background-clip: text`). The gradient treatment should feel special and inviting — "look at this exciting thing."

---

## Surfaces

Wider steps (~8-10 lightness points) between levels for clear visual hierarchy.

| Token              | Background | Border    | Used for                                |
| ------------------ | ---------- | --------- | --------------------------------------- |
| `surface`          | `#0d1120`  | `#1a1f35` | Cards, panels, sidebars                 |
| `surface-elevated` | `#141b2e`  | `#222c45` | Modals, popovers, selected rows         |
| `surface-overlay`  | `#1c2540`  | `#2a3558` | Dropdowns, tooltips, top-layer elements |

---

## Text Hierarchy

All text uses a blue-white tint (`rgba(238, 242, 255, ...)`) for cohesion with the cool palette.

| Token            | Value                       | Used for                                    |
| ---------------- | --------------------------- | ------------------------------------------- |
| `text-primary`   | `rgba(238, 242, 255, 0.92)` | Headlines, key values, primary labels       |
| `text-secondary` | `rgba(238, 242, 255, 0.65)` | Item names, descriptions, body text         |
| `text-tertiary`  | `rgba(238, 242, 255, 0.40)` | Metadata, helper text, timestamps           |
| `text-muted`     | `rgba(238, 242, 255, 0.25)` | Placeholders, disabled text, divider labels |

---

## Status Colours

The app is **non-judgemental**. Financial values are never colour-coded as good or bad.

| Token     | Value           | Used for                                      | Never for                               |
| --------- | --------------- | --------------------------------------------- | --------------------------------------- |
| `error`   | `#ef4444` red   | App errors only (validation, system failures) | Financial shortfalls, negative balances |
| `success` | `#22c55e` green | UI confirmations only (saved, completed)      | Positive balances, surplus amounts      |

---

## Attention System

One colour, one pattern. Amber is the universal "noteworthy" signal — staleness, financial attention, anything that deserves a second look. It doesn't judge, it just highlights.

| Token              | Value                      | Used for                                                            |
| ------------------ | -------------------------- | ------------------------------------------------------------------- |
| `attention`        | `#f59e0b`                  | Dot indicator, text detail, inline labels — always this exact value |
| `attention-bg`     | `rgba(245, 158, 11, 0.04)` | Nudge card background tint only                                     |
| `attention-border` | `rgba(245, 158, 11, 0.08)` | Nudge card border only                                              |

### Pattern

- **Dot + text**: A 5px amber dot alongside amber text explaining what's noteworthy
- **Consistent everywhere**: Stale items, cashflow warnings, tier badges — same dot, same colour, same pattern
- **Nudge cards**: Subtle amber-tinted background and border, amber dot in the header, body text in standard colours

---

## Selection & Hover States

Interactive states use the contextual tier colour at varying opacities. On non-tier pages, use `page-accent`.

| State          | Treatment                                                |
| -------------- | -------------------------------------------------------- |
| **Hover**      | ~5% tier/accent colour opacity background                |
| **Selected**   | ~14% tier/accent colour opacity background               |
| **Active nav** | Solid tier/accent colour text + 2px bottom underline bar |

---

## Design Personality

- **Bold type** — Outfit 800 for all tier headings and headlines _(Toko reference)_
- **Ambient background depth** — radial glows, never flat black _(Profunds reference)_
- **Callout word gradients** — reserved for engagement highlights, not tier headings _(Finotive reference)_
- **Generous deliberate spacing** — 8px grid, spacious by default _(Toko reference)_
- **Colour as signal, not decoration** — used sparingly and meaningfully
- **Monochromatic cool palette** — indigo / blue / violet / teal family throughout
- **Non-judgemental** — no good/bad colour coding of financial positions

---

## Design Rules

1. **Tier colours are semantically protected** — Income blue, Committed indigo, Discretionary purple, and Surplus teal are exclusively reserved for their waterfall tier. Never repurpose for status, attention, or other UI signals.
2. **Callout gradients are for engagement only** — the gradient text treatment is special and inviting. Never use it for warnings, attention items, or informational alerts.
3. **Red is only for app errors** — never for financial shortfalls, negative balances, or any financial value.
4. **Green is only for UI confirmations** — never for positive balances, surplus amounts, or any financial value.
5. **Amber is one colour, one pattern** — `#f59e0b` everywhere, with a dot + text pattern. No variations in hue or saturation across contexts.
6. **Tier headings are solid colours** — the tier's primary colour, not gradient. Gradient text is reserved for callout words.
7. **Inter is never used.**
