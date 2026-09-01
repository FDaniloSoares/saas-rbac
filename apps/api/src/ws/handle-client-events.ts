import type { RawData, WebSocket } from 'ws';

import { prisma } from '@/lib/prisma';
import { getConversationId } from '@/utils/get-conversation-id';

import { createMessage, markAsRead, serializeMessage } from './message-store';
import { send, sendToUser } from './presence';
import { clientEventSchema } from './protocol';

const RATE_LIMIT_WINDOW_IN_MS = 10_000;
const RATE_LIMIT_MAX_EVENTS = 20;

interface HandleClientEventParams {
  socket: WebSocket;
  userId: string;
  organizationId: string;
  raw: RawData;
}

/* WeakMap: a entrada some quando o socket é coletado, sem cleanup no close */
const rateLimits = new WeakMap<WebSocket, { count: number; resetAt: number }>();

function isRateLimited(socket: WebSocket) {
  const now = Date.now();
  const bucket = rateLimits.get(socket);

  if (!bucket || now > bucket.resetAt) {
    rateLimits.set(socket, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_IN_MS,
    });

    return false;
  }

  bucket.count += 1;

  return bucket.count > RATE_LIMIT_MAX_EVENTS;
}

export async function handleClientEvent({
  socket,
  userId,
  organizationId,
  raw,
}: HandleClientEventParams) {
  /* nada aqui pode escapar: exceção em listener async vira unhandled
  rejection e derruba o processo, e o errorHandler do Fastify não
  alcança nada depois do upgrade */
  try {
    if (isRateLimited(socket)) {
      return send(socket, {
        type: 'error',
        code: 'RATE_LIMITED',
        message: 'Too many events, slow down',
      });
    }

    const parsed = clientEventSchema.safeParse(JSON.parse(String(raw)));

    if (!parsed.success) {
      return send(socket, {
        type: 'error',
        code: 'INVALID_EVENT',
        message: 'Malformed event',
      });
    }

    const event = parsed.data;

    /* userId e organizationId vêm do handshake, nunca do payload */
    const targetUserId =
      event.type === 'message:send' ? event.toUserId : event.withUserId;

    if (targetUserId === userId) {
      return send(socket, {
        type: 'error',
        code: 'INVALID_RECIPIENT',
        message: 'You cannot start a conversation with yourself',
      });
    }

    /* o outro lado precisa ser membro DA MESMA org desta conexão */
    const target = await prisma.member.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
      select: { userId: true },
    });

    if (!target) {
      return send(socket, {
        type: 'error',
        code: 'RECIPIENT_NOT_FOUND',
        message: 'Recipient is not a member of this organization',
      });
    }

    const conversationId = getConversationId(
      organizationId,
      userId,
      targetUserId
    );

    if (event.type === 'message:send') {
      /* 1. persiste  2. entrega — nunca o contrário */
      const message = serializeMessage(
        await createMessage({
          conversationId,
          organizationId,
          senderId: userId,
          recipientId: targetUserId,
          content: event.content,
        })
      );

      sendToUser(organizationId, targetUserId, {
        type: 'message:new',
        message,
      });

      /* outras abas de quem enviou: esta já vai pintar pelo ack */
      sendToUser(
        organizationId,
        userId,
        { type: 'message:new', message },
        { exceptSocket: socket }
      );

      return send(socket, {
        type: 'message:ack',
        clientId: event.clientId,
        message,
      });
    }

    if (event.type === 'message:read') {
      const { ids, readAt } = await markAsRead(conversationId, userId);

      if (ids.length === 0) {
        return;
      }

      /* recibo de leitura para o autor das mensagens */
      return sendToUser(organizationId, targetUserId, {
        type: 'message:read',
        withUserId: userId,
        readAt,
      });
    }
  } catch {
    send(socket, {
      type: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Could not process event',
    });
  }
}
