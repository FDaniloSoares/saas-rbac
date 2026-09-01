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

const conversations = new Map<string, StoreMessage[]>();

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

  const messages = conversations.get(data.conversationId!) ?? [];

  messages.push(message);

  /* buffer circular: descarta as mais antigas */
  if (messages.length > MAX_MESSAGES_PER_CONVERSATION) {
    messages.splice(0, messages.length - MAX_MESSAGES_PER_CONVERSATION);
  }

  conversations.set(data.conversationId, messages);

  return message;
}

export async function listMessages(
  conversationId: string,
  { limit = 50, before }: { limit?: number; before?: string } = {}
): Promise<StoreMessage[]> {
  const messages = conversations.get(conversationId) ?? [];

  const end = before
    ? messages.findIndex((message) => message.id === before)
    : messages.length;

  return messages.slice(Math.max(0, end - limit), end);
}

export async function markAsRead(
  conversationId: string,
  readerId: string
): Promise<string[]> {
  const messages = conversations.get(conversationId) ?? [];
  const readAt = new Date().toISOString();

  return messages
    .filter((message) => message.recipientId === readerId && !message.readAt)
    .map((message) => {
      message.readAt = readAt;

      return message.id;
    });
}
