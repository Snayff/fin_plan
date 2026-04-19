import { useSecurityActivity } from "@/hooks/useSettings";
import { SettingsSection } from "./SettingsSection";
import { SecurityActivityTable } from "./SecurityActivityTable";
import { Button } from "@/components/ui/button";

export function SecurityActivitySection() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSecurityActivity();
  const entries = data?.pages.flatMap((p) => p.entries) ?? [];

  return (
    <SettingsSection
      id="security-activity"
      title="Security activity"
      description="Sign-ins, sign-outs, and session activity on your account."
    >
      {isError ? (
        <p className="text-sm text-muted-foreground">Unable to load activity</p>
      ) : (
        <SecurityActivityTable entries={entries} loading={isLoading} />
      )}
      {hasNextPage && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-page-accent hover:text-page-accent/80"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load older entries"}
          </Button>
        </div>
      )}
      <p className="pt-3 text-xs text-muted-foreground">
        Entries older than 180 days are automatically removed.
      </p>
    </SettingsSection>
  );
}
