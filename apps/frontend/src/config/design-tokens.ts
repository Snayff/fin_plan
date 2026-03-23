/**
 * Design Token Configuration
 *
 * Single source of truth for all design decisions.
 * Source: docs/renew-finplan/design/design-system.md
 *
 * Three-font system: Outfit (headings), Nunito Sans (body), JetBrains Mono (numbers).
 * Dark theme only. No light mode.
 */

// ============================================================================
// COLOR TOKENS (Primitive Layer)
// ============================================================================

export const primitiveColors = {
  // Background & Depth
  background: { h: 225, s: 45, l: 5 }, // #080a14

  // Surfaces — three elevation levels
  surface: { h: 225, s: 37, l: 9 }, // #0d1120
  surfaceBorder: { h: 225, s: 32, l: 16 }, // #1a1f35
  surfaceElevated: { h: 224, s: 36, l: 13 }, // #141b2e
  surfaceElevatedBorder: { h: 224, s: 33, l: 20 }, // #222c45
  surfaceOverlay: { h: 224, s: 33, l: 18 }, // #1c2540
  surfaceOverlayBorder: { h: 224, s: 32, l: 24 }, // #2a3558

  // Text Hierarchy — blue-white tint (base rgb 238,242,255) at varying opacities
  textPrimary: { h: 230, s: 100, l: 97, a: 0.92 },
  textSecondary: { h: 230, s: 100, l: 97, a: 0.65 },
  textTertiary: { h: 230, s: 100, l: 97, a: 0.4 },
  textMuted: { h: 230, s: 100, l: 97, a: 0.25 },

  // Action — electric violet
  action: { h: 263, s: 84, l: 52 }, // #7c3aed
  actionHover: { h: 263, s: 84, l: 45 }, // ~#6928d4
  actionSubtle: { h: 263, s: 40, l: 15 },

  // Page Accent — soft violet (non-tier pages)
  pageAccent: { h: 258, s: 90, l: 66 }, // #8b5cf6

  // Tier Colours — semantically protected
  tierIncome: { h: 199, s: 86, l: 49 }, // #0ea5e9 — energetic electric blue
  tierCommitted: { h: 239, s: 84, l: 67 }, // #6366f1 — settled indigo
  tierCommittedSubtle: { h: 239, s: 40, l: 18 },
  tierDiscretionary: { h: 271, s: 91, l: 65 }, // #a855f7 — expressive purple
  tierDiscretionarySubtle: { h: 271, s: 40, l: 18 },
  tierSurplus: { h: 175, s: 72, l: 57 }, // #4adcd0 — rewarding teal-mint

  // Attention — amber (the only "noteworthy" signal)
  attention: { h: 38, s: 92, l: 50 }, // #f59e0b
  attentionBg: { h: 38, s: 92, l: 50, a: 0.04 },
  attentionBorder: { h: 38, s: 92, l: 50, a: 0.08 },

  // Status — non-judgemental
  error: { h: 0, s: 84, l: 60 }, // #ef4444 — app errors only
  errorSubtle: { h: 0, s: 40, l: 15 },
  success: { h: 142, s: 71, l: 45 }, // #22c55e — UI confirmations only

  // Callout gradients — engagement and special highlights
  calloutPrimaryFrom: { h: 199, s: 86, l: 49 }, // #0ea5e9
  calloutPrimaryTo: { h: 271, s: 91, l: 65 }, // #a855f7
  calloutSecondaryFrom: { h: 271, s: 91, l: 65 }, // #a855f7
  calloutSecondaryTo: { h: 175, s: 72, l: 57 }, // #4adcd0
} as const;

/**
 * Helper to convert HSL object to CSS HSL string.
 * Supports optional alpha for text opacity tokens.
 */
export const toHsl = (color: { h: number; s: number; l: number; a?: number }): string => {
  if (color.a !== undefined) {
    return `${color.h} ${color.s}% ${color.l}% / ${color.a}`;
  }
  return `${color.h} ${color.s}% ${color.l}%`;
};

// ============================================================================
// SEMANTIC COLOR TOKENS
// ============================================================================

