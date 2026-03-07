import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth.service';
import { householdService } from '../services/household.service';
import { showSuccess, showError } from '../lib/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const activeHouseholdId = user?.activeHouseholdId ?? null;

  // Account tab state
  const [nameValue, setNameValue] = useState(user?.name ?? '');

  // Household tab — rename state
  const [renameValue, setRenameValue] = useState('');

  // Household tab — invite state
  const [inviteEmail, setInviteEmail] = useState('');

  // Household tab — create new household state
  const [newHouseholdName, setNewHouseholdName] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: householdsData } = useQuery({
    queryKey: ['households'],
    queryFn: () => householdService.getHouseholds(),
    enabled: !!activeHouseholdId,
  });

  const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['household-details', activeHouseholdId],
    queryFn: () => householdService.getHouseholdDetails(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  });

  const currentMembership = householdsData?.households.find(
    (m) => m.householdId === activeHouseholdId
  );
  const isOwner = currentMembership?.role === 'owner';
  const household = detailsData?.household;

  useEffect(() => {
    if (household?.name) setRenameValue(household.name);
  }, [household?.name]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => {
      const token = useAuthStore.getState().accessToken!;
      return authService.updateProfile(token, { name });
    },
    onSuccess: ({ user: updatedUser }) => {
      const token = useAuthStore.getState().accessToken!;
      setUser(updatedUser, token);
      setNameValue(updatedUser.name);
      showSuccess('Name updated');
    },
    onError: (err: Error) => showError(err.message || 'Failed to update name'),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => householdService.renameHousehold(activeHouseholdId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      showSuccess('Household renamed');
    },
    onError: (err: Error) => showError(err.message || 'Failed to rename household'),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => householdService.inviteMember(activeHouseholdId!, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
      showSuccess('Invite sent');
      setInviteEmail('');
    },
    onError: (err: Error) => showError(err.message || 'Failed to send invite'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => householdService.removeMember(activeHouseholdId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
      showSuccess('Member removed');
    },
    onError: (err: Error) => showError(err.message || 'Failed to remove member'),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId: string) => householdService.cancelInvite(activeHouseholdId!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
      showSuccess('Invite cancelled');
    },
    onError: (err: Error) => showError(err.message || 'Failed to cancel invite'),
  });

  const createHouseholdMutation = useMutation({
    mutationFn: async (name: string) => {
      const { household } = await householdService.createHousehold(name);
      await householdService.switchHousehold(household.id);
      return household;
    },
    onSuccess: async (newHousehold) => {
      const token = useAuthStore.getState().accessToken!;
      const { user: updatedUser } = await authService.getCurrentUser(token);
      setUser(updatedUser, token);
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['household-details'] });
      showSuccess(`'${newHousehold.name}' created and set as active`);
      setNewHouseholdName('');
    },
    onError: (err: Error) => showError(err.message || 'Failed to create household'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user?.name) return;
    updateNameMutation.mutate(trimmed);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    renameMutation.mutate(trimmed);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteEmail.trim();
    if (!trimmed) return;
    inviteMutation.mutate(trimmed);
  };

  const handleCreateHousehold = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHouseholdName.trim();
    if (!trimmed) return;
    createHouseholdMutation.mutate(trimmed);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="household">Household</TabsTrigger>
        </TabsList>

        {/* ── Account Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Name</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleNameSubmit} className="flex items-end gap-3">
                <div className="space-y-1 flex-1 max-w-sm">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    updateNameMutation.isPending ||
                    !nameValue.trim() ||
                    nameValue.trim() === user?.name
                  }
                >
                  {updateNameMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Household Tab ────────────────────────────────────────────────── */}
        <TabsContent value="household" className="mt-6 space-y-6">

          {/* Create New Household */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Household</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleCreateHousehold} className="flex items-center gap-3">
                <Input
                  type="text"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  placeholder="Household name"
                  className="max-w-sm"
                />
                <Button
                  type="submit"
                  disabled={createHouseholdMutation.isPending || !newHouseholdName.trim()}
                >
                  {createHouseholdMutation.isPending ? 'Creating...' : 'Create Household'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Household Name */}
          <Card>
            <CardHeader>
              <CardTitle>Household</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingDetails ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <form onSubmit={handleRenameSubmit} className="flex items-end gap-3">
                  <div className="space-y-1 flex-1 max-w-sm">
                    <Label htmlFor="household-name">Household name</Label>
                    <Input
                      id="household-name"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      placeholder="Household name"
                      readOnly={!isOwner}
                    />
                  </div>
                  {isOwner && (
                    <Button
                      type="submit"
                      disabled={
                        renameMutation.isPending ||
                        !renameValue.trim() ||
                        renameValue.trim() === household?.name
                      }
                    >
                      {renameMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {isLoadingDetails ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : household?.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members found.</p>
              ) : (
                household?.members.map((member) => {
                  const isSelf = member.user.id === user?.id;
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.user.name}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                        {isOwner && !isSelf && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
                            onClick={() => removeMemberMutation.mutate(member.user.id)}
                            disabled={removeMemberMutation.isPending}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Pending Invites (owner only) */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invites</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {isLoadingDetails ? (
                  <Skeleton className="h-10 w-full" />
                ) : household?.invites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending invites.</p>
                ) : (
                  household?.invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires {new Date(invite.expiresAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
                        onClick={() => cancelInviteMutation.mutate(invite.id)}
                        disabled={cancelInviteMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Invite Member (owner only) */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Invite Member</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleInviteSubmit} className="flex items-center gap-3">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    className="max-w-sm"
                  />
                  <Button
                    type="submit"
                    disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  >
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}


        </TabsContent>
      </Tabs>
    </div>
  );
}
