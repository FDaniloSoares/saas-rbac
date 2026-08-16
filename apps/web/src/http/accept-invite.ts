import { api } from './api-client';

type CreateInviteResponse = void;

export async function acceptInvite(
  inviteId: string
): Promise<CreateInviteResponse> {
  await api.post(`invites/${inviteId}/accept`);
}
