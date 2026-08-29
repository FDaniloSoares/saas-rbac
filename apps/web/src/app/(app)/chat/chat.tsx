'use client';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useOnlineUsers } from '@/components/ws/presence-provider';
import { cn } from '@/lib/utils';

import { ContactAvatar } from './contact-avatar';
import { ConversationView } from './conversation-view';

export interface Contact {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export default function Chat({ contacts }: Readonly<{ contacts: Contact[] }>) {
  const onlineUserIds = useOnlineUsers();
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

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
      {expanded && activeContact ? (
        <ConversationView
          key={activeContact.userId}
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
            {contacts.map((contact) => (
              <button
                key={contact.userId}
                type="button"
                title={contact.name}
                onClick={() => openConversation(contact.userId)}
                className="hover:bg-sidebar-accent flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors"
              >
                <ContactAvatar
                  name={contact.name}
                  avatarUrl={contact.avatarUrl}
                  online={onlineUserIds.has(contact.userId)}
                />

                <div
                  className={cn(
                    'min-w-0 flex-1 transition-opacity duration-200',
                    expanded ? 'opacity-100 delay-100' : 'opacity-0'
                  )}
                >
                  <p className="truncate text-sm font-medium">{contact.name}</p>
                </div>
              </button>
            ))}
          </nav>
        </>
      )}
    </aside>
  );
}
