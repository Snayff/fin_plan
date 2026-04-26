/** @type {import('tailwindcss').Config} */
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const tailwindAnimate = require("tailwindcss-animate");

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          subtle: "hsl(var(--primary-subtle))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          subtle: "hsl(var(--destructive-subtle))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Status — non-judgemental
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        // Attention — amber (the only "noteworthy" signal)
        attention: {
          DEFAULT: "hsl(var(--attention))",
          bg: "hsl(var(--attention-bg))",
          border: "hsl(var(--attention-border))",
        },
        // Page accent — soft violet for non-tier pages
        "page-accent": "hsl(var(--page-accent))",
        // Surfaces
        "surface-elevated": {
          DEFAULT: "hsl(var(--surface-elevated))",
          border: "hsl(var(--surface-elevated-border))",
        },
        "surface-overlay": {
          DEFAULT: "hsl(var(--surface-overlay))",
          border: "hsl(var(--surface-overlay-border))",
        },
        // Text hierarchy
        text: {
          secondary: "hsl(var(--text-secondary))",
          tertiary: "hsl(var(--text-tertiary))",
          muted: "hsl(var(--text-muted))",
        },
        // Chart colors
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // Waterfall tier colours — semantically protected
        tier: {
          income: "hsl(var(--tier-income))",
          "income-subtle": "hsl(var(--tier-income-subtle))",
          surplus: "hsl(var(--tier-surplus))",
          "surplus-subtle": "hsl(var(--tier-surplus-subtle))",
          committed: "hsl(var(--tier-committed))",
          "committed-subtle": "hsl(var(--tier-committed-subtle))",
          discretionary: "hsl(var(--tier-discretionary))",
          "discretionary-subtle": "hsl(var(--tier-discretionary-subtle))",
        },
      },
      borderRadius: {
        none: "0",
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      zIndex: {
        base: "0",
        sticky: "10",
        banner: "20",
        dropdown: "30",
        "modal-overlay": "40",
        modal: "50",
        toast: "60",
        tooltip: "70",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "350ms",
        achievement: "600ms",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
      },
      fontFamily: {
        heading: ["Outfit", "system-ui", "sans-serif"],
        body: ["Nunito Sans", "system-ui", "sans-serif"],
        numeric: ["JetBrains Mono", "Consolas", "Monaco", "monospace"],
        sans: [
          "Nunito Sans",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Consolas", "Monaco", "Courier New", "monospace"],
      },
      letterSpacing: {
        heading: "-0.025em",
        tier: "0.09em",
      },
      lineHeight: {
        heading: "1.15",
      },
      fontSize: {
        connector: ["10.5px", { lineHeight: "1.4" }],
        tier: ["13px", { lineHeight: "1.4" }],
        "tier-total": ["15px", { lineHeight: "1.4" }],
        hero: ["30px", { lineHeight: "1.15" }],
      },
    },
  },
  plugins: [tailwindAnimate],
};