export const semanticColors = {
  // Core UI
  background: primitiveColors.background,
  foreground: primitiveColors.textPrimary,

  // Surfaces
  card: primitiveColors.surface,
  cardForeground: primitiveColors.textPrimary,
  surfaceElevated: primitiveColors.surfaceElevated,
  surfaceElevatedBorder: primitiveColors.surfaceElevatedBorder,
  surfaceOverlay: primitiveColors.surfaceOverlay,
  surfaceOverlayBorder: primitiveColors.surfaceOverlayBorder,

  // Popovers & Overlays
  popover: primitiveColors.surfaceElevated,
  popoverForeground: primitiveColors.textPrimary,

  // Action (electric violet)
  primary: primitiveColors.action,
  primaryForeground: { h: 0, s: 0, l: 100 },
  primaryHover: primitiveColors.actionHover,
  primarySubtle: primitiveColors.actionSubtle,

  // Page Accent
  pageAccent: primitiveColors.pageAccent,

  // Secondary Actions (Muted)
  secondary: primitiveColors.surfaceBorder,
  secondaryForeground: primitiveColors.textPrimary,

  // Muted/Disabled
  muted: primitiveColors.surfaceBorder,
  mutedForeground: primitiveColors.textTertiary,

  // Accent (maps to page-accent for shadcn compat)
  accent: primitiveColors.pageAccent,
  accentForeground: primitiveColors.textPrimary,

  // Status — non-judgemental
  success: primitiveColors.success,
  successForeground: { h: 0, s: 0, l: 100 },
  destructive: primitiveColors.error,
  destructiveForeground: { h: 0, s: 0, l: 100 },
  destructiveSubtle: primitiveColors.errorSubtle,

  // Attention (amber)
  attention: primitiveColors.attention,
  attentionBg: primitiveColors.attentionBg,
  attentionBorder: primitiveColors.attentionBorder,

  // Waterfall tier accents
  tierIncome: primitiveColors.tierIncome,
  tierCommitted: primitiveColors.tierCommitted,
  tierCommittedSubtle: primitiveColors.tierCommittedSubtle,
  tierDiscretionary: primitiveColors.tierDiscretionary,
  tierDiscretionarySubtle: primitiveColors.tierDiscretionarySubtle,
  tierSurplus: primitiveColors.tierSurplus,

  // Callout gradients
  calloutPrimaryFrom: primitiveColors.calloutPrimaryFrom,
  calloutPrimaryTo: primitiveColors.calloutPrimaryTo,
  calloutSecondaryFrom: primitiveColors.calloutSecondaryFrom,
  calloutSecondaryTo: primitiveColors.calloutSecondaryTo,

  // Borders & Inputs
  border: primitiveColors.surfaceBorder,
  input: primitiveColors.surfaceBorder,
  ring: primitiveColors.action,

  // Chart colors
  chart1: primitiveColors.tierIncome,
  chart2: primitiveColors.tierCommitted,
  chart3: primitiveColors.tierDiscretionary,
  chart4: primitiveColors.tierSurplus,
  chart5: primitiveColors.action,
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

/**
 * Three fonts, strict roles:
 * - Outfit: headings, tier names, wordmark, button labels, nav links
 * - Nunito Sans: body text, item labels, descriptions, metadata, breadcrumbs
 * - JetBrains Mono: all monetary values, percentages, numerical data
 *
 * Inter is not used anywhere.
 */
export const typography = {
  fontFamily: {
    heading: ["Outfit", "system-ui", "sans-serif"].join(", "),
    body: ["Nunito Sans", "system-ui", "sans-serif"].join(", "),
    numeric: ["JetBrains Mono", "Consolas", "Monaco", "monospace"].join(", "),
    // sans maps to body for Tailwind default
    sans: [
      "Nunito Sans",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "sans-serif",
    ].join(", "),
  },

  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    heading: 1.15,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    heading: "-0.025em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    tier: "0.09em", // tier headings — uppercase tracking
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
} as const;

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export const borderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  md: "0.5rem", // 8px — cards, modals, toasts, inputs, buttons
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px", // EntityAvatar, badges, indicator dots
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const animation = {
  duration: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms",
    achievement: "600ms",
  },

  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  achievementScale: {
    start: "0.9",
    peak: "1.05",
    end: "1",
  },
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

/**
 * Dark theme uses border contrast, not elevation shadows.
 * Shadows are available but should rarely be used.
 */
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  none: "none",
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  button: {
    height: {
      sm: "2rem", // 32px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
    },
    // Padding rule: horizontal = 2× vertical
    padding: {
      sm: "0.5rem 1rem", // 8px / 16px
      md: "0.625rem 1.25rem", // 10px / 20px
      lg: "0.75rem 1.5rem", // 12px / 24px
    },
  },

  input: {
    height: {
      sm: "2rem", // 32px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
    },
  },

  card: {
    padding: {
      sm: "1rem", // 16px
      md: "1.5rem", // 24px
      lg: "2rem", // 32px
    },
  },
} as const;

// ============================================================================
// ACCESSIBILITY TOKENS
// ============================================================================

export const accessibility = {
  minContrast: {
    text: 4.5,
    largeText: 3,
    ui: 3,
  },

  minTouchTarget: {
    width: "44px",
    height: "44px",
  },

  focusRingWidth: "2px",
  focusRingOffset: "2px",
} as const;

// ============================================================================
// FONT ROLES
// ============================================================================

/**
 * Three fonts, strict roles:
 * font-heading → Outfit    — tier names, headlines, wordmark, button labels, nav links, section headers
 * font-body    → Nunito Sans — item labels, descriptions, metadata, helper text, breadcrumbs, body copy
 * font-numeric → JetBrains Mono — all monetary values, percentages, and numerical data
 */
export const fontRoles = {
  heading: "'Outfit', system-ui, sans-serif",
  body: "'Nunito Sans', system-ui, sans-serif",
  numeric: "'JetBrains Mono', Consolas, Monaco, monospace",
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 0,
  sticky: 10,
  banner: 20,
  dropdown: 30,
  modalOverlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

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
  zIndex,
  toHsl,
} as const;

export default designTokens;
