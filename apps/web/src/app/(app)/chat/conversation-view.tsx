'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowLeft, Check, CheckCheck, SendHorizontal } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  messagesQueryKey,
  type PendingChatMessage,
  useChatActions,
} from '@/components/ws/chat-provider';
import { getConversationMessages } from '@/http/get-conversation-messages';
import { cn } from '@/lib/utils';

import type { Contact } from './chat';
import { ContactAvatar } from './contact-avatar';

interface ConversationViewProps {
  org: string;
  contact: Contact;
  online: boolean;
  onBack: () => void;
}

export function ConversationView({
  org,
  contact,
  online,
  onBack,
}: ConversationViewProps) {
  const { sendMessage, markAsRead, currentUserId } = useChatActions();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  /* o React Query é a fonte única: o histórico entra por aqui e o
  WebSocket escreve neste mesmo cache quando chega mensagem nova */
  const { data: messages = [], isPending } = useQuery({
    queryKey: messagesQueryKey(contact.userId),
    queryFn: async () => {
      const { messages } = await getConversationMessages(org, contact.userId);

      return messages as PendingChatMessage[];
    },
  });

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  /* conversa aberta: o que chegar já nasce lido */
  const unreadCount = messages.filter(
    (message) => message.recipientId === currentUserId && !message.readAt
  ).length;

  useEffect(() => {
    if (unreadCount > 0) {
      markAsRead(contact.userId);
    }
  }, [unreadCount, contact.userId, markAsRead]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();

    if (!content) {
      return;
    }

    sendMessage(contact.userId, content);
    setDraft('');
  }

  return (
    <div className="flex h-full w-72 flex-col">
      <div className="border-sidebar-border flex h-12 shrink-0 items-center gap-2 border-b px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Voltar para as conversas"
        >
          <ArrowLeft />
        </Button>

        <ContactAvatar
          name={contact.name}
          avatarUrl={contact.avatarUrl}
          online={online}
          size="sm"
        />

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{contact.name}</p>
          {online && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              online
            </p>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3"
      >
        {isPending && (
          <p className="text-muted-foreground mt-6 text-center text-xs">
            Carregando mensagens...
          </p>
        )}

        {!isPending && messages.length === 0 && (
          <p className="text-muted-foreground mt-6 text-center text-xs text-balance">
            Nenhuma mensagem ainda. Diga oi para {contact.name}.
          </p>
        )}

        {messages.map((message) => {
          const fromMe = message.senderId === currentUserId;

          return (
            <div
              key={message.id}
              className={cn(
                'flex w-fit max-w-[85%] flex-col rounded-xl px-3 py-2',
                fromMe
                  ? 'bg-primary text-primary-foreground ml-auto rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm',
                message.pending && 'opacity-60'
              )}
            >
              <span className="text-sm wrap-break-word">{message.content}</span>

              <span
                className={cn(
                  'mt-0.5 flex items-center gap-1 self-end text-[10px]',
                  fromMe
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                {dayjs(message.createdAt).format('HH:mm')}

                {fromMe &&
                  !message.pending &&
                  (message.readAt ? (
                    <CheckCheck className="size-3" />
                  ) : (
                    <Check className="size-3" />
                  ))}
              </span>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-sidebar-border flex shrink-0 items-center gap-2 border-t p-2"
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escreva uma mensagem"
        />

        <Button
          type="submit"
          size="icon"
          disabled={!draft.trim()}
          aria-label="Enviar mensagem"
        >
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}
