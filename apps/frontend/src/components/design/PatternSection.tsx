import { type ReactNode } from 'react';

interface PatternSectionProps {
  id: string;
  title: string;
  description?: string;
  useWhen?: string[];
  avoidWhen?: string[];
  children: ReactNode;
}

export function PatternSection({
  id,
  title,
  description,
  useWhen,
  avoidWhen,
  children,
}: PatternSectionProps) {
  return (
    <section id={id} className="scroll-mt-8 pb-12 border-b border-border last:border-0">
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">{description}</p>
      )}
      {(useWhen || avoidWhen) && (
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-background border border-border text-sm max-w-2xl">
          {useWhen && (
            <div>
              <p className="font-medium text-success mb-2 text-xs uppercase tracking-wide">Use when</p>
              <ul className="space-y-1">
                {useWhen.map((item) => (
                  <li key={item} className="text-muted-foreground text-xs">— {item}</li>
                ))}
              </ul>
            </div>
          )}
          {avoidWhen && (
            <div>
              <p className="font-medium text-destructive mb-2 text-xs uppercase tracking-wide">Avoid when</p>
              <ul className="space-y-1">
                {avoidWhen.map((item) => (
                  <li key={item} className="text-muted-foreground text-xs">— {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="space-y-8">
        {children}
      </div>
    </section>
  );
}
