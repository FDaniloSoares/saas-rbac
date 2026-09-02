import type { ChatMessage } from '@saas/chat';

import { api } from './api-client';

interface GetConversationMessagesResponse {
  messages: ChatMessage[];
}

export async function getConversationMessages(
  org: string,
  withUserId: string,
  { before, limit }: { before?: string; limit?: number } = {}
) {
  const searchParams = new URLSearchParams();

  if (before) searchParams.set('before', before);
  if (limit) searchParams.set('limit', String(limit));

  return api
    .get(`organizations/${org}/conversations/${withUserId}/messages`, {
      searchParams,
    })
    .json<GetConversationMessagesResponse>();
}
