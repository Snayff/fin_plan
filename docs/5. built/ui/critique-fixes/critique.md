# Design Critique — Full App Walkthrough

**Date:** 2026-03-27
**Scope:** All major pages and components across the FinPlan frontend

---

## What's Working Well

1. **Waterfall-as-interface** — Tier colors (income blue, committed indigo, discretionary purple, surplus teal) run through navigation, section markers, data display, and the mental model. The `tracking-tier` uppercase labels, `WaterfallConnector` dividers ("minus committed", "equals"), and the `OverviewEmptyState` ghosted cascade all teach the model without explaining it. This is rare design coherence.

2. **Three-font typography with strict roles** — Outfit for headings (authority), Nunito Sans for body (readability), JetBrains Mono for numbers (precision). The text opacity hierarchy (`92% > 65% > 40% > 25%`) creates four distinct visual levels without needing different colors. Financial data in monospace with dimmed opacity feels immediately trustworthy and scannable.

3. **Staleness system** — Instead of timestamp clutter or "last updated" labels, stale items get an amber dot and an age label ("6mo ago"). The resolution action — "Still correct" — is brilliantly simple. It respects the "silence is approval" principle: healthy items show nothing, noteworthy items get a single amber signal.

4. **Motion foundation** — The existing animation work is thoughtful and well-constrained: stagger entrance on the waterfall tiers (`staggerChildren: 0.06`, 250ms, ease-out-quart), directional panel transitions (`PanelTransition.tsx` — 150ms slide+fade keyed on navigation depth), animated currency interpolation (`useAnimatedValue` — 550ms ease-out^4 for a satisfying "tick up"), delight glow on positive surplus (2s radial fade, 500ms delay), and button press feedback (`active:scale-[0.97]`). All animation respects `prefers-reduced-motion` via a shared hook. The easing canon (quart for slides, quint for pop-ins, never bounce/elastic) gives the app a consistent kinetic personality.

5. **Two-panel layout and Settings page structure** — The `TwoPanelLayout` (360px fixed left, flex-1 right) creates a clear spatial hierarchy: scan on the left, detail on the right. The asymmetric split gives the waterfall enough width to be readable while dedicating the majority of the viewport to the selected item's content. The Settings page has the strongest rhythm in the app: `space-y-12` (48px) between logical groups with `space-y-4` (16px) within — a clear two-tier convention that makes the page feel designed rather than stacked. Intersection Observer-driven active section highlighting in the Settings nav is a nice touch.

6. **Three-font system with strict roles** — Outfit for headings (authority, tighter tracking at `-0.025em`), Nunito Sans for body (readability, 16px base), JetBrains Mono for numbers (precision, tabular-nums alignment). The Tailwind config (`tailwind.config.js:136-154`) defines `font-heading`, `font-body`, `font-numeric`, and `font-mono` families with proper fallback chains. Custom `tracking-tier: 0.09em` for uppercase tier labels creates a distinctive identity. The four-level text opacity hierarchy (`92% > 65% > 40% > 25%`) achieves hierarchy without multiplying colours. The CSS global rule setting `font-feature-settings: "rlig" 1, "calt" 1` and `-webkit-font-smoothing: antialiased` shows typographic care.

