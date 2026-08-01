import { Role } from '@saas/auth';

import { api } from './api-client';

interface GetMembershipResponse {
  membership: {
    id: string;
    role: Role;
    userId: string;
    organizationId: string;
  };
}

export async function getMembership(
  slug: string
): Promise<GetMembershipResponse> {
  const response = await api
    .get(`organizations/${slug}/membership`)
    .json<GetMembershipResponse>();

  return response;
}
