'use client';

import type { ChatMessage, ClientEvent, ServerEvent } from '@saas/chat';
import { env } from '@saas/env';
import { useQueryClient } from '@tanstack/react-query';
import { getCookie } from 'cookies-next/client';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

/* mensagem ainda não confirmada pelo servidor: id provisório = clientId */
export type PendingChatMessage = ChatMessage & { pending?: boolean };

export const messagesQueryKey = (withUserId: string) =>
  ['messages', withUserId] as const;

export const conversationsQueryKey = ['conversations'] as const;

interface ChatContextValue {
  onlineUserIds: Set<string>;
  currentUserId: string;
  sendMessage: (toUserId: string, content: string) => void;
  markAsRead: (withUserId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function useChat() {
  const value = use(ChatContext);

  if (!value) {
    throw new Error('useChat must be used inside a ChatProvider');
  }

  return value;
}

export function useOnlineUsers() {
  return useChat().onlineUserIds;
}

export function useChatActions() {
  const { sendMessage, markAsRead, currentUserId } = useChat();

  return { sendMessage, markAsRead, currentUserId };
}

export function ChatProvider({
  slug,
  currentUserId,
  children,
}: Readonly<{
  slug: string;
  currentUserId: string;
  children: React.ReactNode;
}>) {
  const queryClient = useQueryClient();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(
    () => new Set()
  );

  /* o socket vive fora do estado: trocá-lo não deve re-renderizar ninguém */
  const socketRef = useRef<WebSocket | null>(null);

  /* insere sem duplicar — o mesmo id pode chegar por ack e por message:new */
  const appendMessage = useCallback(
    (withUserId: string, message: ChatMessage) => {
      queryClient.setQueryData<PendingChatMessage[]>(
        messagesQueryKey(withUserId),
        (previous = []) =>
          previous.some((item) => item.id === message.id)
            ? previous
            : [...previous, message]
      );
    },
    [queryClient]
  );

  useEffect(() => {
    const token = getCookie('token');

    if (!token) return;

    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let attempt = 0;
    let unmounted = false;

    const open = () => {
      const url = new URL(`/organizations/${slug}/ws`, env.NEXT_PUBLIC_API_URL);

      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.searchParams.set('token', token);

      const socket = new WebSocket(url);

      socketRef.current = socket;

      socket.onopen = () => {
        attempt = 0;
      };

      socket.onmessage = (raw) => {
        const event: ServerEvent = JSON.parse(raw.data);

        switch (event.type) {
          case 'presence:sync':
            setOnlineUserIds(new Set(event.userIds));
            break;

          case 'presence:online':
            setOnlineUserIds((previous) => new Set(previous).add(event.userId));
            break;

          case 'presence:offline':
            setOnlineUserIds((previous) => {
              const next = new Set(previous);
              next.delete(event.userId);

              return next;
            });
            break;

          case 'message:new': {
            /* a conversa é sempre identificada pelo OUTRO participante */
            const withUserId =
              event.message.senderId === currentUserId
                ? event.message.recipientId
                : event.message.senderId;

            appendMessage(withUserId, event.message);
            queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
            break;
          }

          case 'message:ack':
            /* troca a bolha otimista pelo registro real. se ela não
            estiver mais lá — o queryFn do histórico pode ter resolvido
            no meio e sobrescrito o cache — insere no fim */
            queryClient.setQueryData<PendingChatMessage[]>(
              messagesQueryKey(event.message.recipientId),
              (previous = []) => {
                const replaced = previous.map((item) =>
                  item.id === event.clientId ? event.message : item
                );

                return replaced.some((item) => item.id === event.message.id)
                  ? replaced
                  : [...replaced, event.message];
              }
            );
            queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
            break;

          case 'message:read':
            /* recibo: minhas mensagens naquela conversa foram vistas */
            queryClient.setQueryData<PendingChatMessage[]>(
              messagesQueryKey(event.withUserId),
              (previous = []) =>
                previous.map((item) =>
                  item.senderId === currentUserId && !item.readAt
                    ? { ...item, readAt: event.readAt }
                    : item
                )
            );
            break;

          case 'error':
            console.error(`[chat] ${event.code}: ${event.message}`);
            break;
        }
      };

      socket.onclose = () => {
        /* só limpa se ainda for o socket atual: o close de um socket
        antigo chega depois de o novo já ter assumido a referência
        (StrictMode em dev, ou troca de organização) */
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (unmounted) return;

        /* sem conexão não dá pra afirmar que alguém está online */
        setOnlineUserIds(new Set());

        /* backoff exponencial com jitter: sem o jitter, todo mundo
        reconecta no mesmo milissegundo quando a API reinicia */
        const delay =
          Math.min(1000 * 2 ** attempt, 30_000) * (0.5 + Math.random() / 2);

        attempt += 1;
        reconnectTimeout = setTimeout(open, delay);
      };
    };

    open();

    return () => {
      unmounted = true;
      clearTimeout(reconnectTimeout);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [slug, currentUserId, queryClient, appendMessage]);

  const send = useCallback((event: ClientEvent) => {
    const socket = socketRef.current;

    if (socket?.readyState !== WebSocket.OPEN) {
      /* descartar em silêncio esconde bug: sem log, uma mensagem
      simplesmente não sai e a bolha fica pendente para sempre */
      console.warn('[chat] socket indisponível, evento descartado', event.type);

      return;
    }

    socket.send(JSON.stringify(event));
  }, []);

  const sendMessage = useCallback(
    (toUserId: string, content: string) => {
      const clientId = crypto.randomUUID();

      /* pinta na hora; o ack substitui pelo registro do servidor */
      queryClient.setQueryData<PendingChatMessage[]>(
        messagesQueryKey(toUserId),
        (previous = []) => [
          ...previous,
          {
            id: clientId,
            content,
            senderId: currentUserId,
            recipientId: toUserId,
            createdAt: new Date().toISOString(),
            readAt: null,
            pending: true,
          },
        ]
      );

      send({ type: 'message:send', toUserId, content, clientId });
    },
    [currentUserId, queryClient, send]
  );

  const markAsRead = useCallback(
    (withUserId: string) => {
      send({ type: 'message:read', withUserId });
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
    [queryClient, send]
  );

  return (
    <ChatContext
      value={{ onlineUserIds, currentUserId, sendMessage, markAsRead }}
    >
      {children}
    </ChatContext>
  );
}
