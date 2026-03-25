import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuthStore } from "@/stores/authStore";
import {
  useHouseholdDetails,
  useRenameHousehold,
  useInviteMember,
  useCancelInvite,
  useRemoveMember,
  useLeaveHousehold,
} from "@/hooks/useSettings";
import { Section } from "./Section";

export function HouseholdSection() {
  const user = useAuthStore((s) => s.user);
  const householdId = user?.activeHouseholdId ?? "";
  const navigate = useNavigate();

  const { data } = useHouseholdDetails(householdId);
  const household = data?.household;

  const renameHousehold = useRenameHousehold();
  const inviteMember = useInviteMember();
  const cancelInvite = useCancelInvite();
  const removeMember = useRemoveMember();
  const leaveHousehold = useLeaveHousehold();

  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    token: string;
    invitedEmail: string;
  } | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const currentUserId = user?.id;
  const currentMember = household?.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "owner";
  const ownerCount = household?.members.filter((m) => m.role === "owner").length ?? 0;
  const isSoleOwner = isOwner && ownerCount <= 1;

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

  function handleLeave() {
    leaveHousehold.mutate(householdId, {
      onSuccess: () => {
        toast.success("You have left the household");
        navigate("/overview");
      },
    });
  }

  const inviteUrl = inviteResult ? `${window.location.origin}/invite/${inviteResult.token}` : null;

  return (
    <Section id="household" title="Household">
      {/* Name / rename */}
      <div className="space-y-2">
        {editingName ? (
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              className="flex-1"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              aria-label="Household name"
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

      {/* Leave household */}
      {!isSoleOwner && currentMember && (
        <div>
          <button
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => setShowLeaveConfirm(true)}
          >
            Leave household
          </button>
          <ConfirmDialog
            isOpen={showLeaveConfirm}
            onClose={() => setShowLeaveConfirm(false)}
            title="Leave household?"
            message="You will lose access to this household's data. This cannot be undone."
            confirmText="Leave"
            onConfirm={handleLeave}
            variant="danger"
          />
        </div>
      )}

      {/* Invite form */}
      {isOwner && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Invite member</p>
          <form onSubmit={handleInvite} className="flex items-center gap-2 max-w-sm">
            <Input
              type="email"
              placeholder="Email address"
              className="flex-1"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              aria-label="Invite email address"
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
