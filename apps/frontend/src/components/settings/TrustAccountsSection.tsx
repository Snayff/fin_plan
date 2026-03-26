import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWealthAccounts, useUpdateAccount } from "@/hooks/useWealth";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import { Section } from "./Section";

export function TrustAccountsSection() {
  const { data: accounts = [] } = useWealthAccounts();
  const updateAccount = useUpdateAccount();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const trustAccounts = accounts.filter((a) => a.isTrust);

  function startEdit(account: { id: string; trustBeneficiaryName?: string | null }) {
    setEditingId(account.id);
    setEditValue(account.trustBeneficiaryName ?? "");
  }

  function handleRename(id: string) {
    updateAccount.mutate(
      { id, data: { trustBeneficiaryName: editValue } },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Beneficiary name updated");
        },
        onError: () => {
          toast.error("Failed to update beneficiary name");
        },
      }
    );
  }

  return (
    <Section id="trust-accounts" title="Trust accounts">
      <p className="text-sm text-muted-foreground">
        Accounts held on behalf of a beneficiary. Add trust accounts from the Wealth view.
      </p>
      {trustAccounts.length === 0 && (
        <GhostedListEmpty
          ctaText="Trust accounts appear here when added from the Wealth view"
          showCta={false}
        />
      )}
      <div className="space-y-0.5">
        {trustAccounts.map((account) => (
          <div key={account.id} className="border-b last:border-b-0 py-2">
            {editingId === account.id ? (
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Beneficiary name"
                  autoFocus
                  aria-label="Beneficiary name"
                />
                <Button
                  size="sm"
                  onClick={() => handleRename(account.id)}
                  disabled={updateAccount.isPending}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{account.name}</p>
                  {account.trustBeneficiaryName && (
                    <p className="text-xs text-muted-foreground">
                      For: {account.trustBeneficiaryName}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-1 px-2"
                  aria-label={`Rename beneficiary name for ${account.name}`}
                  onClick={() => startEdit(account)}
                >
                  Rename
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
