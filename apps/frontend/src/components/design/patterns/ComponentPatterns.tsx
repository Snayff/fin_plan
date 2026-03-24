// Update this file when UI components in src/components/ui/ are modified.
import { AlertTriangle, Info, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatternExample } from "../PatternExample";
import { PatternSection } from "../PatternSection";

export function ComponentPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Components</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Core UI primitives. All live in{" "}
          <code className="text-xs bg-background border border-border px-1 rounded">
            src/components/ui/
          </code>
          .
        </p>
      </div>

      <PatternSection
        id="button"
        title="Button"
        description="Six variants, four sizes. Choose based on the action's prominence and consequence."
        useWhen={[
          "The action is the primary CTA on the page (default)",
          "You need a destructive action gate — always pair with ConfirmDialog",
        ]}
        avoidWhen={[
          "Stacking more than one default (primary) button — one primary per section",
          "Using destructive inline without confirming first",
        ]}
      >
        <PatternExample
          label="Variants"
          code={`<Button variant="default">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="outline">Edit</Button>
<Button variant="ghost">View</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Learn more</Button>`}
        >
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Save</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="outline">Edit</Button>
            <Button variant="ghost">View</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="link">Learn more</Button>
          </div>
        </PatternExample>

        <PatternExample
          label="Sizes"
          code={`<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus className="h-4 w-4" /></Button>`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </PatternExample>

        <PatternExample
          label="States: disabled and loading"
          code={`<Button disabled>Saving...</Button>
<Button disabled={isPending}>
  {isPending ? 'Saving...' : 'Save'}
</Button>`}
        >
          <div className="flex gap-3">
            <Button disabled>Disabled</Button>
            <Button disabled>Saving...</Button>
          </div>
        </PatternExample>

        <PatternExample
          type="avoid"
          label="✗ Avoid — multiple primary buttons"
          code={`{/* Wrong: two default buttons compete for attention */}
<Button>Save</Button>
<Button>Add Another</Button>`}
        >
          <div className="flex gap-3">
            <Button>Save</Button>
            <Button>Add Another</Button>
          </div>
        </PatternExample>

        <PatternExample
          type="correct"
          label="✓ Do this — one primary, one secondary"
          code={`<Button>Save</Button>
<Button variant="secondary">Cancel</Button>`}
        >
          <div className="flex gap-3">
            <Button>Save</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="card"
        title="Card"
        description="The primary surface for grouping related content. Rounded-xl, bg-card, shadowed."
        useWhen={[
          "Grouping a related set of data or controls",
          "Any content that needs visual separation from the page background",
        ]}
        avoidWhen={[
          "Nesting cards inside cards — flatten the hierarchy instead",
          "Using a card for a single line of text",
        ]}
      >
        <PatternExample
          label="Full card anatomy"
          code={`<Card>
  <CardHeader>
    <CardTitle>Net Worth</CardTitle>
    <CardDescription>As of today</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-semibold font-mono">£48,200</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" size="sm">View history</Button>
  </CardFooter>
</Card>`}
        >
          <div className="max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Net Worth</CardTitle>
                <CardDescription>As of today</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono">£48,200</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm">
                  View history
                </Button>
              </CardFooter>
            </Card>
          </div>
        </PatternExample>

        <PatternExample
          label="Minimal card (no header/footer)"
          code={`<Card>
  <CardContent className="pt-6">
    <p className="text-sm text-muted-foreground">Balance</p>
    <p className="text-xl font-semibold font-mono text-foreground">£12,450</p>
  </CardContent>
</Card>
{/* Note: use text-foreground for neutral balances. Reserve text-success (teal)
    for income figures or positive deltas, not plain account balances. */}`}
        >
          <div className="max-w-xs">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-xl font-semibold font-mono text-foreground">£12,450</p>
              </CardContent>
            </Card>
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="badge"
        title="Badge"
        description="Small inline labels for status, category, or count. Not interactive."
        useWhen={[
          "Showing status (Active, Overdue, On track)",
          "Labelling a category or type inline with other content",
        ]}
        avoidWhen={[
          "Conveying urgency that needs a full Alert",
          "Interactive actions — use Button instead",
        ]}
      >
        <PatternExample
          label="Variants"
          code={`<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Error</Badge>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Error</Badge>
          </div>
        </PatternExample>

        <PatternExample
          label="Custom semantic colours (via className)"
          code={`<Badge className="bg-success text-success-foreground border-0">On Track</Badge>
<Badge className="bg-attention text-foreground border-0">Review</Badge>
<Badge className="bg-attention text-foreground border-0">Overdue</Badge>
<Badge className="bg-primary text-primary-foreground border-0">Goal</Badge>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-success text-success-foreground border-0">On Track</Badge>
            <Badge className="bg-attention text-foreground border-0">Review</Badge>
            <Badge className="bg-attention text-foreground border-0">Overdue</Badge>
            <Badge className="bg-primary text-primary-foreground border-0">Goal</Badge>
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="input"
        title="Input"
        description="Text input. Always pair with a Label. Error state uses a red border + helper text below."
        useWhen={["Collecting free-form text, numbers, or dates from the user"]}
        avoidWhen={["Collecting from a fixed list — use Select instead"]}
      >
        <PatternExample
          label="Default with label"
          code={`<div className="space-y-1">
  <Label htmlFor="name">Account name</Label>
  <Input id="name" placeholder="e.g. Everyday Spending" />
</div>`}
        >
          <div className="space-y-1 max-w-xs">
            <Label htmlFor="demo-name">Account name</Label>
            <Input id="demo-name" placeholder="e.g. Everyday Spending" />
          </div>
        </PatternExample>

        <PatternExample
          label="Error state"
          code={`<div className="space-y-1">
  <Label htmlFor="name">Account name</Label>
  <Input
    id="name"
    className="border-destructive focus-visible:ring-destructive"
    defaultValue=""
  />
  <p className="text-xs text-destructive">Account name is required</p>
</div>`}
        >
          <div className="space-y-1 max-w-xs">
            <Label htmlFor="demo-name-error">Account name</Label>
            <Input
              id="demo-name-error"
              className="border-destructive focus-visible:ring-destructive"
            />
            <p className="text-xs text-destructive">Account name is required</p>
          </div>
        </PatternExample>

        <PatternExample
          label="Disabled state"
          code={`<div className="space-y-1">
  <Label htmlFor="id">Account ID</Label>
  <Input id="id" value="acc_abc123" disabled />
  <p className="text-xs text-muted-foreground">Read-only — set by the system</p>
</div>`}
        >
          <div className="space-y-1 max-w-xs">
            <Label htmlFor="demo-id">Account ID</Label>
            <Input id="demo-id" value="acc_abc123" disabled readOnly />
            <p className="text-xs text-muted-foreground">Read-only — set by the system</p>
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="select"
        title="Select"
        description="Radix UI Select. Use for choosing from a fixed list of options."
        useWhen={[
          "Options are known and finite (5–15 items)",
          "The field value must be one of the options",
        ]}
        avoidWhen={[
          "Long lists (20+ items) — consider a searchable combobox",
          "Binary yes/no — use a checkbox or toggle",
        ]}
      >
        <PatternExample
          label="Basic select"
          code={`<div className="space-y-1">
  <Label htmlFor="period">Period</Label>
  <Select>
    <SelectTrigger id="period">
      <SelectValue placeholder="Choose a period" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="monthly">Monthly</SelectItem>
      <SelectItem value="quarterly">Quarterly</SelectItem>
      <SelectItem value="annual">Annual</SelectItem>
    </SelectContent>
  </Select>
</div>`}
        >
          <div className="max-w-xs space-y-1">
            <Label htmlFor="demo-period">Period</Label>
            <Select>
              <SelectTrigger id="demo-period">
                <SelectValue placeholder="Choose a period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="alert"
        title="Alert"
        description="Inline contextual messages. For persistent page-level messages only — use Toast for transient feedback."
        useWhen={[
          "Showing a persistent warning or error on a page or form section",
          "Informing the user about a state that persists until resolved",
        ]}
        avoidWhen={[
          "Transient feedback after an action — use Toast",
          "Success confirmation after a save — use Toast",
        ]}
      >
        <PatternExample
          label="Default (informational)"
          code={`<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>
    Changes will take effect at the start of the next period.
  </AlertDescription>
</Alert>`}
        >
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              Changes will take effect at the start of the next period.
            </AlertDescription>
          </Alert>
        </PatternExample>

        <PatternExample
          label="Destructive (error)"
          code={`<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to save changes. Please try again.
  </AlertDescription>
</Alert>`}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to save changes. Please try again.</AlertDescription>
          </Alert>
        </PatternExample>
      </PatternSection>
    </div>
  );
}
