# Design System Documentation

## Overview

This design system implements a comprehensive token-based approach to ensure consistent UI/UX across the application. All design decisions flow from the design tokens defined in `apps/frontend/src/config/design-tokens.ts`.

## Architecture

### Three-Layer Token System

```
┌─────────────────────────────────┐
│   Primitive Tokens              │  ← Base HSL color values
│   (colors, spacing, typography) │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Semantic Tokens               │  ← Purpose-based naming
│   (primary, success, warning)   │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Component Tokens              │  ← Component-specific
│   (button sizes, card padding)  │
└─────────────────────────────────┘
```

## Color System

### Color Roles

All colors are purpose-driven, not just hue-based:

#### Core UI
- **Background** - `#191D32` - Main app background (dark mode only)
- **Foreground** - `#F2F3F7` - Primary text color
- **Card/Surface** - `#22263D` - Card and panel backgrounds
- **Border** - `#2F3452` - Dividers and input borders

#### Text Hierarchy
- **Primary Text** - `#F2F3F7` - Main content
- **Secondary Text** - `#C7CAD9` - Supporting information
- **Tertiary Text** - `#9DA1B8` - De-emphasized content

#### Action Colors
- **Primary (Orange)** - `#FF7A18` - Focus & momentum
  - Use for: Primary actions, CTAs, focus indicators
  - Hover: `#E66D15`
  - Subtle: `#3B2A1E`

- **Success (Teal)** - `#07BEB8` - Calm positive feedback
  - Use for: Income, progress, success states
  - Hover: `#06A9A3`
  - Subtle: `#1F3F46`

- **Brand (Purple/Rose)** - `#B38BA3` - Identity
  - Use for: Branding elements, accent features
  - Subtle: `#3A2F44`

#### Feedback Colors
- **Warning (Warm Orange)** - `#E0B084` - Neutral awareness
  - Use for: Attention needed (not urgent)
  - Subtle: `#3A3123`

- **Destructive (Red)** - `#E5484D` - Rare, explicit only
  - Use for: True errors, data loss warnings
  - Subtle: `#402024`
  - **IMPORTANT**: Use sparingly to avoid shame/pressure

- **Highlight (Magenta)** - `#8F3985` - Supportive emphasis
  - Use for: Important but not urgent information
  - Subtle: `#2F2038`

### Chart Colors

Configured for Recharts compatibility:
1. **Chart-1**: Teal (`#07BEB8`) - Primary data series
2. **Chart-2**: Orange (`#FF7A18`) - Secondary data
3. **Chart-3**: Purple/Rose (`#B38BA3`) - Tertiary data
4. **Chart-4**: Magenta (`#8F3985`) - Additional series
5. **Chart-5**: Warm Orange (`#E0B084`) - Additional series

## Typography

### Font Family
- **Primary**: Inter (via Google Fonts)
- **Fallback**: system-ui, -apple-system, Roboto, sans-serif
- **Monospace**: JetBrains Mono, Consolas, Monaco

### Why Inter?
- High x-height for readability
- Excellent numeral clarity (critical for financial data)
- Open letterforms
- Friendly yet professional tone

### Font Sizes (Accessible)
```
xs:   0.75rem  (12px)
sm:   0.875rem (14px)
base: 1rem     (16px) ← Larger default for older users
lg:   1.125rem (18px)
xl:   1.25rem  (20px)
2xl:  1.5rem   (24px)
3xl:  1.875rem (30px)
4xl:  2.25rem  (36px)
5xl:  3rem     (48px)
```

### Line Heights
- **Tight**: 1.25 (for headings)
- **Normal**: 1.5 (body text)
- **Relaxed**: 1.75 (long-form content)

## Spacing

Based on 8px grid system:
```
0:  0
1:  0.25rem (4px)
2:  0.5rem  (8px)
3:  0.75rem (12px)
4:  1rem    (16px)
5:  1.25rem (20px)
6:  1.5rem  (24px) ← Card default
8:  2rem    (32px)
10: 2.5rem  (40px)
12: 3rem    (48px)
16: 4rem    (64px)
20: 5rem    (80px)
24: 6rem    (96px)
```

**Generous by default** - aligns with "calm by default" principle.

## Component Guidelines

### Buttons

#### Variants
- **Primary**: Orange background, high contrast
- **Secondary**: Muted background, lower emphasis  
- **Destructive**: Red, use sparingly
- **Ghost**: Transparent, minimal

#### Sizes
- **sm**: 32px height (compact areas)
- **md**: 40px height (default, generous tap target)
- **lg**: 48px height (primary CTAs)

#### Usage
```tsx
import { Button } from '@/components/ui/button';

// Primary action (orange)
<Button>Create Transaction</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Success action (teal)
<Button className="bg-success hover:bg-success-hover">
  Complete
</Button>

// Destructive (use sparingly!)
<Button variant="destructive">Delete Account</Button>
```

### Cards

Primary building block for layouts.

#### Padding
- **sm**: 1rem (16px)
- **md**: 1.5rem (24px) - default
- **lg**: 2rem (32px)

#### Usage
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Net Worth</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Forms

Use shadcn Input, Label, Select components with design tokens.

#### Principles
- **Explain before asking** - Clear labels with helper text
- **Large touch targets** - 40px minimum height
- **Visible focus states** - Orange ring (2px)
- **Supportive errors** - Use warning color, not destructive

#### Usage
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

<div className="space-y-2">
  <Label htmlFor="amount">Amount *</Label>
  <Input 
    id="amount" 
    type="number" 
    placeholder="0.00"
  />
  <p className="text-xs text-text-tertiary">
    Enter the transaction amount
  </p>
