import { Role } from '@saas/auth';

import { api } from './api-client';

interface GetMembersResponse {
  members: {
    id: string;
    userId: string;
    role: Role;
    description: string | null;
    name: string;
    email: string;
    avatarUrl: string | null;
  }[];
}

export async function getMembers(org: string): Promise<GetMembersResponse> {
  const response = await api
    .get(`organizations/${org}/members`, {
      next: {
        tags: [`${org}/members`],
      },
    })
    .json<GetMembersResponse>();

  return response;
}
