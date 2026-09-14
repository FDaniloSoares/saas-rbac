import { request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { ServerEvent } from '@saas/chat';
import { describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';

import { buildApp } from '@/http/app';
import { handleClientEvent } from '@/ws/handle-client-events';
import { connect, getOnlineUserIds } from '@/ws/presence';

import { addMember, createOrganization, createUser } from './factories';

/* `presence.send` só escreve em socket com readyState === OPEN, então o falso
precisa das duas propriedades e delas batendo */
function fakeSocket() {
  const received: ServerEvent[] = [];

  const socket = {
    OPEN: 1,
    readyState: 1,
    send(payload: string) {
      received.push(JSON.parse(payload));
    },
  };

  return { socket: socket as unknown as WebSocket, received };
}

describe('regra de membership', () => {
  it('nao-membro nao abre o websocket', async () => {
    const app = buildApp();

    /* `app.inject` nao faz upgrade de protocolo, entao o 401 do handshake so
    aparece com um cliente ws de verdade contra uma porta de verdade */
    await app.listen({ port: 0, host: '127.0.0.1' });

    const owner = await createUser();
    const organization = await createOrganization({ ownerId: owner.id });
    const outsider = await createUser();

    const { port } = app.server.address() as AddressInfo;
    const token = app.jwt.sign({ sub: outsider.id });

    const status = await new Promise<number>((resolve, reject) => {
      const client = httpRequest({
        host: '127.0.0.1',
        port,
        path: `/organizations/${organization.slug}/ws?token=${token}`,
        headers: {
          Connection: 'Upgrade',
          Upgrade: 'websocket',
          'Sec-WebSocket-Version': '13',
          'Sec-WebSocket-Key': Buffer.from('chave-de-teste-16').toString(
            'base64'
          ),
        },
      });

      /* resposta HTTP comum = o servidor recusou antes de trocar de protocolo */
      client.on('response', (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      });
      client.on('upgrade', (_response, socket) => {
        socket.destroy();
        reject(new Error('o socket subiu, e nao deveria'));
      });
      client.on('error', reject);
      client.end();
    });

    expect(status).toBe(401);
    expect(getOnlineUserIds(organization.id)).toEqual([]);

    await app.close();
  });

  it('entrega mensagem entre membros da mesma org', async () => {
    const owner = await createUser();
    const organization = await createOrganization({ ownerId: owner.id });
    const colleague = await createUser();

    await addMember({
      organizationId: organization.id,
      userId: colleague.id,
      role: 'MEMBER',
    });

    const sender = fakeSocket();
    const recipient = fakeSocket();

    connect(organization.id, colleague.id, recipient.socket);

    await handleClientEvent({
      socket: sender.socket,
      userId: owner.id,
      organizationId: organization.id,
      raw: JSON.stringify({
        type: 'message:send',
        toUserId: colleague.id,
        content: 'oi',
        clientId: crypto.randomUUID(),
      }) as unknown as Buffer,
    });

    expect(sender.received.map((event) => event.type)).toContain('message:ack');
    expect(recipient.received.map((event) => event.type)).toContain(
      'message:new'
    );
  });

  it('recusa destinatario de fora da organizacao', async () => {
    const owner = await createUser();
    const organization = await createOrganization({ ownerId: owner.id });

    const strangerOwner = await createUser();
    const otherOrganization = await createOrganization({
      ownerId: strangerOwner.id,
    });
    const stranger = await createUser();

    await addMember({
      organizationId: otherOrganization.id,
      userId: stranger.id,
      role: 'MEMBER',
    });

    const sender = fakeSocket();

    await handleClientEvent({
      socket: sender.socket,
      userId: owner.id,
      organizationId: organization.id,
      raw: JSON.stringify({
        type: 'message:send',
        toUserId: stranger.id,
        content: 'oi',
        clientId: crypto.randomUUID(),
      }) as unknown as Buffer,
    });

    expect(sender.received).toContainEqual(
      expect.objectContaining({ type: 'error', code: 'RECIPIENT_NOT_FOUND' })
    );
  });
});
