// Update this file when loading, empty, or error patterns change.
import { AlertTriangle, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PatternExample } from '../PatternExample';
import { PatternSection } from '../PatternSection';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded bg-border animate-pulse ${className}`} />
  );
}

export function StatePatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Page States</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Every data-fetching view has three states: loading, empty, and error.
          All three must be handled explicitly — never leave a state unaddressed.
        </p>
      </div>

      <PatternSection
        id="loading"
        title="Loading"
        description="Use animated skeleton blocks that approximate the shape of the real content. This reduces perceived wait time and avoids layout shift when content arrives."
        useWhen={['isLoading is true from a React Query useQuery call']}
        avoidWhen={['A spinner alone for page-level content — skeletons are less disruptive', 'Showing a loading state for mutations — disable the form instead (see Forms > Disabled Fields)']}
      >
        <PatternExample
          type="correct"
          code={`if (isLoading) {
  return (
    <div className="p-6 space-y-4">
      {/* Approximate the shape of your real content */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              <div className="h-4 rounded bg-border animate-pulse w-1/2" />
              <div className="h-8 rounded bg-border animate-pulse w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}`}
        >
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <SkeletonBlock className="h-4 w-1/2" />
                  <SkeletonBlock className="h-8 w-3/4" />
                  <SkeletonBlock className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </PatternExample>

        <PatternExample
          label="List skeleton"
          code={`{[1, 2, 3, 4].map((i) => (
  <div key={i} className="flex items-center gap-3 p-4 border-b border-border">
    <div className="h-8 w-8 rounded-full bg-border animate-pulse shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 rounded bg-border animate-pulse w-1/3" />
      <div className="h-3 rounded bg-border animate-pulse w-1/2" />
    </div>
    <div className="h-4 rounded bg-border animate-pulse w-16" />
  </div>
))}`}
        >
          <div className="rounded-lg border border-border overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 border-b border-border last:border-0">
                <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-1/3" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
                <SkeletonBlock className="h-4 w-16" />
              </div>
            ))}
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="empty-state"
        title="Empty State"
        description="Shown when a fetch succeeds but returns no data. Always include a clear heading, brief explanation, and a primary action to resolve the empty state. Tone: encouraging, not apologetic."
        useWhen={['data.length === 0 after a successful fetch', 'First-use screens where no records exist yet']}
        avoidWhen={['Showing nothing — an empty list with no guidance abandons the user', 'Using destructive colours — this is a neutral state, not an error']}
      >
        <PatternExample
          type="correct"
          code={`if (goals.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="rounded-full bg-primary/10 p-4">
        <Target className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">No goals yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Set your first goal to start tracking progress toward what matters.
        </p>
      </div>
      <Button onClick={onAddGoal}>
        <Plus className="h-4 w-4" />
        Add your first goal
      </Button>
    </div>
  );
}`}
        >
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No goals yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Set your first goal to start tracking progress toward what matters.
              </p>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add your first goal
            </Button>
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="error-state"
        title="Error State"
        description="Shown when a fetch fails. Be clear about what went wrong, don't blame the user, and always offer a retry action."
        useWhen={['error is truthy from a React Query useQuery call']}
        avoidWhen={['Swallowing the error silently', 'Showing raw API error messages to the user — normalise the message']}
      >
        <PatternExample
          type="correct"
          code={`if (error) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="rounded-full bg-destructive-subtle p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Could not load accounts
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Something went wrong. Check your connection and try again.
        </p>
      </div>
      <Button variant="outline" onClick={() => refetch()}>
        Try again
      </Button>
    </div>
  );
}`}
        >
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="rounded-full bg-destructive-subtle p-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Could not load accounts</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Something went wrong. Check your connection and try again.
              </p>
            </div>
            <Button variant="outline" size="sm">Try again</Button>
          </div>
        </PatternExample>
      </PatternSection>
    </div>
  );
}
