// Update this file when form conventions change.
// Reference implementation: src/components/budgets/BudgetForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatternExample } from '../PatternExample';
import { PatternSection } from '../PatternSection';

function ValidationDemo() {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && !name.trim() ? 'Account name is required' : undefined;

  return (
    <form
      className="space-y-4 max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="vd-name">Account name</Label>
        <Input
          id="vd-name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSubmitted(false); }}
          className={nameError ? 'border-destructive focus-visible:ring-destructive' : ''}
          placeholder="e.g. Everyday Spending"
        />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>
      <Button type="submit" size="sm">Submit</Button>
    </form>
  );
}

export function FormPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Forms</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Consistent form patterns make the app feel predictable and reduce cognitive load.
          Reference implementation:{' '}
          <code className="text-xs bg-background border border-border px-1 rounded">
            src/components/budgets/BudgetForm.tsx
          </code>
        </p>
      </div>

      <PatternSection
        id="form-layout"
        title="Field Layout"
        description="Every form field follows the same vertical stack: Label → Input → helper/error text. Use space-y-4 between fields."
        useWhen={['Every form in the app — this is the only form field layout']}
        avoidWhen={['Horizontal label/input pairs (harder to scan for our user base)', 'Skipping the Label — always label every field for accessibility']}
      >
        <PatternExample
          type="correct"
          code={`<form className="space-y-4">
  <div className="space-y-1">
    <Label htmlFor="name">Account name</Label>
    <Input id="name" placeholder="e.g. Everyday Spending" />
  </div>

  <div className="space-y-1">
    <Label htmlFor="type">Account type</Label>
    <Select>
      <SelectTrigger id="type">
        <SelectValue placeholder="Select a type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="checking">Checking</SelectItem>
        <SelectItem value="savings">Savings</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div className="flex gap-3 pt-2">
    <Button type="submit">Save</Button>
    <Button type="button" variant="secondary">Cancel</Button>
  </div>
</form>`}
        >
          <form className="space-y-4 max-w-sm" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1">
              <Label htmlFor="fl-name">Account name</Label>
              <Input id="fl-name" placeholder="e.g. Everyday Spending" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fl-type">Account type</Label>
              <Select>
                <SelectTrigger id="fl-type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" variant="secondary" size="sm">Cancel</Button>
            </div>
          </form>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="form-validation"
        title="Validation — Inline Field Errors"
        description="Client-side validation runs on submit. Error text appears below the relevant field in text-xs text-destructive. The field border turns destructive. Errors clear as the user edits the field."
        useWhen={['Required fields', 'Format constraints (date ranges, number limits)']}
        avoidWhen={['Validating on every keystroke — validate on submit or onBlur only', 'Showing a toast for field-level errors']}
      >
        <PatternExample
          label="Interactive demo — click Submit with an empty field"
          code={`const [errors, setErrors] = useState<{ name?: string }>({});

const validateForm = () => {
  const next: typeof errors = {};
  if (!formData.name.trim()) next.name = 'Account name is required';
  setErrors(next);
  return Object.keys(next).length === 0;
};

// In JSX:
<div className="space-y-1">
  <Label htmlFor="name">Account name</Label>
  <Input
    id="name"
    value={formData.name}
    onChange={(e) => {
      setFormData(d => ({ ...d, name: e.target.value }));
      setErrors(e => ({ ...e, name: undefined })); // clear on edit
    }}
    className={errors.name
      ? 'border-destructive focus-visible:ring-destructive'
      : ''}
  />
  {errors.name && (
    <p className="text-xs text-destructive">{errors.name}</p>
  )}
</div>`}
        >
          <ValidationDemo />
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="form-server-errors"
        title="Server / Mutation Errors"
        description="When a mutation fails, show the error in a styled block at the bottom of the form — above the action buttons. This pattern is distinct from field-level errors and clearly communicates a system-level problem."
        useWhen={['API errors returned from a mutation', 'Network failures during form submission']}
        avoidWhen={['Field-level validation failures — use inline errors above', 'Success messages — use Toast']}
      >
        <PatternExample
          type="correct"
          code={`{mutation.error && (
  <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
    {(mutation.error as Error).message}
  </div>
)}

<div className="flex gap-3 pt-2">
  <Button type="submit" disabled={mutation.isPending}>
    {mutation.isPending ? 'Saving...' : 'Save'}
  </Button>
  <Button type="button" variant="secondary">Cancel</Button>
</div>`}
        >
          <div className="space-y-4 max-w-sm">
            <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
              Failed to save: a budget with this name already exists.
            </div>
            <div className="flex gap-3">
              <Button size="sm" disabled>Saving...</Button>
              <Button size="sm" variant="secondary">Cancel</Button>
            </div>
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="form-disabled"
        title="Disabled Fields"
        description="Disable the entire form (all inputs + submit button) while a mutation is pending. This prevents double-submissions and signals that work is in progress."
        useWhen={['While mutation.isPending is true']}
        avoidWhen={['Disabling only the submit button — the whole form should be inert during pending state']}
      >
        <PatternExample
          type="correct"
          code={`<form className="space-y-4">
  <div className="space-y-1">
    <Label htmlFor="name">Account name</Label>
    <Input
      id="name"
      disabled={mutation.isPending}
      value={formData.name}
      onChange={...}
    />
  </div>
  <Button type="submit" disabled={mutation.isPending}>
    {mutation.isPending ? 'Saving...' : 'Save'}
  </Button>
</form>`}
        >
          <form className="space-y-4 max-w-sm" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1">
              <Label htmlFor="fd-name">Account name</Label>
              <Input id="fd-name" disabled defaultValue="Everyday Spending" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fd-type">Account type</Label>
              <Select disabled>
                <SelectTrigger id="fd-type">
                  <SelectValue placeholder="Savings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled size="sm">Saving...</Button>
          </form>
        </PatternExample>
      </PatternSection>
    </div>
  );
}
