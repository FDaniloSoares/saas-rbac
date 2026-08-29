'use client';

import dayjs from 'dayjs';
import { ArrowLeft, SendHorizontal } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { Contact } from './chat';
import { ContactAvatar } from './contact-avatar';

interface Message {
  id: string;
  content: string;
  sentAt: string;
  fromMe: boolean;
}

interface ConversationViewProps {
  contact: Contact;
  online: boolean;
  onBack: () => void;
}

export function ConversationView({
  contact,
  online,
  onBack,
}: ConversationViewProps) {
  /* TODO: histórico virá da API e as novas mensagens do WebSocket.
  por enquanto o estado é local e some ao trocar de contato */
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();

    if (!content) {
      return;
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: crypto.randomUUID(),
        content,
        sentAt: dayjs().format('HH:mm'),
        fromMe: true,
      },
    ]);

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
        {messages.length === 0 ? (
          <p className="text-muted-foreground mt-6 text-center text-xs text-balance">
            Nenhuma mensagem ainda. Diga oi para {contact.name}.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex w-fit max-w-[85%] flex-col rounded-xl px-3 py-2',
                message.fromMe
                  ? 'bg-primary text-primary-foreground ml-auto rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              )}
            >
              <span className="text-sm wrap-break-word">{message.content}</span>
              <span
                className={cn(
                  'mt-0.5 self-end text-[10px]',
                  message.fromMe
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                {message.sentAt}
              </span>
            </div>
          ))
        )}
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