</div>
```

### Badges

For categories, status indicators.

#### Usage
```tsx
import { Badge } from '@/components/ui/badge';

// Default
<Badge>Income</Badge>

// With custom category color
<Badge 
  variant="outline"
  style={{
    backgroundColor: `${color}20`,
    color: color,
    borderColor: color
  }}
>
  Groceries
</Badge>
```

### Achievements

For celebrating milestones (energetic feedback).

#### When to Use
- First transaction created
- Net worth milestone reached  
- Savings goal completed
- Budget streak maintained

#### Usage
```tsx
import { Achievement } from '@/components/ui/achievement';

const [showAchievement, setShowAchievement] = useState(false);

<Achievement
  show={showAchievement}
  title="🎉 First Transaction!"
  description="You're on your way to better financial clarity"
  duration={4000}
  onComplete={() => setShowAchievement(false)}
/>
```

## Animations

### Philosophy
- **Calm by default** - Minimal motion in standard UI
- **Energy on demand** - Animations for achievements/milestones
- **Respect preferences** - Honor `prefers-reduced-motion`

### Available Animations

#### Achievement
```css
.animate-achievement
```
- Duration: 600ms
- Easing: Bounce (celebratory)
- Use: Milestone celebrations

#### Pulse Subtle
```css
.animate-pulse-subtle
```
- Duration: 2s infinite
- Use: Gentle attention indicators

#### Slide In Bottom
```css
.animate-slide-in-bottom
```
- Duration: 250ms
- Use: Toast notifications

## Accessibility

### WCAG AA Compliance

#### Contrast Ratios
- **Text**: 4.5:1 minimum
- **Large Text**: 3:1 minimum
- **UI Components**: 3:1 minimum

All color combinations tested for compliance.

#### Touch Targets
- **Minimum**: 44px × 44px (WCAG 2.5.5)
- **Default button**: 40px height (close to minimum)
- **Large button**: 48px height (comfortable)

#### Focus Indicators
- **Visible on all interactive elements**
- **2px orange ring** with 2px offset
- **High contrast** against dark background

#### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order
- Skip links where appropriate

### Neurodiversity Considerations

- **Predictable layouts** - Consistent patterns
- **Clear labeling** - No icon-only buttons without tooltips
- **Generous spacing** - Reduces cognitive load
- **Plain language** - No jargon or metaphors unless explained

## Usage in Code

### Tailwind Classes

```tsx
// Colors
className="bg-primary text-primary-foreground"
className="bg-success text-success-foreground"
className="text-text-secondary"

// Spacing
className="p-6 space-y-4"  // Card with content spacing

// Typography
className="text-lg font-semibold text-foreground"

// State
className="hover:bg-primary-hover"
className="disabled:opacity-50"
```

### Design Tokens in TypeScript

```tsx
import { designTokens } from '@/config/design-tokens';

// Access tokens
const primaryColor = designTokens.semanticColors.primary;

// Convert to HSL
const hslString = designTokens.toHsl(primaryColor);
```

## Common Patterns

### Dashboard Cards
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="text-sm font-medium text-muted-foreground mb-2">
      Label
    </div>
    <div className="text-2xl font-bold text-foreground">
      $1,234.56
    </div>
    <div className="text-sm text-text-tertiary mt-1">
      Helper text
    </div>
  </CardContent>
</Card>
```

### Income vs Expense Display
```tsx
<span className={type === 'income' ? 'text-success' : 'text-primary'}>
  {type === 'income' ? '+' : '-'}${amount}
</span>
```

### Error/Alert Messages
```tsx
// Error (use sparingly)
<div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
  {errorMessage}
</div>

// Warning (neutral awareness)
<div className="bg-warning-subtle border border-warning text-warning px-4 py-3 rounded-md">
  {warningMessage}
</div>
```

## Design Principles

### From Design Book

1. **Clarity over cleverness**
   - Labels beat icons
   - Context beats minimalism

2. **Progress without pressure**
   - Show direction, not failure
   - Use supportive colors (teal/orange) over harsh red

3. **Supportive, not supervisory**
   - App is beside the user, not above
   - "You're learning" not "you're behind"

4. **Calm by default, energy on demand**
   - Steady UI for planning
   - Celebrate meaningful moments

5. **Accessible is not optional**
   - High contrast
   - Generous spacing
   - Predictable layouts

## Do's and Don'ts

### Do ✅
- Use teal for income/positive growth
- Use orange for expenses/actions (not negative!)
- Provide context with helper text
- Show trends over time
- Use generous white space
- Explain before asking

### Don't ❌
- Use red for anything except true errors
- Hide meaning behind icons without labels
- Shame users for outcomes
- Overload dashboards
- Use gambling/competition metaphors
- Make features feel urgent/pressured

## Future Considerations

### Light Mode (If Needed)
Currently dark mode only. If light mode required:
1. Duplicate token structure in `:root` (not `.dark`)
2. Adjust contrast ratios
3. Test accessibility
4. Maintain same semantic meanings

### Additional Features
- Progress indicators for goals
- Trend arrows/indicators
- Data visualization patterns
- Empty state illustrations

## Resources

- **Design Tokens**: `apps/frontend/src/config/design-tokens.ts`
- **Global Styles**: `apps/frontend/src/index.css`
- **Tailwind Config**: `apps/frontend/tailwind.config.js`
- **shadcn Components**: `apps/frontend/src/components/ui/`
- **Design Principles**: `docs/3. design/design_book.md`
- **Color Palette**: `docs/3. design/palette.md`

---

**Version**: 1.0  
**Last Updated**: February 2026  
**Maintained By**: Development Team
