# Design System Migration Guide

## Overview

This guide helps migrate existing components to use the new design token system and shadcn/ui components.

## Quick Reference: Color Mappings

### Old → New

```tsx
// Text Colors
text-gray-900   → text-foreground
text-gray-700   → text-foreground
text-gray-600   → text-text-secondary
text-gray-500   → text-muted-foreground
text-gray-400   → text-text-tertiary

// Background Colors
bg-white        → bg-card
bg-gray-50      → bg-muted
bg-gray-100     → bg-secondary

// Action Colors (IMPORTANT!)
bg-blue-600     → bg-primary
text-blue-600   → text-primary
bg-green-600    → bg-success
text-green-600  → text-success
bg-red-600      → bg-destructive (use sparingly!)
text-red-600    → text-destructive (use sparingly!)

// Borders
border-gray-200 → border-border
border-gray-300 → border-input
divide-gray-200 → divide-border

// Hover States
hover:bg-gray-50    → hover:bg-muted/50
hover:bg-blue-700   → hover:bg-primary-hover
hover:text-blue-800 → hover:text-primary-hover
```

## Component Migration Checklist

### Forms

#### Before (Old)
```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Name *
    </label>
    <input
      type="text"
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</form>
```

#### After (New)
```tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Name *</Label>
    <Input 
      id="name"
      type="text"
      placeholder="Enter name"
    />
  </div>
</form>
```

### Buttons

#### Before (Old)
```tsx
<button
  type="submit"
  disabled={isLoading}
  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
>
  Submit
</button>

<button
  type="button"
  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
>
  Cancel
</button>
```

#### After (New)
```tsx
import { Button } from '@/components/ui/button';

<Button 
  type="submit" 
  disabled={isLoading}
>
  Submit
</Button>

<Button 
  type="button" 
  variant="secondary"
>
  Cancel
</Button>
```

### Cards/Panels

#### Before (Old)
```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    Title
  </h2>
  <div>{/* content */}</div>
</div>
```

#### After (New)
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

### Loading States

#### Before (Old)
```tsx
<div className="flex items-center justify-center py-8">
  <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
    <p className="text-gray-600 text-sm">Loading...</p>
  </div>
</div>
```

#### After (New)
```tsx
<div className="flex items-center justify-center py-8">
  <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
    <p className="text-muted-foreground text-sm">Loading...</p>
  </div>
</div>
```

### Error Messages

#### Before (Old - Too Harsh!)
```tsx
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
  Error: {message}
</div>
```

#### After (New - Supportive)
```tsx
// For true errors only
<div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
  Error: {message}
</div>

// For warnings/attention (prefer this!)
<div className="bg-warning-subtle border border-warning text-warning px-4 py-3 rounded-md">
  {message}
</div>
```

### Tables

#### Before (Old)
```tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead>
    <tr>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
        Name
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        Value
      </td>
    </tr>
  </tbody>
</table>
```

#### After (New)
```tsx
<table className="min-w-full divide-y divide-border">
  <thead>
    <tr>
      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
        Name
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-border">
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3 text-sm text-foreground">
        Value
      </td>
    </tr>
  </tbody>
</table>
```

## Step-by-Step Migration Process

### 1. Import shadcn Components

Add at top of file:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
```

### 2. Replace Color Classes

Search and replace in your component:
- `text-gray-900` → `text-foreground`
- `text-gray-600` → `text-text-secondary`
- `bg-white` → `bg-card`
- `bg-blue-600` → `bg-primary`
- `text-green-600` → `text-success`
- `border-gray-200` → `border-border`

### 3. Update Semantic Meanings

**CRITICAL**: Don't just find/replace colors mechanically. Think about meaning:

- ❌ Red for expenses → ✅ Orange (`text-primary`)
- ❌ Green for income → ✅ Teal (`text-success`)
- ❌ Red for warnings → ✅ Warm orange (`text-warning`)
- ✅ Red only for true errors (`text-destructive`)

### 4. Replace Native Elements

- `<button>` → `<Button>`
- `<input>` + `<label>` → `<Label>` + `<Input>`
- `<select>` → shadcn `<Select>` (more complex, see docs)
- Divs with `bg-white shadow rounded` → `<Card>`

### 5. Test Accessibility

After migration:
- [ ] Tab through all interactive elements
- [ ] Verify focus rings are visible (orange, 2px)
- [ ] Check color contrast with browser dev tools
- [ ] Test with keyboard only
- [ ] Verify labels are associated with inputs

## Common Patterns

### Income/Expense Display

```tsx
// OLD - Using red/green (implies good/bad)
<span className={type === 'income' ? 'text-green-600' : 'text-red-600'}>
  {amount}
</span>

// NEW - Using teal/orange (neutral)
<span className={type === 'income' ? 'text-success' : 'text-primary'}>
  {type === 'income' ? '+' : '-'}${amount}
</span>
```

### Status Indicators

```tsx
// OLD
<span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
  Active
</span>

// NEW
import { Badge } from '@/components/ui/badge';

<Badge className="bg-success-subtle text-success">
  Active
</Badge>
```

### Empty States

```tsx
// OLD
<p className="text-gray-500 text-sm">No data available</p>

// NEW
<p className="text-muted-foreground text-sm">
  No data available yet. Get started by creating your first transaction.
</p>
```

## Files to Migrate

### Priority 1 (User-Facing)
- [x] `DashboardPage.tsx` - ✅ DONE
- [ ] `TransactionForm.tsx`
- [ ] `TransactionEditForm.tsx`
- [ ] `AccountForm.tsx`
- [ ] `AccountEditForm.tsx`
- [ ] `TransactionsPage.tsx`
- [ ] `AccountsPage.tsx`

### Priority 2 (Components)
- [x] `Modal.tsx` - ✅ DONE (wrapper)
- [x] `ConfirmDialog.tsx` - ✅ DONE (wrapper)
- [ ] `TransactionFilters.tsx`
- [ ] Chart components (ensure they use chart-1 through chart-5 colors)

### Priority 3 (Auth)
- [ ] `LoginPage.tsx`
- [ ] `RegisterPage.tsx`

## Testing Your Migration

### Visual Checks
1. Colors match design palette
2. Spacing is generous (not cramped)
3. Text hierarchy is clear
4. Focus states are visible
5. Hover states work

### Functional Checks
1. Forms submit correctly
2. Buttons trigger actions
3. Modals open/close
4. Loading states display
5. Error messages show

### Accessibility Checks
1. Tab order is logical
2. Focus indicators visible
3. Labels associated with inputs
4. Color contrast sufficient
5. Screen reader friendly

## Getting Help

- **Design System Docs**: `docs/3. design/DESIGN_SYSTEM.md`
- **Design Tokens**: `apps/frontend/src/config/design-tokens.ts`
- **shadcn docs**: https://ui.shadcn.com/
- **Design Principles**: `docs/3. design/design_book.md`

## Quick Tips

1. **Don't rush** - Migrate one component at a time
2. **Test frequently** - Check after each change
3. **Think semantically** - Colors have meaning, not just appearance
4. **Be generous** - When in doubt, add more spacing
5. **Stay supportive** - Avoid harsh red, use warm colors

---

**Last Updated**: February 2026