7. **"Still correct" confirmation pattern** — The primary staleness resolution action is "Still correct ✓" (`ItemForm.tsx:141`, `ItemDetailPanel.tsx:205`, `ItemAccordion.tsx:91`). This is genuinely excellent UX copy — it communicates exactly what the user is confirming (the value hasn't changed), uses conversational language rather than system language ("Confirm" would be ambiguous), and the checkmark reinforces the positive action. It's the single most distinctive piece of copy in the app and perfectly embodies the "empowering, not advisory" principle.

8. **Terminology discipline** — The app consistently uses "budgeted", "planned", "allocated" and never "spent" or "paid" in user-facing copy (confirmed via grep — the forbidden terms only appear in the design principles documentation as a "don't use" list). "Stale" is used consistently as the staleness term. "Waterfall" is used as the canonical model name. "Scheduled" appears in the planner context. This is rare copy discipline for an app of this complexity.

9. **Household creation celebration** — The `WelcomePage.tsx` confetti burst is a well-judged delight moment: 20 particles in the four tier colours (cyan, indigo, purple, teal), varied sizes and rotations, 1.5–3s fall duration, auto-cleanup after 3s. It respects `prefers-reduced-motion` and is pointer-events-none. The phase progression ("Welcome" → "Name your household" → "{name} is ready!") creates genuine narrative payoff. This is the only true celebration moment in the app, and it's effective.

---

## Anti-Patterns Verdict

**Mostly passes, with two notable exceptions.**

The design system is constraint-based and intentional: semantic tier colors, a three-font typography hierarchy, the "silence is approval" principle, dark-only with deep navy rather than flat black, and amber as the sole attention signal. These are specific, opinionated decisions that no template or prompt-generated interface would produce.

**However, two patterns are AI slop tells:**

1. **Gradient text** in `EmptyStateCard.tsx:23-29` — `linear-gradient(90deg, #6366f1, #8b5cf6)` with `-webkit-background-clip: text`. This is perhaps the single most common fingerprint of AI-generated interfaces from 2024-2025. It appears on every empty subcategory state in the app.

2. **Repeated indigo-to-purple gradient cards** — The same `linear-gradient(135deg, rgba(99,102,241,0.07) > rgba(168,85,247,0.05))` appears in `OverviewEmptyState.tsx`, `EmptyStateCard.tsx`, and `GhostedListEmpty.tsx`. While indigo/purple is part of the brand palette, this exact gradient pattern — low-opacity indigo-to-purple on a dark card with a subtle indigo border — is a hallmark of AI-generated dark-mode interfaces. The repetition across three different components makes it more conspicuous.

---

## Priority Issues

### 1. Gradient text on empty states

**What:** `EmptyStateCard.tsx:23-29` uses `linear-gradient` with `background-clip: text` for the heading — the most recognizable AI-generated visual pattern.

**Why it matters:** Users (especially design-literate ones) will clock this instantly. It undermines the otherwise original aesthetic. Gradient text also has poor accessibility — it can't be overridden by high-contrast modes, and the gradient direction can reduce legibility at small sizes.

| Resolution                        | Pros                                                                       | Cons                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **A. Solid `text-foreground`**    | Clean, accessible, high-contrast mode compatible, removes AI tell entirely | Heading loses visual distinction from body text — relies purely on weight/size          |
| **B. Solid `text-page-accent`**   | Adds color accent without gradient, ties to action palette                 | Creates a new convention (accent-colored headings) not used elsewhere                   |
| **C. Use tier color for heading** | Contextual — income empty state gets blue, committed gets indigo, etc.     | Breaks "tier colors only for tier data" semantic rule; adds complexity to the component |

---

### 2. Right panel dead zones

**What:** The Overview default right panel (`OverviewPage.tsx:247-256`) shows near-invisible "Analytics — Coming soon". The Surplus right panel is a single centered number. Goals and Gifts are identical "Coming soon" stubs.

**Why it matters:** This is the first thing returning users see alongside their waterfall. The two-panel layout implies both panels are meaningful. When 60%+ of the viewport says "nothing here," the app feels incomplete — not calm, but unfinished. The distinction matters for user trust.

| Resolution                                                                                                           | Pros                                                                     | Cons                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **A. Collapse to single panel when right is empty**                                                                  | Waterfall gets full width, feels commanding, no dead space               | Layout shift when selecting an item; animation work needed for panel slide-in |
| **B. Show a lightweight summary in the right panel** (staleness overview, last snapshot delta, next cashflow events) | Fills dead space with useful info, gives returning users immediate value | Requires new data queries and components; scope creep risk                    |
| **C. Leave as-is, improve placeholder copy**                                                                         | Minimal effort, no structural change                                     | Doesn't solve the core problem — 60% of viewport is still dead                |

---

### 3. Placeholder pages in main navigation

**What:** Goals (`GoalsPage.tsx`) and Gifts (`GiftsPage.tsx`) are in the primary nav bar but show identical "Coming soon" text.

**Why it matters:** Navigation is a promise. Every nav item tells users "this works." Two broken promises in the main nav erode trust and make users wonder what else is incomplete. The identical copy between Goals and Gifts compounds this — it feels template-generated.

| Resolution                                                 | Pros                                                      | Cons                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **A. Remove from nav until implemented**                   | Clean nav, no broken promises, follows "earn every pixel" | Users don't know these features are planned; re-adding later changes nav structure |
| **B. Keep in nav but make empty states distinctive**       | Users see the roadmap, builds anticipation                | Still a "broken promise" — nav item leads to nothing functional                    |
| **C. Move to a "Coming Soon" section in Settings or Help** | Nav stays clean, features are still discoverable          | Obscure placement; users unlikely to find them                                     |

---

### 4. Inconsistent empty state patterns

**What:** The app has four different empty state treatments with no shared visual language:

- `OverviewEmptyState`: ghosted cascade + indigo gradient card + "Get started" button
- `EmptyStateCard`: indigo gradient card with gradient text + "+ Add item" button
- `GhostedListEmpty`: fading skeleton rows + optional gradient CTA card
- Goals/Gifts: centered muted text, no CTA

**Why it matters:** Empty states are high-leverage moments — they're what every new user sees first. Inconsistent treatment makes the app feel like it was built by different teams. This is especially jarring because the populated states are so consistent.

| Resolution                                                                                          | Pros                                                          | Cons                                                                              |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **A. Standardize on ghosted-preview pattern** (like `OverviewEmptyState`)                           | Teaches structure, consistent, the strongest existing pattern | More work per empty state — each needs a "ghosted" version of its populated state |
| **B. Standardize on simple card + CTA** (simplified `EmptyStateCard` without gradient text)         | Easy to apply everywhere, reusable component                  | Doesn't teach structure the way ghosted previews do                               |
| **C. Two-tier system** — ghosted preview for major pages, simple card for subcategory-level empties | Best of both; appropriate visual weight per context           | Two patterns instead of one; need clear rules for when to use which               |

---

### 5. Ghost add button contrast

**What:** `GhostAddButton.tsx` uses `border-foreground/10` and `text-foreground/45`. On the `#080a14` background, this means a border at roughly `rgba(238,242,255,0.09)` and text at `rgba(238,242,255,0.41)`.

**Why it matters:** Adding items is the primary creation action on tier pages. If the add button doesn't meet minimum contrast (WCAG requires 3:1 for UI components), users may not see it — especially on lower-quality monitors or in bright ambient light.

| Resolution                                                   | Pros                                                     | Cons                                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **A. Bump to `text-foreground/60` + `border-foreground/20`** | Meets WCAG, still subtle, minimal visual change          | Slightly more prominent than intended ghost aesthetic                                   |
| **B. Drop the border, increase text to `/60`**               | Cleaner, fewer visual elements, still discoverable       | Loses the "button" affordance that the border provides                                  |
| **C. Use `text-page-accent/50` + `border-page-accent/15`**   | Ties add action to the accent palette, more discoverable | Introduces accent color at rest state — may feel like too much color for a ghost button |

---

### 6. Accordion expand/collapse is instant

**What:** Clicking an `ItemRow` to reveal `ItemAccordion` (detail view) or `ItemForm` (edit mode) is a hard cut — content appears/disappears with zero transition. This is the most frequent interaction on every tier page (`ItemRow.tsx:65`, `ItemAreaRow.tsx:60-93`). The same applies to the "+ Add" form in `ItemArea.tsx:101-114`.

**Why it matters:** Expand/collapse is spatial information — the user needs to understand that content is _revealed within_ the row, not replacing it. Instant show/hide breaks spatial continuity and makes the interface feel fragile. Given this is the primary interaction loop (select item → inspect → edit → collapse), it compounds over a session. The rest of the app's motion work (panel transitions, stagger entrances, animated currency) makes these instant cuts feel more jarring by contrast.

| Resolution                                                                                                                                                           | Pros                                                                                                            | Cons                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Framer Motion height + opacity animation** — `AnimatePresence` wrapping children in `ItemRow`, animating `height: "auto"` + `opacity` over 200ms ease-out-quart | Smooth, spatial, matches the panel transition language already in the app; Framer handles `height: "auto"` well | Animating height is a layout property — needs `overflow: hidden` on the wrapper, which could clip content during animation; slightly more complex than pure transform animations                |
| **B. CSS `grid-template-rows: 0fr → 1fr` transition** — native CSS approach without Framer                                                                           | No JS library dependency for this animation; increasingly well-supported                                        | Less control over easing/interruption than Framer; requires a wrapper `<div>` with `overflow: hidden`; can't coordinate with Framer's `AnimatePresence` for the accordion↔form cross-transition |
| **C. Slide the entire row down** — use `transform: translateY` on sibling rows to make space                                                                         | Stays within transform-only rule; GPU-accelerated                                                               | Complex to orchestrate across siblings; doesn't communicate "content revealed inside" as clearly as height animation; fragile if list length changes                                            |

**Resolution chosen: A.** `AnimatePresence` in `ItemAreaRow.tsx` wrapping `ItemAccordion` and `ItemForm`. Each as a `motion.div` with `initial: { height: 0, opacity: 0 }` → `animate: { height: "auto", opacity: 1 }` → `exit: { height: 0, opacity: 0 }`, `transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] }`, `overflow: hidden`. Same treatment for the add-item form in `ItemArea.tsx`.

---

### 7. ReviewWizard has no transition between steps

**What:** The ReviewWizard (`ReviewWizard.tsx`) is a 6-step full-screen overlay (Income → Monthly Bills → Yearly Bills → Discretionary → Wealth → Summary). Clicking Next/Back instantly swaps the content area. The progress bar has `transition-all` but the main content — the part the user is reading — has nothing. The wizard itself also appears/disappears instantly (toggled at `OverviewPage.tsx:309`).

**Why it matters:** Step-by-step flows rely on spatial metaphor to communicate progress — "I'm moving forward through a sequence." Without directional transitions, Next and Back feel identical, and the user loses their sense of position within the flow. The progress bar animates but the content doesn't, creating a disconnect between the navigation signal and the navigation experience.

| Resolution                                                                                                                                                                                                  | Pros                                                                                                                                               | Cons                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **A. Directional slide + fade** — Forward: content slides left-to-right (exit left, enter right). Back: reverse. 200ms ease-out-quart. Wrap content in `AnimatePresence mode="wait"` keyed on `currentStep` | Clear spatial metaphor; matches existing `PanelTransition` language (which uses the same pattern for deeper/shallower); low complexity with Framer | Requires tracking direction in state; rapid Next/Back clicking needs `mode="wait"` to prevent overlapping animations |
| **B. Crossfade only** — 150ms fade out → fade in, no directional slide                                                                                                                                      | Simpler implementation; no direction tracking needed                                                                                               | Loses the spatial "forward/back" metaphor; Next and Back feel identical                                              |
| **C. Leave content instant, add wizard entrance/exit only** — fade the full-screen overlay in/out on open/close                                                                                             | Addresses the most jarring moment (instant overlay appearance); minimal scope                                                                      | Doesn't fix the step-to-step experience, which is where users spend most of their time                               |

---

### 8. SubcategoryList selection indicator is instant

**What:** Selecting a subcategory in the left panel (`SubcategoryList.tsx:73-78`) toggles a `border-l-2` indicator and background tint instantly. There's `transition-colors` on the button, but the border-left — the primary visual indicator of selection — appears as a hard cut because border is a layout property.

**Why it matters:** Subcategory selection drives the right panel content. A sliding indicator connecting old and new selection communicates "you moved here from there" — it reinforces the list as a navigable structure rather than a set of independent buttons. Raycast and Arc (cited as design references) both use animated selection indicators as a signature interaction.

| Resolution                                                                                                                                                                                                                       | Pros                                                                                | Cons                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Framer `layoutId` indicator** — Replace the `border-l-2` with an absolutely-positioned `motion.div` using `layoutId="subcategory-indicator"`. Framer auto-animates the bar sliding between rows using FLIP (transform-only) | Elegant, transform-only, matches reference apps; single line of motion code per row | Requires restructuring the button slightly (add `relative` positioning, render indicator as child); `layoutId` can glitch if the list re-renders with a different array (e.g., switching tiers) — needs `LayoutGroup` scoping |
| **B. CSS `transition-all` on the border** — add `transition-all duration-200` to the button                                                                                                                                      | Minimal change, no Framer dependency                                                | `border-left` is a layout property — the browser can't GPU-accelerate it; the "slide between rows" effect isn't possible with CSS alone (each button animates independently)                                                  |
| **C. Do nothing — keep instant**                                                                                                                                                                                                 | No effort; the interaction is functional                                            | Misses a signature polish moment; the left panel feels static compared to the animated right panel                                                                                                                            |

**Resolution chosen: A.** Tier-scoped `layoutId="subcategory-indicator-{tier}"` to prevent cross-tier glitches on page navigation. Wrapped in `<LayoutGroup>`. Reduced motion: static `div` fallback.

---

### 9. Missing entrance animations on contextual cards

**What:** Three card types appear instantly with no entrance animation:

- **NudgeCard** (`NudgeCard.tsx`) — amber attention card, appears when items need review
- **EmptyStateCard** (`EmptyStateCard.tsx`) — gradient CTA card when a subcategory has no items
- **GhostedListEmpty** (`GhostedListEmpty.tsx`) — ghost skeleton rows + CTA in empty panels

**Why it matters:** These cards represent state transitions — the UI went from "content" to "empty" or from "healthy" to "needs attention." A subtle entrance signals "this just changed" and draws the eye naturally. Without it, users scanning the page may not register that a nudge appeared, especially the amber NudgeCard which is the app's only attention signal.

| Resolution                                                                                                                                                                                                                           | Pros                                                                                                                                                                               | Cons                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **A. Subtle fade + slide per card type** — NudgeCard: `opacity:0→1, y:4→0` (250ms). EmptyStateCard: `opacity:0→1, scale:0.97→1` (250ms, pop-in). GhostedListEmpty: stagger entrance per Pattern 1 (`staggerChildren: 0.06`, `y:6→0`) | Each card gets animation appropriate to its weight; stagger on ghost rows matches the waterfall stagger language; pop-in on empty state card gives it the "special moment" feeling | Three separate implementations; each component needs `usePrefersReducedMotion` check                                           |
| **B. Shared `FadeIn` wrapper component** — a generic `<FadeIn>` that wraps any content with `opacity:0→1, y:4→0` over 250ms                                                                                                          | Single implementation, reusable across all three (and future) card types; consistent entrance language                                                                             | One-size-fits-all — loses the opportunity for the EmptyStateCard pop-in or GhostedListEmpty stagger, which are more expressive |
| **C. CSS-only `@starting-style` animation** — use the new CSS `@starting-style` rule for entrance animations without JS                                                                                                              | No Framer dependency; progressive enhancement (browsers without support just skip it)                                                                                              | Browser support is still limited (no Firefox as of early 2026); can't do stagger; less control over easing                     |

**Resolution chosen: A (per-card).** NudgeCard: `motion.div` with `opacity: 0→1, y: 4→0` (250ms, easeOut). EmptyStateCard: `motion.div` with `opacity: 0→1, scale: 0.97→1` (250ms, ease-out-quint). GhostedListEmpty: stagger ghost rows with `staggerChildren: 0.06`, final opacity matching existing `GHOST_OPACITIES[]` values; CTA card gets same pop-in as EmptyStateCard. Also adds item list entrance stagger on `ItemArea` (new items stagger in at `staggerChildren: 0.04`, `y: 6→0`).

---

### 10. ReviewWizard ItemCard confirmation has no feedback animation

**What:** When a user clicks "Still correct" or "Update" on a ReviewWizard `ItemCard` (`ReviewWizard.tsx:67-135`), the card instantly flips to `opacity-60` via a className conditional. There's no visual acknowledgment of the action completing.

**Why it matters:** The ReviewWizard is a bulk-action flow where users confirm dozens of items in sequence. Without feedback, users lose confidence about which items they've already handled. The instant opacity change is functionally correct but feels abrupt — a brief animation would create a satisfying "done" micro-moment that encourages the user to keep going.

| Resolution                                                                                                                     | Pros                                                                                                      | Cons                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **A. Animated opacity transition** — `motion.div` with `animate={{ opacity: isResolved ? 0.6 : 1 }}` over 300ms ease-out-quart | Simple, calm, communicates "handled" without being celebratory; matches the app's understated personality | Subtle — may not feel like enough feedback for a deliberate action                                               |
| **B. Opacity + brief scale pulse** — same as A, plus a quick `scale: 1 → 0.98 → 1` pulse on the moment of confirmation         | More noticeable feedback; the slight compression mirrors the button press pattern                         | Slightly more complex; the pulse could feel redundant since the button itself already has `active:scale-[0.97]`  |
| **C. Opacity + check icon animation** — fade in a small animated checkmark alongside the opacity dim                           | Clearest feedback — the checkmark is universally understood                                               | More implementation work; introduces a new visual element; the "Done" text label already communicates completion |

---

### 11. No celebration when the build wizard completes

**What:** After a user walks through all 7 phases of the build wizard — household, income, committed, yearly bills, discretionary, savings, summary — clicking "Finish" in `BuildGuidePanel.tsx:329-343` silently creates a snapshot, deletes the session, and calls `onFinish()`. The wizard simply disappears. There's no toast, no visual celebration, no acknowledgment of what was just accomplished.

**Why it matters:** This is arguably the highest-stakes completion moment in the entire app. The user just built their complete financial waterfall from scratch — the very thing the product exists to help them do. The `WelcomePage` celebrates household creation with confetti, but the build wizard's completion (which is the actual culmination of that journey) gets nothing. The emotional arc goes: excitement (confetti) → work (adding items) → anticlimax (wizard vanishes). The payoff moment is missing.

| Resolution                                                                                                                                                                                                                                                                   | Pros                                                                                                             | Cons                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **A. Dedicated completion screen with delight glow** — After finishing, show a brief full-panel state: "Your waterfall is complete" with the surplus delight glow (Pattern 2) and a view of the completed waterfall. Auto-transition to normal Overview after 3s or on click | Closes the emotional loop; reuses the existing delight glow pattern; the 3s auto-advance means it's not blocking | Adds a transient state; needs careful handling of the build→normal mode transition                                |
| **B. Confetti + celebratory toast** — Reuse the `ConfettiBurst` from WelcomePage + a warmer toast ("Your waterfall is built — here's your first surplus")                                                                                                                    | Consistent celebration language with household creation; minimal new UI; reuses existing component               | Confetti twice in the same session might feel repetitive; toast alone may not feel proportionate to the milestone |
| **C. Toast only** — "Waterfall complete" success toast on finish, nothing else                                                                                                                                                                                               | Minimal effort; no new components                                                                                | Underwhelming for the single biggest onboarding moment; inconsistent with the confetti celebration earlier        |

---

### 12. Toast messages are transactional, not warm

**What:** All 21 success toast messages follow the pattern "[Noun] [past tense verb]" — "Account added", "Profile updated", "Thresholds saved", "Marked as reviewed", "Updated". The single exception is "Review complete — snapshot saved" which at least conveys completion. Error messages follow "Failed to [verb] [noun]".

Example success toasts:

- "Account added" · "Purchase deleted" · "Benchmark saved" · "ISA settings saved" · "Updated" · "Link copied" · "Invite cancelled" · "Member removed"

**Why it matters:** Toast messages are the app's voice — the only moments where FinPlan speaks directly to the user in natural language. The current messages are accurate but emotionless, closer to system logs than human communication. For a brand that aims to feel "calm, empowering, clear" and whose emotional goals include "confidence and control" and "accomplishment and progress," these messages are a missed opportunity to reinforce that the user is making progress and doing well. The user just took a deliberate action — the least the app can do is acknowledge it with warmth.

| Resolution                                                                                                                                                                                                                                              | Pros                                                                                                                                               | Cons                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Add brief context or affirmation to key toasts** — e.g., "Salary added to your income" instead of "Account added", "Review complete — your plan is up to date" instead of "Marked as reviewed". Keep transactional tone for settings/admin actions | Warmer without being patronising; helps users confirm _what_ was changed; scales naturally (high-impact actions get warmth, low-impact stay terse) | Longer messages take more reading time; need to avoid crossing into "you're doing great!" territory that violates the empowering-not-advisory principle |
| **B. Keep terse messages, add contextual detail** — e.g., "Salary added · £2,400/mo" (include the actual value in the toast)                                                                                                                            | Precise, empowering (shows the arithmetic), no personality change needed; confirms the data was saved correctly                                    | Toast formatting becomes more complex; amount needs to be passed through to the toast call; may feel clinical rather than warm                          |
| **C. Leave as-is** — the current messages are functional and unambiguous                                                                                                                                                                                | No effort; consistency across all toasts; no risk of tone missteps                                                                                 | Misses the brand personality; "Updated" is the bare minimum of feedback                                                                                 |

---

### 13. No recognition when all items are fresh

**What:** The staleness system is one of the app's best design decisions — amber dots for stale items, "Still correct" to confirm. But there's no corresponding moment when the user has reviewed everything. After confirming the last stale item on a tier page, the amber dots simply disappear. The Overview waterfall shows zero stale counts, and... nothing. No acknowledgment.

**Why it matters:** "Silence is approval" works for individual items — a healthy value needs no badge. But at the macro level, when a user has just worked through 15 stale items across 3 tiers, the absence of any acknowledgment feels like the work evaporated. The user should feel "I'm done, my plan is current" — not "where did all the dots go?" This is the natural complement to the staleness system: the resolution payoff. The Questions to Consider section already asks "what happens when the waterfall is healthy?" — this is the answer.

| Resolution                                                                                                                                                                                                                                                                                    | Pros                                                                                                                                                                                                    | Cons                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Subtle "All current" indicator on the waterfall** — When zero items are stale across all tiers, show a small text-tertiary label like "All items current" near the surplus, or a faint checkmark. Appears only on the Overview waterfall, not on tier pages                              | Satisfies "silence is approval" at the item level while giving macro-level confirmation; minimal, doesn't create a new attention signal; the user notices it on their next glance, not via interruption | Adds a conditional element to the waterfall; risks becoming visual noise if it's always visible (most users might always be current)                                 |
| **B. One-time toast after clearing last stale item** — When the user confirms the final stale item in any context (tier page or ReviewWizard), show a toast: "Everything's up to date"                                                                                                        | Clear, momentary, goes away; user hears the payoff at the exact right time                                                                                                                              | Only fires once per "freshness cycle"; if the user didn't notice the toast, they missed the moment; might feel odd if they didn't realise it was the last stale item |
| **C. Delight glow on the Overview waterfall when fully fresh** — Similar to the surplus > 0 glow (Pattern 2), show a brief, one-time radial glow across the whole waterfall when all items are current. Amber-tinted, matching the staleness colour, fading from "resolved attention" to calm | Poetic — the attention colour itself dissolves; visceral "everything's good" feeling; reuses the delight glow pattern; fires on mount so it's noticed immediately on returning to Overview              | More implementation effort; needs a "has been shown" flag to avoid firing on every visit; the amber glow might confuse the "amber = attention" semantic              |

**Resolution chosen: B.** After the last stale item on a tier page is confirmed ("Still correct" or saved), check the remaining stale count via `useTierItems` query data. If it reaches 0, fire a Sonner toast: `"All items up to date"`. Scoped to tier pages for now (tier-level freshness). Toast copy is terse and matches brand voice.

---

### 14. Build wizard completion dumps to a bare Overview

**What:** When the build wizard finishes (`BuildGuidePanel.tsx:337` calls `onFinish()`), the user lands on the standard Overview page with no contextual guidance. The right panel shows the default "Analytics — Coming soon" placeholder. There's no orientation — no "here's what you just built" moment, no prompt toward the next natural action (review a specific item, explore the timeline, invite a household member).

**Why it matters:** Onboarding doesn't end when the wizard closes — it ends when the user knows what to do next. The transition from guided (build wizard) to unguided (normal Overview) is the highest drop-off risk in the app. Without a bridge, users stare at their freshly-built waterfall and think "now what?" — which is the opposite of the empowered feeling the product aims for.

| Resolution                                                                                                                                                                                                                                                      | Pros                                                                                                                               | Cons                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **A. Post-build right panel with next steps** — After the wizard closes, populate the right panel with 2-3 contextual suggestions: "Review your first item," "Explore the cashflow calendar," "Invite a household member." Panel dismisses on first interaction | Bridges guided→unguided; fills the dead right panel; suggestions are actionable, not decorative; natural next actions teach the UI | New component; need to track "just finished build" state; risk of feeling patronising if suggestions are obvious  |
| **B. Auto-select the first item** — After build completion, auto-select the first income item so the right panel shows meaningful content immediately                                                                                                           | Zero new UI; the user sees the two-panel layout working immediately; teaches the select→inspect pattern                            | Presumptuous — the user may not want to inspect that item; doesn't communicate "you're done" as clearly           |
| **C. Do nothing — rely on the waterfall itself** — The populated waterfall IS the payoff; it speaks for itself                                                                                                                                                  | No implementation; the waterfall is genuinely satisfying to see populated for the first time                                       | Misses the handoff moment; the dead right panel still dominates 60% of the viewport; "now what?" problem persists |

---

### 15. ReviewWizard closes without a summary moment

**What:** The ReviewWizard's final action (`ReviewWizard.tsx:352-370`) creates a snapshot, deletes the session, shows a toast ("Review complete — snapshot saved"), and immediately closes the overlay. The Summary step (step 5) shows a list of changes and a snapshot name field, but clicking "Save & finish" closes everything instantly. The user goes from an immersive full-screen flow back to the Overview in a single frame.

**Why it matters:** The ReviewWizard is a deliberate, focused session — the user just methodically walked through every financial item in their household. The Summary step is the right place for a payoff, but "Save & finish" short-circuits it. The user sees the summary for as long as it takes them to click the button, then it's gone. If they confirmed 30 items and updated 5, they'll never see that progress reflected back to them (the summary screen is destroyed before they can absorb it). The toast is the only trace.

| Resolution                                                                                                                                                                                                                                                     | Pros                                                                                                                             | Cons                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **A. Brief "Done" state on the Summary step** — After clicking "Save & finish", replace the button with a completion state: checkmark + "Snapshot saved" + "Return to Overview" link. Let the user absorb the summary at their own pace, then leave when ready | Respects the user's time; the summary data is already rendered — just keep it visible; the user leaves when _they_ decide        | Adds an extra click to exit; some users may just want it to close immediately                          |
| **B. Animated close with delight** — On "Save & finish", briefly pulse the summary card, show the toast, then fade out the overlay with a 300ms exit animation rather than instant disappearance                                                               | Smoother exit; the animation communicates "wrapping up" rather than "aborted"; reuses planned animation infrastructure (issue 7) | Doesn't solve the core problem — the summary is still destroyed; user may not notice a 300ms animation |
| **C. Leave the summary step as-is, but improve the toast** — Toast becomes richer: "Review complete — 5 items updated, 30 confirmed. Snapshot saved."                                                                                                          | Minimal change; the toast carries the summary info even after the wizard closes                                                  | Toast text gets long; 4s display time may not be enough to read it; toasts are easy to miss            |

---

### 16. Right-panel detail panels use three different vertical rhythms

**What:** The right-panel detail components — all structurally similar (breadcrumb → heading → content → actions) — use three different `space-y` values for their top-level container:

- `space-y-6` (24px) — `AccountDetailPanel.tsx`
- `space-y-5` (20px) — `ItemDetailPanel.tsx`
- `space-y-4` (16px) — `CommittedBillsPanel.tsx`, `IncomeTypePanel.tsx`, `CashflowCalendar.tsx`

Within `ItemDetailPanel`, the spacing between heading and amount is `mt-1` (4px), but between amount and staleness label it's also `mt-0.5` (2px), creating an uneven internal rhythm that doesn't match the generous outer spacing.

**Why it matters:** These panels occupy the same viewport position (right side of `TwoPanelLayout`, wrapped in `p-6`) and serve the same structural role — showing detail for a selected item. When a user clicks from a committed bill (space-y-4) to an income source (space-y-5) to a wealth account (space-y-6), the layout subtly shifts each time. The inconsistency isn't dramatic enough to notice consciously, but it prevents the panels from feeling like a unified system. The 8px grid spacing principle requires that spacing comes from a deliberate scale, not per-component guesswork.

| Resolution                                                                                                                                                                                                               | Pros                                                                                                                                                        | Cons                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Standardise to `space-y-6` (24px)** — Use the largest value (AccountDetailPanel) as the canonical detail panel rhythm. List panels (CommittedBillsPanel, IncomeTypePanel) keep their internal `space-y-1` for items | Generous, calm, matches the "breathing layouts" design principle; gives clear separation between breadcrumb, heading, chart, and actions                    | List-heavy panels like CommittedBillsPanel may feel too spaced out between their breadcrumb and list — 24px gap before a tight list is a large jump |
| **B. Two-tier system: `space-y-6` for section breaks, `space-y-3` for intra-section** — Major divisions (breadcrumb→heading, heading→chart, chart→actions) get 24px; sub-elements within a section get 12px              | More nuanced rhythm; creates a visual "beat" of tight/generous; matches how the Settings page already works (space-y-12 between sections, space-y-4 within) | Requires restructuring panels to nest sections explicitly; more DOM wrappers                                                                        |
| **C. Leave as-is** — The differences are small (4px between steps) and users won't notice                                                                                                                                | Zero effort; no risk of regression                                                                                                                          | Perpetuates arbitrary values; every new panel contributor will pick their own spacing                                                               |

---

### 17. WealthLeftPanel padding breaks the left-panel convention

**What:** The `TwoPanelLayout` wraps the left panel slot in `p-4` (16px). But `WealthLeftPanel.tsx` uses its own `px-5 pt-5 pb-9` for the hero section and `px-5 pb-5 pt-9` for the body — 20px horizontal padding inside a container that already has 16px. This creates 36px total horizontal padding (16+20), compared to the 16px other left panels get. The WealthLeftPanel's interactive buttons also use `py-1.5` (6px) while the Overview and Planner left panels use `py-2` (8px) or `py-2.5` (10px).

**Why it matters:** The WealthLeftPanel uses a hero/breakout card design that's structurally different from the simple list panels on Overview and Planner pages. The extra padding accommodates the gradient hero and the `-bottom-6` breakout card. But the result is that the Wealth page's left panel feels narrower and more cramped than the others — its buttons have less horizontal breathing room and shorter touch targets. Switching between pages reveals the inconsistency.

| Resolution                                                                                                                                                                                                                                                 | Pros                                                                                                                                                          | Cons                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **A. Remove `p-4` from TwoPanelLayout, let children own their padding** — Each left panel applies its own padding. WealthLeftPanel keeps `px-5`. WaterfallLeftPanel uses `px-4` (matching current effective padding). SubcategoryList gets explicit `px-4` | Each panel controls its own spacing; the breakout card design can have bespoke padding without double-padding; future panels can vary intentionally           | Requires touching every left-panel component; breaks the "layout owns the padding, children own the content" convention           |
| **B. Strip WealthLeftPanel's inner padding, use parent `p-4`** — Rework the hero section to work within `p-4`. Breakout card uses `left-0 right-0` (full width within the 16px container padding)                                                          | Consistent with all other panels; simplifies WealthLeftPanel                                                                                                  | The hero gradient and breakout card were designed for the wider padding; constraining them to 16px may make the hero feel cramped |
| **C. Use negative margins on WealthLeftPanel hero** — Keep TwoPanelLayout `p-4`. Hero section uses `-mx-4 -mt-4 px-5 pt-5` to "break out" of the parent padding, then body returns to normal flow                                                          | Best of both: consistent parent padding, bespoke hero bleed; negative margins are a well-understood pattern for edge-to-edge content within padded containers | Negative margins add complexity; the breakout card's absolute positioning needs recalculation                                     |

---

### 18. List item density is too tight in Wealth panels

**What:** Both `WealthLeftPanel.tsx` and `AccountListPanel.tsx` use `space-y-0.5` (2px) between interactive list buttons. The buttons themselves have `py-1.5` (6px vertical padding), giving a total gap of 2px between clickable rows. By contrast, the Overview's waterfall rows use `space-y-0.5` but with `py-1.5` padding inside, and the tier pages' SubcategoryList uses zero gap but `py-2.5` (10px padding) which provides implicit separation.

Minimum touch target size (WCAG 2.2 Target Size): 24×24px. A row with `py-1.5` and `text-sm` (14px line height) gives roughly `6+14+6 = 26px` — barely passing. The 2px gap means misclicks between adjacent rows are likely.

**Why it matters:** The Wealth page is the densest interface in the app — asset classes, liquidity breakdown, trust beneficiaries, and account lists compete for the same left panel space. Tight spacing is understandable for density, but 2px gaps between interactive targets violate the "precision without density" principle. Financial data should feel scannable and spacious, not spreadsheet-like.

| Resolution                                                                                                                                                                                  | Pros                                                                                        | Cons                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **A. Increase to `space-y-1` (4px) and `py-2` (8px)** — Matches the Overview waterfall row density. Touch targets increase to ~30px with 4px separation                                     | Consistent with Overview; comfortable click targets; still data-dense; meets WCAG           | Uses ~25% more vertical space per row; panels with many accounts may need to scroll more               |
| **B. Remove `space-y-*`, use `py-2.5` (10px) only** — Let the button padding create implicit separation (like SubcategoryList). Zero explicit gap, but larger buttons feel spaced naturally | Cleaner markup; implicit spacing is easier to maintain; matches the SubcategoryList pattern | Even more vertical space consumed; may feel too loose for the Wealth page's information density        |
| **C. Keep 2px gap, increase padding to `py-2`** — Minimal gap change, but larger touch targets reduce misclick risk                                                                         | Minimal layout shift; touch targets improve; density preserved                              | 2px gaps are still visually tight; the visual issue persists even if the functional issue is addressed |

---

### 19. Settings page and panel pages have no shared vertical rhythm convention

**What:** The app's pages use three different approaches to vertical spacing between major content sections:

- **Settings page** — `space-y-12` (48px) between settings sections, via `<div className="max-w-2xl space-y-12">`. Sections internally use `space-y-4` (16px).
- **Overview right panels** — `space-y-4` to `space-y-6` (16-24px) between all elements, no distinction between "section breaks" and "sub-element spacing."
- **Planner left panel** — `space-y-1` (4px) for the whole panel; sections separated by `<hr className="my-2">` (8px margin dividers).

The Settings page has the clearest hierarchy: 48px between logical groups, 16px within groups. Neither the detail panels nor the Planner left panel distinguish between "between groups" and "within groups" spacing.

**Why it matters:** Visual rhythm — alternating tight/generous spacing — is what makes a layout feel intentional rather than auto-generated. The Settings page achieves this naturally. The detail panels and Planner don't, which is why they feel flatter despite having good typography and colour use. When a user navigates from Settings (clear rhythm) to Overview (flat rhythm), the perceived quality drops.

| Resolution                                                                                                                                                                                                                                               | Pros                                                                                                                 | Cons                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Establish a two-tier spacing convention** — Document and apply: "between major sections: `space-y-8` (32px) or `space-y-6` (24px). Within sections: `space-y-3` (12px) or `space-y-2` (8px)." Apply to all detail panels and the Planner left panel | Creates rhythm everywhere; gives future contributors a rule to follow; aligns with the 8px grid                      | Requires restructuring most right-panel components to wrap sections in groups; some panels (CommittedBillsPanel) are so simple they only have one section |
| **B. Use dividers to create rhythm** — Instead of spacing alone, use the Planner's `<hr>` approach: visual dividers between sections, tighter spacing within. Standardise `<hr className="my-4">` (16px) as the section break                            | Visible rhythm; doesn't require restructuring DOM; dividers are already used in WealthLeftPanel and PlannerLeftPanel | Dividers add visual weight; overuse makes the interface feel segmented rather than flowing; goes against "earn every pixel" if dividers are decorative    |
| **C. Leave as-is — each page type has its own density** — Settings is spacious (long-form editing), panels are compact (quick inspection), Planner is tight (list navigation). The differences are intentional                                           | No effort; the argument that different contexts deserve different density is valid                                   | Doesn't explain why similar components (detail panels) have different spacing; "intentional" is a post-hoc justification for arbitrary values             |

---

### 20. PlannerLeftPanel is the most cramped layout in the app

**What:** The `PlannerLeftPanel.tsx` packs two budget sections (Purchases and Gifts), each with a section header, summary row, optional over-budget warning, and navigation buttons, into a `space-y-1` (4px) container. Individual elements use `py-0.5` (2px) for summary rows and `py-1.5` (6px) for buttons. The entire panel content fits in roughly 200px of vertical space — leaving the bottom 60%+ of the 360px-wide, full-height left panel completely empty.

**Why it matters:** The Planner left panel is the opposite problem from the Wealth panel: not too dense, but too compressed at the top with nothing below. The `space-y-1` container pushes everything into a tight cluster at the top of the panel, with no content below the divider. The empty space below doesn't communicate "calm" — it communicates "incomplete." Meanwhile, the content that IS there is so tight that the Purchases and Gifts sections visually merge. The `<hr className="my-2">` divider (8px margin) is the only separation between two distinct budgeting domains.

| Resolution                                                                                                                                                                                                                                                                                     | Pros                                                                                                                    | Cons                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **A. Increase section spacing and anchor content vertically** — Use `space-y-4` (16px) between Purchases/Gifts sections. Move navigation buttons lower or add a footer summary at the bottom of the panel. Use `justify-between` on the outer flex container so content distributes vertically | Feels like a complete panel; both budget sections get room to breathe; anchor content at bottom gives the panel purpose | Stretching two small sections across a tall panel might feel artificially spaced; risk of going from "too tight" to "too sparse" |
| **B. Add contextual content** — The empty space could hold: a mini year comparison, a "next upcoming purchase" preview, or the allocated vs. budget bar chart. These fill the panel with useful information rather than just spacing                                                           | Solves the empty space meaningfully; adds value; makes the Planner left panel feel as rich as the Overview left panel   | New components; scope creep; the Planner is currently simple by design                                                           |
| **C. Increase divider weight and inner spacing only** — Keep content at the top. Change `space-y-1` to `space-y-2` (8px). Change `<hr className="my-2">` to `<hr className="my-4">` (16px). Give each section its own `space-y-1.5` (6px)                                                      | Minimal change; content stays compact but each section has identifiable boundaries; doesn't require new content         | Doesn't solve the empty lower half; still a tight cluster at the top of a tall panel                                             |

---

### 21. Arbitrary font sizes outside the Tailwind scale

**What:** The codebase uses 8 distinct arbitrary pixel sizes via Tailwind's bracket syntax, bypassing the standard type scale:

- `text-[10px]` — ItemAccordion detail labels, SnapshotTimeline date labels, help visuals
- `text-[10.5px]` — WaterfallConnector labels
- `text-[11px]` — WealthLeftPanel section headers, OverviewPageHeader badge, HelpSidebar group labels, EntityAvatar
- `text-[12.5px]` — GhostedListEmpty CTA text
- `text-[13px]` — Waterfall row text, committed/income list rows, empty state labels
- `text-[15px]` — Waterfall tier totals, empty state headings
- `text-[28px]` — WealthLeftPanel net worth hero
- `text-[30px]` — ItemDetailPanel hero amount

The standard Tailwind scale nearby offers `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px). Several arbitrary values sit in gaps between these steps (10, 10.5, 11, 12.5, 13, 15), creating a 14-step effective scale rather than the intended 7-step one.

**Why it matters:** A type scale works by creating clear visual steps — each size should be perceptibly different from its neighbours. When 10, 10.5, 11, 12, 12.5, 13, and 14px all coexist, the steps are too close (0.5–1.5px apart) to create reliable hierarchy. A user scanning the waterfall sees `text-[13px]` row labels and `text-[15px]` tier totals — a 2px difference that's visible only because of the accompanying weight/colour changes. The sizes alone don't carry hierarchy. Meanwhile, `text-[10.5px]` is the only half-pixel size in the app, suggesting it was hand-tuned for one component rather than derived from a system.

| Resolution                                                                                                                                                                                                                                                                                                                                                    | Pros                                                                                                                                                         | Cons                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A. Collapse to standard scale + one custom step** — Map all arbitrary sizes to the nearest Tailwind step: `text-[10px]/text-[10.5px]/text-[11px]` → `text-xs` (12px). `text-[12.5px]/text-[13px]` → `text-xs` or a custom `text-2xs` (11px). `text-[15px]` → keep as a custom token `text-tier-total` (15px). `text-[28px]/text-[30px]` → `text-3xl` (30px) | Reduces the scale to ~8 steps with clear visual separation; every size has a name and a rationale; eliminates sub-12px text that's below readability minimum | Some sizes were tuned for specific layouts (13px row text fits precisely in the waterfall row height); snapping to 12px or 14px may change line counts or require padding adjustment |
| **B. Define a custom compact scale in Tailwind config** — Add named sizes: `text-micro` (10px), `text-mini` (11px), `text-compact` (13px), `text-display-sm` (15px), `text-display-lg` (28px). These become the canonical small-text sizes                                                                                                                    | Preserves the current visual tuning; gives every size a semantic name; future contributors use tokens not arbitrary values                                   | Legitimises a 12-step scale, which is arguably too many distinct sizes; doesn't solve the "steps too close" hierarchy problem                                                        |
| **C. Leave as-is — the arbitrary sizes are intentional per-component decisions**                                                                                                                                                                                                                                                                              | No effort; each component's typography was hand-tuned for its context                                                                                        | No system; every new component will add another arbitrary size; the scale will grow indefinitely                                                                                     |

---

### 22. `font-mono` and `font-numeric` are used interchangeably for financial figures

**What:** The design system defines two Tailwind families that resolve to JetBrains Mono:

- `font-numeric` — semantic name meaning "this is a financial figure"
- `font-mono` — generic name meaning "monospace text"

Both map to `["JetBrains Mono", "Consolas", "Monaco", "monospace"]` in `tailwind.config.js:139/149`. In practice, `font-numeric` (26 occurrences across 13 files) is used in the waterfall, tier pages, and overview panels. `font-mono` (46 occurrences across 18 files) is used in wealth panels, planner, help visuals, design system demos, and code snippets. Several components use `font-mono` for financial figures where `font-numeric` is the design system's intended class:

- `WealthLeftPanel.tsx:70` — net worth hero amount uses `font-mono`, not `font-numeric`
- `PurchaseDetailPanel.tsx:220` — purchase cost uses `font-mono`
- `GiftUpcomingPanel.tsx:70` — date label uses `font-mono`
- `ReviewWizard.tsx` summary — `font-mono` for currency display

**Why it matters:** `font-numeric` and `font-mono` are functionally identical today, but they communicate different intent. `font-numeric` says "this is a financial value that should align tabularly." `font-mono` says "this is code or technical text." If the design system ever changes the numeric typeface (e.g., to a proportional font with tabular-nums, like Inter), `font-mono` instances won't update. More importantly, the inconsistency means the codebase has no single grep target for "all financial figures" — a contributor searching for `font-numeric` will miss half the currency displays.

| Resolution                                                                                                                                                                                                                                              | Pros                                                                                                                                        | Cons                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **A. Replace all financial `font-mono` with `font-numeric`** — Reserve `font-mono` strictly for code snippets and technical text. Grep for `font-mono` in non-design-system files, audit each instance, replace where the content is a financial figure | Clear semantic boundary; one grep target for all financial typography; future typeface changes only need to touch `font-numeric` definition | Requires touching ~15 files; need to audit each instance to distinguish financial figures from code/technical text                 |
| **B. Remove `font-numeric`, use `font-mono` everywhere** — Simplify to one class. Financial figures and code both use JetBrains Mono                                                                                                                    | Simpler; one class instead of two; no confusion about which to use                                                                          | Loses the semantic distinction; can't change numeric typeface independently; "font-mono" doesn't communicate "financial precision" |
| **C. Leave as-is** — both resolve to the same font today; the distinction is aspirational                                                                                                                                                               | No effort; functionally identical                                                                                                           | The semantic drift will worsen as more components are added; no way to distinguish financial figures from code in the codebase     |

---

### 23. Uppercase label treatment is inconsistent across panels

**What:** The app uses uppercase text-xs labels as section headers throughout, but the specific treatment varies:

| Component                            | Size          | Weight          | Tracking                  | Colour                |
| ------------------------------------ | ------------- | --------------- | ------------------------- | --------------------- |
| WaterfallLeftPanel tier labels       | `text-[13px]` | `font-semibold` | `tracking-tier` (0.09em)  | Tier colour           |
| WealthLeftPanel "By Liquidity"       | `text-[10px]` | `font-semibold` | `tracking-widest` (0.1em) | `foreground/55`       |
| WealthLeftPanel "Held on Behalf Of"  | `text-xs`     | `font-medium`   | `tracking-wide` (0.025em) | `foreground/55`       |
| PlannerLeftPanel "Purchases"/"Gifts" | `text-xs`     | `font-medium`   | `tracking-wide`           | `muted-foreground`    |
| PurchaseListPanel section labels     | `text-xs`     | `font-medium`   | `tracking-wide`           | `muted-foreground`    |
| HelpSidebar group labels             | `text-[11px]` | `font-semibold` | `tracking-wider` (0.05em) | `muted-foreground/60` |
| BuildGuidePanel labels               | `text-xs`     | `font-medium`   | `tracking-wider`          | `muted-foreground`    |
| ItemAccordion detail labels          | `text-[10px]` | (default 400)   | `tracking-wide`           | `foreground/30`       |

Four different font sizes (10px, 11px, 12px, 13px), two different weights (`font-medium` vs `font-semibold`), three different tracking values (`tracking-wide`, `tracking-wider`, `tracking-widest`), and four different colour approaches.

**Why it matters:** Uppercase labels serve a single structural role across the entire app: "this is a section header for a group of items below." The waterfall tier labels are intentionally distinct (they have their own `tracking-tier` token and tier colours) — that's a valid exception. But the remaining 7 treatments all serve the same role and should be visually identical. When "Purchases" in the Planner uses `font-medium tracking-wide` but "By Liquidity" in Wealth uses `font-semibold tracking-widest` at a different size, the app feels like it was assembled from separate codebases.

| Resolution                                                                                                                                                                                                                                                                  | Pros                                                                                                                               | Cons                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Create a `SectionLabel` component or Tailwind class** — Canonical treatment: `text-xs font-medium uppercase tracking-wider text-muted-foreground`. Apply everywhere except waterfall tier labels (which keep their unique `tracking-tier` + tier colour treatment)     | Single source of truth; every section header looks identical; easy to change globally                                              | Requires touching every panel that has section headers (~8 components); the Wealth panel's `text-[10px]` labels may look too large at `text-xs` (12px) given the panel's density |
| **B. Document two tiers of labels** — "Primary labels" (`text-xs font-semibold tracking-wider`) for major section headers, "secondary labels" (`text-[10px] font-medium tracking-wide`) for sub-section labels within a panel. Waterfall tier labels remain their own thing | Acknowledges that not all labels are equal; the Wealth panel's dense layout gets a smaller label size; clear rule for which to use | Two patterns instead of one; contributors must decide which tier a label belongs to; the visual difference between the two tiers may be too subtle                               |
| **C. Leave as-is** — each component was designed in context                                                                                                                                                                                                                 | No effort                                                                                                                          | Seven variations of the same structural role; no system; every new component adds another variation                                                                              |

---

### 24. Hardcoded hex colours bypass the design token system for text

**What:** Several components use inline `style={{ color: "#f59e0b" }}` or Tailwind arbitrary values `text-[#cbd5e1]` instead of the design system's colour tokens:

- `CommittedBillsPanel.tsx:75` and `IncomeTypePanel.tsx:80` — `text-[#cbd5e1]` for bill amounts. `#cbd5e1` is Tailwind's `slate-300`, which doesn't exist in the design system. The intended token is likely `text-foreground/60` or `text-text-secondary`.
- `ReviewWizard.tsx:86` — `style={{ color: "#f59e0b" }}` for "Stale" label. `#f59e0b` is the attention colour, but the token `text-attention` exists for exactly this.
- `CashflowCalendar.tsx:51,57` — `style={{ color: "#f59e0b" }}` for shortfall months. Same issue.
- `AccountDetailPanel.tsx:204` — `style={{ color: "#f59e0b" }}` for stale staleness label.
- `ButtonPair.tsx:63` — `color: "#10b981"` for "Still correct" button icon. `#10b981` is a raw green that doesn't map to any token.

**Why it matters:** The design system defines tokens for every colour used in the app — `--attention` for amber, `--text-secondary` for secondary text, `--foreground` at various opacities for data values. Hardcoded hex values bypass this system, meaning a future theme change (or even a colour tuning pass) won't update these elements. The `#cbd5e1` usage is particularly problematic: it's a cool grey that works on the `#080a14` background by coincidence, not by design — it has no semantic relationship to the token system and would break if the background colour changed.

| Resolution                                                                                                                                                                                     | Pros                                                                                                                                          | Cons                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Replace all hardcoded colours with tokens** — `text-[#cbd5e1]` → `text-foreground/60`. `style={{ color: "#f59e0b" }}` → `className="text-attention"`. `color: "#10b981"` → `text-success` | All colours flow from the token system; future theme changes work automatically; removes the only Tailwind arbitrary colour values in the app | Minor visual shifts where the exact hex doesn't match the token precisely (e.g., `#cbd5e1` at full opacity vs `foreground` at 60% opacity will differ slightly) |
| **B. Add the missing hex values as named tokens** — Define `--text-amount: #cbd5e1` in the CSS variables                                                                                       | Preserves current visuals exactly; gives the colours names                                                                                    | Adds tokens that exist only because of implementation accidents; `#cbd5e1` isn't a design decision, it's a Tailwind default that leaked in                      |
| **C. Leave as-is** — the colours are correct visually                                                                                                                                          | No effort                                                                                                                                     | Breaks on theme changes; can't grep for "all attention-coloured text" reliably; signals to contributors that hardcoding is acceptable                           |

---

### 25. Hero amount typography diverges between panels

**What:** The two "hero amount" displays — the large featured financial figure on detail panels — use different treatments:

- `ItemDetailPanel.tsx:174` — `text-[30px] font-numeric font-extrabold text-primary`
- `WealthLeftPanel.tsx:70` — `font-mono text-[28px] font-bold leading-tight`

Different size (30px vs 28px), different weight (`font-extrabold` 800 vs `font-bold` 700), different font class (`font-numeric` vs `font-mono`), different colour (`text-primary` violet vs default `text-foreground`). The SurplusPage has yet another treatment: `font-numeric text-4xl font-bold text-tier-surplus` (36px, 700, teal).

**Why it matters:** Hero amounts are the most prominent typographic element in the app — they're the first thing the eye lands on in any detail view. Three different treatments for the same structural role ("this is the big number") prevents users from building a visual pattern. The Overview's hero is violet, the Wealth hero is white, the Surplus hero is teal — three different semantic messages for "this is the primary figure." The size difference (28, 30, 36px) means the "big number" isn't even consistently big.

| Resolution                                                                                                                                                                                                                                                                            | Pros                                                                                                                 | Cons                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A. Standardise to one hero amount class** — e.g., `text-3xl font-numeric font-extrabold` (30px, 800 weight). Colour varies by context: `text-primary` for waterfall items, `text-foreground` for wealth, `text-tier-surplus` for surplus. Only colour changes, not size/weight/font | Consistent visual weight; the "big number" always looks the same scale; colour variation is intentional and semantic | The Wealth hero at 30px (up from 28px) may feel slightly too large within its smaller container; the Surplus hero at 30px (down from 36px) loses some impact |
| **B. Define two tiers: "display" and "hero"** — "Display" for inline amounts (`text-3xl font-numeric font-extrabold`, 30px). "Hero" for standalone showcase (`text-4xl font-numeric font-bold`, 36px, used only on the Surplus page). Wealth panel uses "display"                     | Allows the Surplus page to maintain its more dramatic treatment; clear rule for which to use                         | Two named sizes that are close together (30px vs 36px); may not be perceptibly different enough to justify two classes                                       |
| **C. Leave as-is** — each panel was designed for its own context                                                                                                                                                                                                                      | No effort                                                                                                            | Three different "big number" treatments with no documented rationale; every new panel will invent a fourth                                                   |

---

### 26. Error messages are generic and unhelpful

**What:** All 10 error toast messages follow the pattern "Failed to [verb] [noun]" with no guidance on what went wrong or what to do:

- "Failed to add account" · "Failed to update profile" · "Failed to create household" · "Failed to confirm item" · "Failed to update item" · "Failed to confirm items" · "Failed to save snapshot" · "Failed to update beneficiary name" · "Failed to add item" · "Failed to complete setup"

The `PanelError` component (`PanelError.tsx:64`) displays a hardcoded "Failed to load" heading regardless of context, with an optional `message` prop that callers use for context ("Could not load your waterfall", "Could not load settings", "Could not load item history").

The one exception is `ReviewWizard.tsx:363`: "A snapshot with that name already exists — change the name" — which explains the problem AND tells the user what to do. This is the correct pattern, used exactly once.

**Why it matters:** "Failed to add account" tells the user what didn't happen, but not why or what to try next. Was it a network error? A validation issue? A server problem? The user's only option is to try again blindly. For a brand that aims to feel empowering and clear, error messages that leave users helpless contradict the core promise. Error moments are when users most need clarity — they're already disoriented.

| Resolution                                                                                                                                                                                                                                                               | Pros                                                                                                                                                           | Cons                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Add cause and recovery guidance to each message** — "Couldn't save — check your connection and try again" for network errors. "That name is already taken — try a different one" for conflicts. Keep the snapshot message pattern as the template                   | Users know what went wrong and what to do; reduces support burden; matches the brand's "empowering" personality; the snapshot message proves the pattern works | Requires error handling to distinguish between network errors, validation errors, and server errors — the backend may not provide enough detail for every case |
| **B. Two-tier approach: generic + contextual** — Keep short toasts for transient errors ("Something went wrong — try again"), but add contextual detail for errors where the cause is known (conflicts, validation). Upgrade PanelError to always use the `message` prop | Pragmatic — not every error has a known cause; avoids misleading specificity; improves the cases where we CAN be specific                                      | "Something went wrong" is still vague; the user doesn't know if retrying will help                                                                             |
| **C. Leave as-is** — the messages are accurate and brief                                                                                                                                                                                                                 | No effort; no risk of incorrect error attribution                                                                                                              | Users are left guessing; the brand feels less empowering in failure states than in success states                                                              |

---

### 27. Delete confirmation dialog uses "Are you sure?" pattern

**What:** The item delete confirmation (`ItemArea.tsx:155-158`) uses:

- Title: "Delete item"
- Message: "Are you sure you want to delete this item?"
- Confirm: "Delete"

The "Are you sure you want to..." pattern is the most generic confirmation dialog in software. It doesn't tell the user what will happen, what "this item" is (no name shown), or whether the action is reversible. Meanwhile, the household leave dialog (`HouseholdSection.tsx:168-169`) does it better: "Leave household?" / "You will lose access to this household's data. This cannot be undone." — it names the consequence.

**Why it matters:** Confirmation dialogs exist to prevent accidental destructive actions. "Are you sure?" adds a click without adding information — the user clicks "Delete" by habit because they already decided to delete. An effective confirmation dialog should make the user pause by naming what they're about to lose. For a financial planning app where deleting an income source or committed bill changes the entire waterfall arithmetic, the stakes are real.

| Resolution                                                                                                                                                                                 | Pros                                                                                                                                                   | Cons                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **A. Name the item and state the consequence** — "Delete '{item name}'? This will remove it from your waterfall and change your surplus calculation." Confirm button: "Delete {item name}" | User sees exactly what they're deleting; the consequence (surplus changes) makes them think twice; follows the household leave dialog's better pattern | Requires passing the item name through to the ConfirmDialog; longer message; "change your surplus calculation" may be alarming      |
| **B. Name the item, skip the consequence** — "Delete '{item name}'?" / "This can't be undone." Confirm: "Delete"                                                                           | Simpler; user sees the name; consequence is generic but honest                                                                                         | Doesn't communicate the financial impact; "This can't be undone" is technically true but uninformative                              |
| **C. Leave as-is** — the dialog is functional                                                                                                                                              | No effort; users understand what "Delete" means                                                                                                        | Missed opportunity; the dialog adds a click without adding information; inconsistent with the better household leave dialog pattern |

---

### 28. Form placeholders lack context

**What:** The `ItemForm.tsx` inline form uses bare placeholders:

- `placeholder="Name"` — name of what?
- `placeholder="Amount"` — in what unit? Monthly? Annual? Pence or pounds?
- `placeholder="Notes (optional)"` — this one is fine

The form appears inline within tier pages (Income, Committed, Discretionary) when the user clicks "+ Add" or "Edit". Because it's inline rather than in a modal with a heading, there's no surrounding label like "Add a new income source" — just two empty inputs that say "Name" and "Amount".

The `aria-label` attributes match the placeholders ("Name", "Amount", "Spend type"), so screen reader users get the same lack of context.

**Why it matters:** Placeholders disappear when the user starts typing, so they're unreliable as labels. More importantly, "Amount" is ambiguous in a financial app — is it monthly, annual, or total? The form does have a "Monthly/Yearly/One-off" select next to it, which implies the amount should be entered in the selected frequency. But this relationship isn't stated — the user has to infer that "Amount" means "the amount per [selected frequency]." For a first-time user adding their salary, typing "45000" into "Amount" with "Monthly" selected would be a common error.

| Resolution                                                                                                                                                                                                                       | Pros                                                                                                         | Cons                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **A. Add visible labels above inputs** — "Item name" and "Amount (per month)" / "Amount (per year)" that updates dynamically based on the frequency select                                                                       | Unambiguous; labels persist while typing; the dynamic label makes the amount-frequency relationship explicit | Takes more vertical space in the inline form; requires wiring the label to the spend type state  |
| **B. Use contextual placeholders** — `placeholder="e.g. Netflix"` (for committed bills) or `placeholder="e.g. 2,400"` with a prefix "£" visual. Keep the select but add a suffix label: "Amount" input → "£ [input] /mo" display | Examples teach format; the prefix/suffix makes the unit clear; less vertical space than full labels          | Requires per-tier placeholder text; the prefix/suffix adds visual complexity to the compact form |
| **C. Leave as-is** — the spend type select clarifies the amount context                                                                                                                                                          | No effort; power users won't be confused                                                                     | First-time users may enter annual salary as monthly amount; the error isn't caught by validation |

---

### 29. Empty state copy is imperative where it could be inviting

**What:** The tier page empty states (`emptyStateCopy.ts`) all use imperative commands:

- "Add your salary" · "Add your dividends" · "Add your housing costs" · "Add your utilities" · "Add your food budget" · "Add your fun spending" · "Add your savings"

The `GhostedListEmpty` empty states vary more — some are descriptive ("Plan purchases with cost, priority, and funding source"), some are declarative ("No purchases planned yet"), and some are instructional ("Add gift recipients to see upcoming events"). The planner's "No upcoming gift events" and "No gift people yet" are particularly flat — they state the absence without offering a path forward (and `showCta={false}` means no button is shown).

**Why it matters:** Empty states are high-leverage moments — they're what every new user sees first in each section. The imperative "Add your..." pattern isn't wrong, but it's transactional rather than empowering. The user is told to perform a task, not shown why the task is valuable. Compare "Add your salary" (command) with "Employment income, take-home pay" (the body text that follows) — the body text is more useful because it clarifies what belongs in this category. The GhostedListEmpty instances that don't show a CTA button ("No upcoming gift events") are dead ends — the user sees empty space with no action available.

| Resolution                                                                                                                                                                                                                                       | Pros                                                                                                                                     | Cons                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Lead with the value, follow with the action** — "Track your take-home pay" instead of "Add your salary". "See where your committed bills go each month" instead of "Add your housing costs". Keep the "+ Add item" CTA button as the action | Empowering rather than commanding; the user understands why before they act; aligns with the "empowering, not advisory" design principle | Longer headings; the tier pages are compact so space is limited; the current copy is arguably clearer for repeat users who just want to add an item |
| **B. Combine heading and body into a single descriptive line** — Remove the imperative heading. Show: "Employment income, take-home pay — [+ Add]". The description IS the CTA context                                                           | More compact; no separate heading/body; the user sees exactly what goes here; less visual hierarchy but more information density         | Loses the heading/body visual structure; the "+ Add" button may be less prominent without a heading above it                                        |
| **C. Leave as-is** — the imperative pattern is clear and action-oriented                                                                                                                                                                         | No effort; the copy is unambiguous; power users prefer brevity                                                                           | Misses the opportunity to teach and empower; the "Add your..." pattern feels like a checklist rather than a guided experience                       |

---

### 30. "Data may be outdated" uses different terminology from the staleness system

**What:** The `StaleDataBanner.tsx:31` shows "Data may be outdated — last synced {timeAgo}" when network sync fails. The rest of the app uses "stale" exclusively to describe data that needs review — amber dots, "X stale" count badges, "Still correct" confirmation buttons, the "Staleness thresholds" settings section. "Outdated" appears nowhere else in the app.

**Why it matters:** "Stale" and "outdated" mean different things in FinPlan. "Stale" means "this item hasn't been reviewed in N months — the user should confirm it's still accurate." "Outdated" (in the banner context) means "the app couldn't reach the server — the data on screen may not reflect the latest changes." These are genuinely different concepts, but using two different words for "data that might not be current" creates ambiguity. A user seeing "Data may be outdated" alongside "3 stale" items might wonder whether these are related or separate problems. The banner could use "stale" (which would be incorrect — it's a sync issue, not a review issue) or the rest of the app could use "outdated" (which would lose the specific staleness meaning). The real issue is that the banner needs a term that's distinct from both.

| Resolution                                                                                                                                                                | Pros                                                                                                                                                                                    | Cons                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Rephrase the banner without "outdated"** — "Showing cached data — last synced {timeAgo}. [Retry]" or "Couldn't reach the server — you're seeing saved data. [Retry]" | Avoids the "outdated" vs "stale" confusion; explains the cause (network/sync) rather than the symptom; "cached data" / "saved data" is accurate and distinct from the staleness concept | Longer message; "cached" is mildly technical (though most users understand it from browser contexts)                                    |
| **B. Use "out of sync"** — "Data may be out of sync — last synced {timeAgo}"                                                                                              | Distinct from "stale"; communicates the network cause; brief                                                                                                                            | "Out of sync" implies the data was in sync before, which may not always be true (e.g., first visit with no connection)                  |
| **C. Leave as-is** — "outdated" is plain English and users will understand                                                                                                | No effort; the banner is rarely shown (only on sync failure)                                                                                                                            | Introduces a second term for "data that might not be current" into an app that otherwise uses a single, consistent staleness vocabulary |

---

## Minor Observations

- **WaterfallConnector text size** (`WaterfallConnector.tsx`): `text-[10.5px]` is below the 12px minimum for comfortable reading. These labels teach the waterfall model — making them 11-12px would help legibility without changing visual weight.

- **Login/Register shadow** (`LoginPage.tsx`, `RegisterPage.tsx`): These use `shadow-lg` on the card — the only place in the app where drop shadows are used prominently. The rest of the app relies on borders and background differentiation. Consider aligning with the established visual language.

- **Password strength colours** (`RegisterPage.tsx`): Uses `bg-destructive` (red) and `bg-success` (green) — colors the design system explicitly reserves for app errors and UI confirmations. Valid as UI feedback, but worth noting the semantic tension with the "red = errors only, green = confirmations only" rule.

- **Build mode header** (`OverviewPage.tsx:263-272`): Uses `bg-primary/5` — a barely perceptible violet tint. For a mode change as significant as build vs. normal, the visual distinction should be stronger.

- **Snapshot timeline** (`SnapshotTimeline.tsx`): The drag-to-pan interaction isn't visually signaled. Consider `cursor: grab` or a subtle scroll indicator to communicate that the timeline is pannable.

---

## Questions to Consider

- **What if the Overview didn't force a two-panel layout?** If no item is selected, the waterfall could span the full width, with the right panel sliding in on selection. This would eliminate the dead zone and make the waterfall feel more commanding.

- **Does the Surplus page need its own page?** The left panel shows the arithmetic, the right shows a single number. This could be a section within Overview rather than a standalone page — especially since it duplicates data already visible in the waterfall.

- **What would a confident version of the empty states look like?** Instead of gradient cards that say "nothing here, click to add," what if the empty state showed a realistic preview of what the populated state looks like? The `OverviewEmptyState` ghosted cascade already does this — extend the principle.

- **Is the nav doing too much for a focused tool?** Nine items (Overview, Income, Committed, Discretionary, Surplus, Goals, Gifts, Help, Settings) is a lot for a horizontal nav bar. The four tier pages share the same component structure — could they be tabs within a single "Planner" page?

- **What happens when the waterfall is healthy?** The "silence is approval" principle is well-implemented for individual items. But at the macro level, when everything is reviewed and surplus is above benchmark, the Overview just shows a list with no celebration. Is there a moment of designed calm that affirms "your plan is solid"?
