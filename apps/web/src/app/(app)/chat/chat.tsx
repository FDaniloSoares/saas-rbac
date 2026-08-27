'use client';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ContactAvatar } from './contact-avatar';
import { ConversationView } from './conversation-view';
import { conversations } from './conversations';

export default function Chat() {
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? null;

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
      {expanded && activeConversation ? (
        <ConversationView
          conversation={activeConversation}
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
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                title={conversation.name}
                onClick={() => openConversation(conversation.id)}
                className="hover:bg-sidebar-accent flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors"
              >
                <ContactAvatar
                  name={conversation.name}
                  online={conversation.online}
                />

                <div
                  className={cn(
                    'min-w-0 flex-1 transition-opacity duration-200',
                    expanded ? 'opacity-100 delay-100' : 'opacity-0'
                  )}
                >
                  <p className="truncate text-sm font-medium">
                    {conversation.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {conversation.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </nav>
        </>
      )}
    </aside>
  );
}
