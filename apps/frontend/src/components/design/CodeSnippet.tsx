import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CodeSnippetProps {
  code: string;
  className?: string;
}

export function CodeSnippet({ code, className }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('relative rounded-md bg-background border border-border', className)}>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors bg-card border border-border"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="p-4 pr-20 text-xs text-foreground overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
