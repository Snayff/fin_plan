import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const SettingsSection = forwardRef<HTMLElement, SettingsSectionProps>(
  ({ id, title, description, children, className }, ref) => {
    return (
      <section
        ref={ref}
        id={id}
        data-section-id={id}
        tabIndex={-1}
        className={cn("scroll-mt-4 focus:outline-none", className)}
      >
        <h3
          className="font-heading text-sm font-bold uppercase text-page-accent mb-1"
          style={{ letterSpacing: "0.06em" }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm text-foreground/45 leading-relaxed mb-4 max-w-xl">{description}</p>
        )}
        <div className="space-y-4">{children}</div>
      </section>
    );
  }
);
SettingsSection.displayName = "SettingsSection";
