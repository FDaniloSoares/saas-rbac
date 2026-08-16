import { Role } from '@saas/auth';

import { api } from './api-client';

interface GetPendingInvitesResponse {
  invites: {
    id: string;
    email: string;
    role: Role;
    createdAt: string;
    organization: {
      name: string;
    };
    author: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    } | null;
  }[];
}

export async function getPendingInvites(): Promise<GetPendingInvitesResponse> {
  const response = await api
    .get('invites/pending-invites')
    .json<GetPendingInvitesResponse>();

  return response;
}
