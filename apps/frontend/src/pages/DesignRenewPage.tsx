/**
 * DesignRenewPage — dev only, accessible at /design-renew during development.
 * Visual reference for the renew finplan design system.
 * Design rules: docs/2. design/design-system.md
 * Token source: src/config/design-tokens.ts
 */
import { ComponentRenewPatterns } from "@/components/design/renew/ComponentRenewPatterns";
import { DataDisplayRenewPatterns } from "@/components/design/renew/DataDisplayRenewPatterns";
import { DesignPrinciplesSection } from "@/components/design/renew/DesignPrinciplesSection";
import { DesignRenewSidebar } from "@/components/design/renew/DesignRenewSidebar";
import { FeedbackRenewPatterns } from "@/components/design/renew/FeedbackRenewPatterns";
import { FormRenewPatterns } from "@/components/design/renew/FormRenewPatterns";
import { FoundationRenewPatterns } from "@/components/design/renew/FoundationRenewPatterns";
import { WaterfallPatterns } from "@/components/design/renew/WaterfallPatterns";

export default function DesignRenewPage() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar — independently scrollable */}
      <div className="w-56 shrink-0 h-full overflow-y-auto border-r border-border">
        <DesignRenewSidebar />
      </div>

      {/* Content — independently scrollable */}
      <div className="flex-1 h-full overflow-y-auto">
        <div className="px-8 py-8 max-w-4xl space-y-16">
          <DesignPrinciplesSection />
          <hr className="border-border" />
          <FoundationRenewPatterns />
          <hr className="border-border" />
          <WaterfallPatterns />
          <hr className="border-border" />
          <ComponentRenewPatterns />
          <hr className="border-border" />
          <FormRenewPatterns />
          <hr className="border-border" />
          <FeedbackRenewPatterns />
          <hr className="border-border" />
          <DataDisplayRenewPatterns />
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
