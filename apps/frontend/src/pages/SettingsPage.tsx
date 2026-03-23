import { useRef, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { waterfallService } from "@/services/waterfall.service";
import type { StalenessThresholds } from "@finplan/shared";
import {
  useSettings,
  useUpdateSettings,
  useSnapshots,
  useRenameSnapshot,
  useDeleteSnapshot,
  useHouseholdDetails,
  useRenameHousehold,
  useInviteMember,
  useCancelInvite,
  useRemoveMember,
  useEndedIncome,
  useReactivateIncome,
} from "@/hooks/useSettings";

// ─── Section nav ──────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "staleness", label: "Staleness thresholds" },
  { id: "surplus", label: "Surplus benchmark" },
  { id: "isa", label: "ISA settings" },
  { id: "household", label: "Household" },
  { id: "snapshots", label: "Snapshots" },
  { id: "income-ended", label: "Ended income" },
  { id: "rebuild", label: "Waterfall rebuild" },
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-4">
      <div className="border-b pb-2">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const { user: updated } = await authService.updateProfile(accessToken, { name });
      setUser(updated, accessToken);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section id="profile" title="Profile">
      <div className="space-y-3 max-w-sm">
        <div className="space-y-1">
          <label className="text-sm font-medium">Name</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Section>
  );
}

// ─── Staleness thresholds ─────────────────────────────────────────────────────

const STALENESS_LABELS: Record<string, string> = {
  income_source: "Income sources",
  committed_bill: "Monthly bills",
  yearly_bill: "Yearly bills",
  discretionary_category: "Discretionary categories",
  savings_allocation: "Savings allocations",
  wealth_account: "Wealth accounts",
};

function StalenessSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const defaults: StalenessThresholds = settings?.stalenessThresholds ?? {
    income_source: 12,
    committed_bill: 6,
    yearly_bill: 12,
    discretionary_category: 12,
    savings_allocation: 12,
    wealth_account: 3,
  };

  const [values, setValues] = useState<StalenessThresholds>(defaults);

  function handleSave() {
    updateSettings.mutate(
      { stalenessThresholds: values },
      { onSuccess: () => toast.success("Thresholds saved") }
    );
  }

  return (
    <Section id="staleness" title="Staleness thresholds">
      <p className="text-sm text-muted-foreground">
        Number of months before each item type is considered stale.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        {Object.entries(STALENESS_LABELS).map(([key, label]) => (
          <div key={key} className="space-y-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <input
              type="number"
              min={1}
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={values[key as keyof StalenessThresholds] ?? 12}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  [key as keyof StalenessThresholds]: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>
        ))}
      </div>
      <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving…" : "Save"}
      </Button>
    </Section>
  );
}

// ─── Surplus benchmark ────────────────────────────────────────────────────────

function SurplusSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [pct, setPct] = useState(settings?.surplusBenchmarkPct ?? 10);

  function handleSave() {
    updateSettings.mutate(
      { surplusBenchmarkPct: pct },
      { onSuccess: () => toast.success("Benchmark saved") }
    );
  }

  return (
    <Section id="surplus" title="Surplus benchmark">
      <p className="text-sm text-muted-foreground">
        Percentage of net income that should remain as surplus before a warning is shown.
      </p>
      <div className="flex items-center gap-2 max-w-sm">
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          className="w-24 rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          value={pct}
          onChange={(e) => setPct(parseFloat(e.target.value) || 0)}
        />
        <span className="text-sm">%</span>
      </div>
      <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving…" : "Save"}
      </Button>
    </Section>
  );
}

// ─── ISA settings ─────────────────────────────────────────────────────────────

function IsaSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [limit, setLimit] = useState(settings?.isaAnnualLimit ?? 20000);
  const [month, setMonth] = useState(settings?.isaYearStartMonth ?? 4);
  const [day, setDay] = useState(settings?.isaYearStartDay ?? 6);

  function handleSave() {
    updateSettings.mutate(
      { isaAnnualLimit: limit, isaYearStartMonth: month, isaYearStartDay: day },
      { onSuccess: () => toast.success("ISA settings saved") }
    );
  }

  return (
    <Section id="isa" title="ISA settings">
      <p className="text-sm text-muted-foreground">
        UK default: 6 April. Only change if you are in a different jurisdiction.
      </p>
      <div className="grid grid-cols-3 gap-3 max-w-sm">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Annual limit (£)</label>
          <input
            type="number"
            min={0}
            className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={limit}
            onChange={(e) => setLimit(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Month (1–12)</label>
          <input
            type="number"
            min={1}
            max={12}
            className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Day (1–31)</label>
          <input
            type="number"
            min={1}
            max={31}
            className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
      <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving…" : "Save"}
      </Button>
    </Section>
  );
}

// ─── Household management ──────────────────────────────────────────────────────

function HouseholdSection() {
  const user = useAuthStore((s) => s.user);
  const householdId = user?.activeHouseholdId ?? "";

  const { data } = useHouseholdDetails(householdId);
  const household = data?.household;

  const renameHousehold = useRenameHousehold();
  const inviteMember = useInviteMember();
  const cancelInvite = useCancelInvite();
  const removeMember = useRemoveMember();

  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    token: string;
    invitedEmail: string;
  } | null>(null);

  const currentUserId = user?.id;
  const currentMember = household?.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "owner";

  function startRename() {
    setEditName(household?.name ?? "");
    setEditingName(true);
  }

  function handleRename() {
    renameHousehold.mutate(
      { id: householdId, name: editName },
      {
        onSuccess: () => {
          setEditingName(false);
          toast.success("Household renamed");
        },
      }
    );
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    inviteMember.mutate(
      { householdId, email: inviteEmail },
      {
        onSuccess: (result) => {
          setInviteResult(result);
          setInviteEmail("");
          toast.success("Invite created");
        },
      }
    );
  }

  const inviteUrl = inviteResult ? `${window.location.origin}/invite/${inviteResult.token}` : null;

  return (
    <Section id="household" title="Household">
      {/* Name / rename */}
      <div className="space-y-2">
        {editingName ? (
          <div className="flex items-center gap-2 max-w-sm">
            <input
              className="flex-1 rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <Button size="sm" onClick={handleRename} disabled={renameHousehold.isPending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="font-medium">{household?.name}</p>
            {isOwner && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={startRename}
              >
                Rename
              </button>
            )}
          </div>
        )}
      </div>

      {/* Members list */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Members</p>
        {(household?.members ?? []).map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between py-1.5 border-b last:border-b-0"
          >
            <div>
              <p className="text-sm font-medium">{member.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {member.user.email} · {member.role}
              </p>
            </div>
            {isOwner && member.userId !== currentUserId && (
              <button
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                onClick={() =>
                  removeMember.mutate(
                    { householdId, userId: member.userId },
                    { onSuccess: () => toast.success("Member removed") }
                  )
                }
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite form */}
      {isOwner && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Invite member</p>
          <form onSubmit={handleInvite} className="flex items-center gap-2 max-w-sm">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <Button type="submit" size="sm" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Creating…" : "Create link"}
            </Button>
          </form>

          {inviteResult && inviteUrl && (
            <div className="rounded-lg border p-4 space-y-3 max-w-xs">
              <QRCodeSVG value={inviteUrl} size={120} />
              <p className="text-xs text-muted-foreground break-all">{inviteUrl}</p>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    void navigator.clipboard.writeText(inviteUrl);
                    toast.success("Link copied");
                  }}
                >
                  Copy link
                </button>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setInviteResult(null)}
                >
                  Done
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                For {inviteResult.invitedEmail} · Expires in 24 hours
              </p>
            </div>
          )}

          {/* Pending invites */}
          {(household?.invites ?? []).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Pending invites
              </p>
              {(household?.invites ?? []).map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {format(new Date(invite.expiresAt), "dd MMM yyyy")}
                    </p>
                  </div>
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() =>
                      cancelInvite.mutate(
                        { householdId, inviteId: invite.id },
                        { onSuccess: () => toast.success("Invite cancelled") }
                      )
                    }
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

function SnapshotsSection() {
  const { data: snapshots = [] } = useSnapshots();
  const renameSnapshot = useRenameSnapshot();
  const deleteSnapshot = useDeleteSnapshot();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(snap: { id: string; name: string }) {
    setEditingId(snap.id);
    setEditName(snap.name);
  }

  function handleRename(id: string) {
    renameSnapshot.mutate(
      { id, name: editName },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Snapshot renamed");
        },
        onError: (err: unknown) => {
          const status = (err as any)?.status;
          toast.error(
            status === 409 ? "A snapshot with that name already exists" : "Failed to rename"
          );
        },
      }
    );
  }

  function handleDelete(id: string) {
    deleteSnapshot.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null);
        toast.success("Snapshot deleted");
      },
    });
  }

  return (
    <Section id="snapshots" title="Snapshots">
      {snapshots.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No snapshots yet</p>
      )}
      <div className="space-y-0.5">
        {(snapshots as any[]).map((snap) => (
          <div key={snap.id} className="border-b last:border-b-0 py-2">
            {editingId === snap.id ? (
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded border px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleRename(snap.id)}
                  disabled={renameSnapshot.isPending}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            ) : confirmDeleteId === snap.id ? (
              <div className="flex items-center gap-2">
                <p className="text-sm flex-1">Delete &ldquo;{snap.name}&rdquo;?</p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(snap.id)}
                  disabled={deleteSnapshot.isPending}
                >
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{snap.name}</p>
                  {snap.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(snap.createdAt as string), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => startEdit(snap as { id: string; name: string })}
                  >
                    Rename
                  </button>
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => setConfirmDeleteId(snap.id as string)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Ended income sources ─────────────────────────────────────────────────────

function EndedIncomeSection() {
  const { data: ended = [] } = useEndedIncome();
  const reactivate = useReactivateIncome();

  return (
    <Section id="income-ended" title="Ended income sources">
      {ended.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No ended income sources</p>
      )}
      <div className="space-y-0.5">
        {(ended as any[]).map((source) => (
          <div
            key={source.id as string}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <div>
              <p className="text-sm font-medium">{source.name as string}</p>
              {source.endedAt && (
                <p className="text-xs text-muted-foreground">
                  Ended {format(new Date(source.endedAt as string), "dd MMM yyyy")}
                </p>
              )}
            </div>
            <button
              className="text-xs text-primary hover:underline disabled:opacity-50"
              disabled={reactivate.isPending}
              onClick={() =>
                reactivate.mutate(source.id as string, {
                  onSuccess: () => toast.success("Income source reactivated"),
                })
              }
            >
              Reactivate
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Waterfall rebuild ────────────────────────────────────────────────────────

function RebuildSection() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRebuild() {
    setDeleting(true);
    try {
      await waterfallService.deleteAll();
      toast.success("Waterfall cleared — set it up again from Overview");
      window.location.href = "/overview";
    } catch {
      toast.error("Failed to clear waterfall");
      setDeleting(false);
    }
  }

  return (
    <Section id="rebuild" title="Waterfall rebuild">
      <p className="text-sm text-muted-foreground">
        Remove all income, bills, discretionary categories, and savings allocations. This cannot be
        undone.
      </p>
      {!confirming ? (
        <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
          Rebuild from scratch
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Are you sure? All waterfall data will be deleted.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleRebuild} disabled={deleting}>
              {deleting ? "Clearing…" : "Yes, delete everything"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setRef(id: string) {
    return (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    };
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left nav */}
      <aside className="w-48 shrink-0 border-r p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Settings
        </p>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors"
            onClick={() => scrollTo(s.id)}
          >
            {s.label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl space-y-12">
          <div ref={setRef("profile")}>
            <ProfileSection />
          </div>
          <div ref={setRef("staleness")}>
            <StalenessSection />
          </div>
          <div ref={setRef("surplus")}>
            <SurplusSection />
          </div>
          <div ref={setRef("isa")}>
            <IsaSection />
          </div>
          <div ref={setRef("household")}>
            <HouseholdSection />
          </div>
          <div ref={setRef("snapshots")}>
            <SnapshotsSection />
          </div>
          <div ref={setRef("income-ended")}>
            <EndedIncomeSection />
          </div>
          <div ref={setRef("rebuild")}>
            <RebuildSection />
          </div>
        </div>
      </main>
    </div>
  );
}
