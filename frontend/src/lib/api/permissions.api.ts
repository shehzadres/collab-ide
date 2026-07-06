import { apiClient } from "./client";
import {
  Role,
  SessionMemberInfo,
  SessionInviteInfo,
  CreateInvitePayload,
} from "../../types/permission.types";

export const permissionsApi = {
  myRole: async (sessionId: string): Promise<Role | null> => {
    const { data } = await apiClient.get<{ role: Role | null }>(`/permissions/${sessionId}/me`);
    return data.role;
  },

  listMembers: async (sessionId: string): Promise<SessionMemberInfo[]> => {
    const { data } = await apiClient.get<{ members: SessionMemberInfo[] }>(`/permissions/${sessionId}/members`);
    return data.members;
  },

  updateMemberRole: async (sessionId: string, userId: string, role: Role): Promise<SessionMemberInfo> => {
    const { data } = await apiClient.patch<{ member: SessionMemberInfo }>(
      `/permissions/${sessionId}/members/${userId}`,
      { role }
    );
    return data.member;
  },

  removeMember: async (sessionId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/permissions/${sessionId}/members/${userId}`);
  },

  createInvite: async (sessionId: string, payload: CreateInvitePayload): Promise<SessionInviteInfo> => {
    const { data } = await apiClient.post<{ invite: SessionInviteInfo }>(`/permissions/${sessionId}/invites`, payload);
    return data.invite;
  },

  listInvites: async (sessionId: string): Promise<SessionInviteInfo[]> => {
    const { data } = await apiClient.get<{ invites: SessionInviteInfo[] }>(`/permissions/${sessionId}/invites`);
    return data.invites;
  },

  revokeInvite: async (inviteId: string): Promise<void> => {
    await apiClient.delete(`/permissions/invites/${inviteId}`);
  },

  redeemInvite: async (token: string): Promise<{ sessionId: string; role: Role }> => {
    const { data } = await apiClient.post<{ sessionId: string; role: Role }>(`/permissions/invites/${token}/redeem`);
    return data;
  },
};
