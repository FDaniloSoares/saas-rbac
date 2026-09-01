import type { WebSocket } from '@fastify/websocket';

import type { ServerEvent } from './protocol';

const OFFLINE_GRACE_PERIOD_IN_MS = 5000;

interface OrganizationPresence {
  /* um usuário pode ter várias abas abertas, por isso um Set de sockets */
  users: Map<string, Set<WebSocket>>;
  pendingOffline: Map<string, NodeJS.Timeout>;
}

const organizations = new Map<string, OrganizationPresence>();

function getOrganizationPresence(organizationId: string) {
  let presence = organizations.get(organizationId);

  if (!presence) {
    presence = { users: new Map(), pendingOffline: new Map() };
    organizations.set(organizationId, presence);
  }

  return presence;
}

export function send(socket: WebSocket, event: ServerEvent) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(event));
  }
}

function broadcast(organizationId: string, event: ServerEvent) {
  const presence = organizations.get(organizationId);

  if (!presence) {
    return;
  }

  const payload = JSON.stringify(event);

  for (const sockets of presence.users.values()) {
    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) {
        socket.send(payload);
      }
    }
  }
}

export function getOnlineUserIds(organizationId: string) {
  const presence = organizations.get(organizationId);

  return presence ? [...presence.users.keys()] : [];
}

export function connect(
  organizationId: string,
  userId: string,
  socket: WebSocket
) {
  const presence = getOrganizationPresence(organizationId);

  /* reconectou dentro do período de graça: cancela o offline agendado */
  const pendingOffline = presence.pendingOffline.get(userId);

  if (pendingOffline) {
    clearTimeout(pendingOffline);
    presence.pendingOffline.delete(userId);
  }

  let sockets = presence.users.get(userId);

  if (!sockets) {
    sockets = new Set();
    presence.users.set(userId, sockets);
  }

  const wasOnline = sockets.size > 0 || Boolean(pendingOffline);

  sockets.add(socket);

  /* estado atual da org só pra quem acabou de entrar */
  send(socket, {
    type: 'presence:sync',
    userIds: getOnlineUserIds(organizationId),
  });

  /* segunda aba do mesmo usuário não avisa ninguém */
  if (!wasOnline) {
    broadcast(organizationId, { type: 'presence:online', userId });
  }
}

export function disconnect(
  organizationId: string,
  userId: string,
  socket: WebSocket
) {
  const presence = organizations.get(organizationId);
  const sockets = presence?.users.get(userId);

  if (!presence || !sockets) {
    return;
  }

  sockets.delete(socket);

  /* Ainda tem outra aba aberta: continua online */
  if (sockets.size > 0) {
    return;
  }

  /* segura o offline: um F5 fecha e reabre o socket em ms */
  const timeout = setTimeout(() => {
    presence.pendingOffline.delete(userId);

    if ((presence.users.get(userId)?.size ?? 0) > 0) {
      return;
    }

    presence.users.delete(userId);
    broadcast(organizationId, { type: 'presence:offline', userId });

    if (presence.users.size === 0) {
      organizations.delete(organizationId);
    }
  }, OFFLINE_GRACE_PERIOD_IN_MS);

  presence.pendingOffline.set(userId, timeout);
}

export function sendToUser(
  organizationId: string,
  userId: string,
  event: ServerEvent,
  options?: { exceptSocket?: WebSocket }
) {
  const sockets = organizations.get(organizationId)?.users.get(userId);

  if (!sockets) {
    return;
  }

  const payload = JSON.stringify(event);

  for (const socket of sockets) {
    if (socket === options?.exceptSocket) continue;
    if (socket.readyState === socket.OPEN) socket.send(payload);
  }
}
