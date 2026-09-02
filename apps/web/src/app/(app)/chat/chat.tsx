'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  conversationsQueryKey,
  useOnlineUsers,
} from '@/components/ws/chat-provider';
import { getConversations } from '@/http/get-conversations';
import { cn } from '@/lib/utils';

import { ContactAvatar } from './contact-avatar';
import { ConversationView } from './conversation-view';

export interface Contact {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

interface ChatProps {
  org: string | null;
  contacts: Contact[];
}

export default function Chat({ org, contacts }: Readonly<ChatProps>) {
  const onlineUserIds = useOnlineUsers();
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* prévia e não-lidas por contato; o provider invalida esta query
  sempre que uma mensagem entra ou é marcada como lida */
  const { data } = useQuery({
    queryKey: conversationsQueryKey,
    queryFn: () => getConversations(org!),
    enabled: Boolean(org),
  });

  const summaries = new Map(
    data?.conversations.map((conversation) => [
      conversation.withUserId,
      conversation,
    ])
  );

  const activeContact =
    contacts.find((contact) => contact.userId === activeId) ?? null;

  function toggleExpanded() {
    setExpanded((prevExpanded) => !prevExpanded);
  }

  function openConversation(id: string) {
    setActiveId(id);
    setExpanded(true);
  }

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border',
        'flex h-full flex-col overflow-hidden rounded-l-2xl border-l shadow-xl',
        'transition-[width] duration-300 ease-in-out',
        expanded ? 'w-72' : 'w-16'
      )}
    >
      {expanded && activeContact && org ? (
        <ConversationView
          key={activeContact.userId}
          org={org}
          contact={activeContact}
          online={onlineUserIds.has(activeContact.userId)}
          onBack={() => setActiveId(null)}
        />
      ) : (
        <>
          <div className="border-sidebar-border flex h-12 shrink-0 items-center gap-2 border-b px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpanded}
              aria-label={expanded ? 'Recolher chat' : 'Expandir chat'}
            >
              {expanded ? <ChevronsRight /> : <ChevronsLeft />}
            </Button>

            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap transition-opacity duration-200',
                expanded ? 'opacity-100 delay-100' : 'opacity-0'
              )}
            >
              Mensagens
            </span>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto p-2">
            {contacts.map((contact) => {
              const summary = summaries.get(contact.userId);

              return (
                <button
                  key={contact.userId}
                  type="button"
                  title={contact.name}
                  onClick={() => openConversation(contact.userId)}
                  className="hover:bg-sidebar-accent flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors"
                >
                  <div className="relative shrink-0">
                    <ContactAvatar
                      name={contact.name}
                      avatarUrl={contact.avatarUrl}
                      online={onlineUserIds.has(contact.userId)}
                    />

                    {/* recolhido: o badge é a única pista de mensagem nova */}
                    {!expanded && Boolean(summary?.unreadCount) && (
                      <span className="bg-primary text-primary-foreground ring-sidebar absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-medium ring-2">
                        {summary!.unreadCount > 9 ? '9+' : summary!.unreadCount}
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      'min-w-0 flex-1 transition-opacity duration-200',
                      expanded ? 'opacity-100 delay-100' : 'opacity-0'
                    )}
                  >
                    <p className="truncate text-sm font-medium">
                      {contact.name}
                    </p>

                    {summary && (
                      <p className="text-muted-foreground truncate text-xs">
                        {summary.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {expanded && Boolean(summary?.unreadCount) && (
                    <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium">
                      {summary!.unreadCount > 9 ? '9+' : summary!.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
