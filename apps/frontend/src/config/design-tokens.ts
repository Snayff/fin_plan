/**
 * Design Token Configuration
 *
 * This file serves as the single source of truth for all design decisions.
 * All colors, typography, spacing, and animation values are defined here
 * and can be easily configured and amended.
 *
 * Design rules and constraints: docs/renew-finplan/design-system.md
 *
 * NOTE: Specific colour values (HSL numbers) are intentionally placeholder
 * until confirmed during implementation. The semantic role of each token is
 * the authoritative decision — not the specific value.
 */

// ============================================================================
// COLOR TOKENS (Primitive Layer)
// ============================================================================

/**
 * Base color palette converted to HSL
 * HSL format allows for better manipulation and theming
 */
export const primitiveColors = {
  // Foundations
  background: { h: 230, s: 31, l: 15 },        // #191D32
  surface: { h: 230, s: 27, l: 19 },           // #22263D
  border: { h: 230, s: 27, l: 26 },            // #2F3452
  
  // Text Hierarchy
  textPrimary: { h: 230, s: 29, l: 96 },       // #F2F3F7
  textSecondary: { h: 230, s: 23, l: 82 },     // #C7CAD9
  textTertiary: { h: 230, s: 20, l: 67 },      // #9DA1B8
  
  // Brand (Purple/Rose Identity)
  brandPrimary: { h: 320, s: 23, l: 62 },      // #B38BA3
  brandSubtle: { h: 270, s: 20, l: 22 },       // #3A2F44
  
  // Primary Action (Orange - Focus & Momentum)
  actionPrimary: { h: 25, s: 100, l: 55 },     // #FF7A18
  actionPrimaryHover: { h: 25, s: 88, l: 49 }, // #E66D15
  actionPrimarySubtle: { h: 25, s: 32, l: 17 }, // #3B2A1E
  
  // Income / Surplus (Teal - Positive flow)
  // Used for: tier-income, tier-surplus, income values, surplus-positive signal
  income: { h: 177, s: 95, l: 39 },            // #07BEB8
  incomeHover: { h: 177, s: 95, l: 35 },       // #06A9A3
  incomeSubtle: { h: 190, s: 38, l: 20 },      // #1F3F46

  // Committed (Blue-slate - Neutral / Obligatory)
  // Used for: tier-committed accent
  committed: { h: 230, s: 35, l: 63 },         // placeholder ~#8090C0
  committedSubtle: { h: 230, s: 27, l: 22 },   // placeholder

  // Staleness / Surplus-warning (Warm Amber - Neutral Awareness)
  // Used for: staleness indicator, surplus-warning signal, stale count badges
  staleness: { h: 30, s: 61, l: 70 },          // #E0B084
  stalenessSubtle: { h: 30, s: 24, l: 18 },    // #3A3123

  // Shortfall / Destructive (Red - Rare, Explicit Only)
  // Used for: genuine cashflow shortfalls, data loss actions
  destructive: { h: 358, s: 75, l: 59 },       // #E5484D
  destructiveSubtle: { h: 350, s: 33, l: 19 }, // #402024
} as const;

/**
 * Helper to convert HSL object to CSS HSL string
 */
export const toHsl = (color: { h: number; s: number; l: number }): string => {
  return `${color.h} ${color.s}% ${color.l}%`;
};

// ============================================================================
// SEMANTIC COLOR TOKENS
// ============================================================================

/**
 * Semantic color roles mapped to primitive colors
 * These represent the meaning/purpose of colors in the UI
 */
