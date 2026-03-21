import { apiClient } from '../lib/api';

export interface Household {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdMember {
  userId: string;
  householdId: string;
  role: 'owner' | 'member';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface HouseholdInvite {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInviteResponse {
  token: string;
  invitedEmail: string;
}

export interface HouseholdDetails extends Household {
  members: HouseholdMember[];
  invites: HouseholdInvite[];
}

export interface Membership {
  householdId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
  household: Household & {
    _count: { members: number };
  };
}

export interface InviteInfo {
  householdId: string;
  householdName: string;
  emailRequired: boolean;
  maskedInvitedEmail: string | null;
}

export const householdService = {
  async getHouseholds(): Promise<{ households: Membership[] }> {
    return apiClient.get<{ households: Membership[] }>('/api/households');
  },

  async createHousehold(name: string): Promise<{ household: Household }> {
    return apiClient.post<{ household: Household }>('/api/households', { name });
  },

  async switchHousehold(id: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/api/households/${id}/switch`);
  },

  async getHouseholdDetails(id: string): Promise<{ household: HouseholdDetails }> {
    return apiClient.get<{ household: HouseholdDetails }>(`/api/households/${id}`);
  },

  async renameHousehold(id: string, name: string): Promise<{ household: Household }> {
    return apiClient.patch<{ household: Household }>(`/api/households/${id}`, { name });
  },

  async inviteMember(householdId: string, email: string): Promise<CreateInviteResponse> {
    return apiClient.post<CreateInviteResponse>(`/api/households/${householdId}/invite`, { email });
  },

  async regenerateInvite(
    householdId: string,
    inviteId: string,
    email: string
  ): Promise<CreateInviteResponse> {
    await this.cancelInvite(householdId, inviteId);
    return this.inviteMember(householdId, email);
  },

  async removeMember(householdId: string, memberId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/api/households/${householdId}/members/${memberId}`);
  },

  async cancelInvite(householdId: string, inviteId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/api/households/${householdId}/invites/${inviteId}`);
  },

  async validateInvite(token: string): Promise<InviteInfo> {
    return apiClient.get<InviteInfo>(`/api/auth/invite/${token}`);
  },

  async acceptInvite(token: string, data: { name: string; email: string; password: string }) {
    return apiClient.post<{ user: any; accessToken: string }>(`/api/auth/invite/${token}/accept`, data);
  },

  async joinViaInvite(token: string): Promise<{ household: Household }> {
    return apiClient.post<{ household: Household }>(`/api/auth/invite/${token}/join`);
  },
};
