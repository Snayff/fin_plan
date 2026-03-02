/**
 * DesignPage — dev only, accessible at /design during development.
 * Visual reference for UI/UX patterns used across the app.
 * See also: docs/3. design/patterns-guide.md
 */
import { ComponentPatterns } from '@/components/design/patterns/ComponentPatterns';
import { DataDisplayPatterns } from '@/components/design/patterns/DataDisplayPatterns';
import { FeedbackPatterns } from '@/components/design/patterns/FeedbackPatterns';
import { FormPatterns } from '@/components/design/patterns/FormPatterns';
import { FoundationPatterns } from '@/components/design/patterns/FoundationPatterns';
import { StatePatterns } from '@/components/design/patterns/StatePatterns';
import { DesignSidebar } from '../components/design/DesignSidebar';

export default function DesignPage() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar — independently scrollable */}
      <div className="w-56 shrink-0 h-full overflow-y-auto border-r border-border">
        <DesignSidebar />
      </div>

      {/* Content — independently scrollable */}
      <div className="flex-1 h-full overflow-y-auto">
        <div className="px-8 py-8 max-w-4xl space-y-16">
          <FoundationPatterns />
          <hr className="border-border" />
          <ComponentPatterns />
          <hr className="border-border" />
          <FormPatterns />
          <hr className="border-border" />
          <StatePatterns />
          <hr className="border-border" />
          <FeedbackPatterns />
          <hr className="border-border" />
          <DataDisplayPatterns />
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
