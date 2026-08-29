'use client';

import { env } from '@saas/env';
import { getCookie } from 'cookies-next/client';
import { createContext, use, useEffect, useState } from 'react';

type PresenceEvent =
  | { type: 'presence:sync'; userIds: string[] }
  | { type: 'presence:online'; userId: string }
  | { type: 'presence:offline'; userId: string };

const OnlineUsersContext = createContext<Set<string>>(new Set());

export function useOnlineUsers() {
  return use(OnlineUsersContext);
}

export function PresenceProvider({
  slug,
  children,
}: Readonly<{ slug: string | null; children: React.ReactNode }>) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    const token = getCookie('token');

    if (!slug || !token) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let attempt = 0;
    let unmounted = false;

    const open = () => {
      const url = new URL(
        `/organizations/${slug}/presence`,
        env.NEXT_PUBLIC_API_URL
      );

      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.searchParams.set('token', token);

      socket = new WebSocket(url);

      socket.onopen = () => {
        attempt = 0;
      };

      socket.onmessage = (message) => {
        const event: PresenceEvent = JSON.parse(message.data);

        setOnlineUserIds((previous) => {
          if (event.type === 'presence:sync') {
            return new Set(event.userIds);
          }

          const next = new Set(previous);

          if (event.type === 'presence:online') {
            next.add(event.userId);
          } else {
            next.delete(event.userId);
          }

          return next;
        });
      };

      socket.onclose = () => {
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
      socket?.close();
    };
  }, [slug]);

  return (
    <OnlineUsersContext value={onlineUserIds}>{children}</OnlineUsersContext>
  );
}