export const semanticColors = {
  // Core UI
  background: primitiveColors.background,
  foreground: primitiveColors.textPrimary,
  
  // Cards & Surfaces
  card: primitiveColors.surface,
  cardForeground: primitiveColors.textPrimary,
  
  // Popovers & Overlays
  popover: primitiveColors.surface,
  popoverForeground: primitiveColors.textPrimary,
  
  // Primary Actions (Orange)
  primary: primitiveColors.actionPrimary,
  primaryForeground: primitiveColors.textPrimary,
  primaryHover: primitiveColors.actionPrimaryHover,
  primarySubtle: primitiveColors.actionPrimarySubtle,
  
  // Secondary Actions (Muted)
  secondary: primitiveColors.border,
  secondaryForeground: primitiveColors.textPrimary,
  
  // Muted/Disabled
  muted: primitiveColors.border,
  mutedForeground: primitiveColors.textTertiary,
  
  // Accent (Brand)
  accent: primitiveColors.brandPrimary,
  accentForeground: primitiveColors.textPrimary,
  accentSubtle: primitiveColors.brandSubtle,
  
  // Income / Surplus-positive (Teal — positive flow)
  income: primitiveColors.income,
  incomeForeground: primitiveColors.textPrimary,
  incomeHover: primitiveColors.incomeHover,
  incomeSubtle: primitiveColors.incomeSubtle,

  // Waterfall tier accents
  tierIncome: primitiveColors.income,
  tierSurplus: primitiveColors.income,          // Surplus shares income's teal
  tierCommitted: primitiveColors.committed,
  tierCommittedSubtle: primitiveColors.committedSubtle,
  tierDiscretionary: primitiveColors.staleness, // Discretionary uses warm amber
  tierDiscretionarySubtle: primitiveColors.stalenessSubtle,

  // Staleness / Surplus-warning (Amber — neutral awareness)
  staleness: primitiveColors.staleness,
  stalenessForeground: primitiveColors.textPrimary,
  stalenessSubtle: primitiveColors.stalenessSubtle,

  // Shortfall / Destructive (Red — rare, explicit only)
  destructive: primitiveColors.destructive,
  destructiveForeground: primitiveColors.textPrimary,
  destructiveSubtle: primitiveColors.destructiveSubtle,
  
  // Borders & Inputs
  border: primitiveColors.border,
  input: primitiveColors.border,
  ring: primitiveColors.actionPrimary,
  
  // Chart colors (for Recharts — waterfall and history graphs)
  chart1: primitiveColors.income,            // Teal (income / surplus-positive)
  chart2: primitiveColors.staleness,         // Amber (discretionary / staleness)
  chart3: primitiveColors.committed,         // Blue-slate (committed spend)
  chart4: primitiveColors.brandPrimary,      // Purple/Rose (tertiary series)
  chart5: primitiveColors.actionPrimary,     // Orange (CTAs, highlights in charts)
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

/**
 * Typography scale designed for accessibility
 * - Larger base size for older users
 * - High x-height fonts recommended
 * - Clear numerical distinction
 */
export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif'
    ].join(', '),
    mono: [
      'JetBrains Mono',
      'Consolas',
      'Monaco',
      'Courier New',
      'monospace'
    ].join(', '),
  },
  
  // Font Sizes (generous for accessibility)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px (larger default)
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line Heights (generous for readability)
  lineHeight: {
    heading: 1.15,   // 115% — for h1–h3 heading elements (110–120% range)
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    heading: '-0.025em',  // −2.5% — for h1–h3 heading elements (−2% to −3% range)
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

/**
 * Spacing scale following 8px base grid
 * Generous by default per design principles
 */
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

/**
 * Border radius values for consistent rounding
 */
export const borderRadius = {
  none: '0',
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

/**
 * Animation configuration
 * - Calm by default
 * - Energetic for achievements/major actions
 * - Respects prefers-reduced-motion
 */
export const animation = {
  // Duration
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    achievement: '600ms', // For celebration animations
  },
  
  // Easing
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // For achievements
  },
  
  // Scale for achievements
  achievementScale: {
    start: '0.9',
    peak: '1.05',
    end: '1',
  },
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

/**
 * Shadow values for depth and elevation
 */
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

/**
 * Component-level configuration
 */
export const components = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px - generous tap target
      lg: '3rem',      // 48px
    },
    // Padding rule: horizontal = 2× vertical
    padding: {
      sm: '0.5rem 1rem',       // 8px / 16px
      md: '0.625rem 1.25rem',  // 10px / 20px
      lg: '0.75rem 1.5rem',    // 12px / 24px
    },
    // All five states must be provisioned: default, hovered, pressed, disabled, loading
  },
  
  input: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
    // All six states must be provisioned:
    // unselected, focused (ring: actionPrimary), error (destructive), warning (staleness),
    // disabled (opacity-50), success/valid (income/teal)
  },
  
  card: {
    padding: {
      sm: '1rem',      // 16px
      md: '1.5rem',    // 24px - default generous
      lg: '2rem',      // 32px
    },
  },
} as const;

// ============================================================================
// ACCESSIBILITY TOKENS
// ============================================================================

/**
 * Accessibility configuration
 */
export const accessibility = {
  // Minimum contrast ratios (WCAG AA)
  minContrast: {
    text: 4.5,
    largeText: 3,
    ui: 3,
  },
  
  // Minimum touch target sizes
  minTouchTarget: {
    width: '44px',
    height: '44px',
  },
  
  // Focus indicator width
  focusRingWidth: '2px',
  focusRingOffset: '2px',
} as const;

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

/**
 * Typography font roles.
 * font-ui   → Inter     — all labels, copy, navigation, headings
 * font-numeric → JetBrains Mono — all monetary values and numerical data
 */
export const fontRoles = {
  ui: 'Inter, system-ui, -apple-system, sans-serif',
  numeric: '"JetBrains Mono", Consolas, Monaco, monospace',
} as const;

export const designTokens = {
  primitiveColors,
  semanticColors,
  fontRoles,
  typography,
  spacing,
  borderRadius,
  animation,
  shadows,
  components,
  accessibility,
  toHsl,
} as const;

export default designTokens;
