import type { ChatMessage } from './protocol';

const MAX_MESSAGES_PER_CONVERSATION = 200;

export interface StoreMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface ConversationSummary {
  withUserId: string;
  lastMessage: ChatMessage;
  unreadCount: number;
}

/* armazenamento volátil: some no restart. a interface é async de propósito,
para que trocar por Prisma depois seja reescrever este módulo e mais nada */
const conversations = new Map<string, StoreMessage[]>();

/* projeção explícita do que vai pra rede: conversationId e organizationId
são internos. campo novo em StoreMessage não vaza sem passar por aqui */
export function serializeMessage(message: StoreMessage): ChatMessage {
  return {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    recipientId: message.recipientId,
    createdAt: message.createdAt,
    readAt: message.readAt,
  };
}

export async function createMessage(data: {
  conversationId: string;
  organizationId: string;
  senderId: string;
  recipientId: string;
  content: string;
}): Promise<StoreMessage> {
  const message: StoreMessage = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  const messages = conversations.get(data.conversationId) ?? [];

  messages.push(message);

  /* buffer circular: sem isto o Map cresce até o processo morrer */
  if (messages.length > MAX_MESSAGES_PER_CONVERSATION) {
    messages.splice(0, messages.length - MAX_MESSAGES_PER_CONVERSATION);
  }

  conversations.set(data.conversationId, messages);

  return message;
}

/* cursor (`before`) e não offset: mensagens novas chegando durante a
rolagem deslocariam uma janela baseada em offset */
export async function listMessages(
  conversationId: string,
  { limit = 50, before }: { limit?: number; before?: string } = {}
): Promise<StoreMessage[]> {
  const messages = conversations.get(conversationId) ?? [];

  const cursorIndex = before
    ? messages.findIndex((message) => message.id === before)
    : -1;

  const end = cursorIndex === -1 ? messages.length : cursorIndex;

  return messages.slice(Math.max(0, end - limit), end);
}

export async function markAsRead(
  conversationId: string,
  readerId: string
): Promise<{ ids: string[]; readAt: string }> {
  const messages = conversations.get(conversationId) ?? [];
  const readAt = new Date().toISOString();

  const ids = messages
    .filter((message) => message.recipientId === readerId && !message.readAt)
    .map((message) => {
      message.readAt = readAt;

      return message.id;
    });

  return { ids, readAt };
}

export async function listConversationSummaries(
  organizationId: string,
  userId: string
): Promise<ConversationSummary[]> {
  const summaries: ConversationSummary[] = [];

  for (const [conversationId, messages] of conversations) {
    if (messages.length === 0) {
      continue;
    }

    /* a chave é `<orgId>:<userA>:<userB>` e uuid não contém ':' */
    const [conversationOrganizationId, first, second] =
      conversationId.split(':');

    if (conversationOrganizationId !== organizationId) {
      continue;
    }

    if (first !== userId && second !== userId) {
      continue;
    }

    summaries.push({
      withUserId: first === userId ? second : first,
      lastMessage: serializeMessage(messages[messages.length - 1]),
      unreadCount: messages.filter(
        (message) => message.recipientId === userId && !message.readAt
      ).length,
    });
  }

  return summaries.sort((a, b) =>
    b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt)
  );
}
