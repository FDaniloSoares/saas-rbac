import type { ChatMessage } from '@saas/chat';

import { api } from './api-client';

export interface ConversationSummary {
  withUserId: string;
  lastMessage: ChatMessage;
  unreadCount: number;
}

interface GetConversationsResponse {
  conversations: ConversationSummary[];
}

export async function getConversations(org: string) {
  return api
    .get(`organizations/${org}/conversations`)
    .json<GetConversationsResponse>();
}
