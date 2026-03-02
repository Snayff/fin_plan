import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CodeSnippet } from './CodeSnippet';

interface PatternExampleProps {
  label?: string;
  type?: 'correct' | 'avoid' | 'neutral';
  code?: string;
  children: ReactNode;
}

const borderStyles = {
  correct: 'border-success',
  avoid: 'border-destructive',
  neutral: 'border-border',
};

const defaultLabels = {
  correct: '✓ Do this',
  avoid: '✗ Avoid',
  neutral: '',
};

const labelStyles = {
  correct: 'text-success',
  avoid: 'text-destructive',
  neutral: 'text-muted-foreground',
};

export function PatternExample({ label, type = 'neutral', code, children }: PatternExampleProps) {
  const resolvedLabel = label ?? defaultLabels[type];

  return (
    <div className="flex flex-col gap-2">
      {resolvedLabel && (
        <p className={cn('text-xs font-semibold', labelStyles[type])}>
          {resolvedLabel}
        </p>
      )}
      <div className={cn('rounded-lg border-2 p-4 bg-card', borderStyles[type])}>
        {children}
      </div>
      {code && <CodeSnippet code={code} />}
    </div>
  );
}
