# Design Polish — Design Document

Captured from a design critique session on 2026-03-24. See the full critique and decision log in the plan file.

## Summary of Decisions

### Priority Issues

1. **Surplus tier styling** — Uniform coloured totals + cascade connectors across all tiers. Surplus treated identically (teal, same size/weight). Remove `border-t` separator, replace with "equals" connector.

2. **Typography hierarchy (D3)** — Tier labels: 13px/Outfit/600. Tier totals: 15px/JetBrains Mono/600. Item names: 13px/Nunito Sans/400/dimmed. Item amounts: 13px/JetBrains Mono/400/subtle. Update design system spec to match.

3. **Dual ambient glows** — Per-page radial gradient pairs creating sense of place. Overview: indigo+violet. Wealth: blue+teal. Planner: purple+indigo. Settings: neutral/none.

4. **Empty states** — Three tiers: ghosted cascade + gradient CTA card (no waterfall), contextual hint + keyboard badges (right panel), fading skeleton rows + gradient CTA card (list empties).

### Minor Fixes

1. Hardcoded amber → `text-attention` token
2. Manual button styles → `<Button>` component
3. Native checkboxes → shadcn Checkbox
4. Wordmark: Outfit font, canonical name "finplan" (lowercase, one word)
5. Confetti: 40 → ~20 particles
6. Snapshot truncation: wider limit + tooltips
