import { request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { ServerEvent } from '@saas/chat';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '@/http/app';
import { getOnlineUserIds } from '@/ws/presence';

import { addMember, createOrganization, createUser } from './factories';

type App = ReturnType<typeof buildApp>;

let app: App;
let port: number;

beforeEach(async () => {
  app = buildApp();

  await app.listen({ port: 0, host: '127.0.0.1' });

  port = (app.server.address() as AddressInfo).port;
});

afterEach(async () => {
  await app.close();
});

interface OpenSocket {
  closed: Promise<{ code: number; reason: string }>;
  nextEvent(match: (event: ServerEvent) => boolean): Promise<ServerEvent>;
  destroy(): void;
}

interface Frame {
  opcode: number;
  payload: Buffer<ArrayBufferLike>;
}

/* varre o buffer acumulado e devolve os frames completos que couberem. o
servidor nunca mascara, e frames de controle são limitados a 125 bytes pela
RFC 6455, então só os de texto chegam a precisar do comprimento estendido */
function drainFrames(buffer: Buffer<ArrayBufferLike>): {
  frames: Frame[];
  rest: Buffer<ArrayBufferLike>;
} {
  const frames: Frame[] = [];
  let offset = 0;

  for (;;) {
    if (buffer.length - offset < 2) break;

    const opcode = buffer[offset] & 0x0f;
    const short = buffer[offset + 1] & 0x7f;

    let headerSize = 2;
    let length = short;

    if (short === 126) {
      if (buffer.length - offset < 4) break;
      length = buffer.readUInt16BE(offset + 2);
      headerSize = 4;
    } else if (short === 127) {
      if (buffer.length - offset < 10) break;
      length = Number(buffer.readBigUInt64BE(offset + 2));
      headerSize = 10;
    }

    if (buffer.length - offset < headerSize + length) break;

    frames.push({
      opcode,
      payload: buffer.subarray(offset + headerSize, offset + headerSize + length),
    });

    offset += headerSize + length;
  }

  return { frames, rest: buffer.subarray(offset) };
}

/* cliente WebSocket mínimo em cima de node:http. o `ws` não é dependência
direta deste workspace, e tudo que os checks afirmam é o frame de fechamento */
function openSocket(slug: string, token: string): Promise<OpenSocket> {
  return new Promise((resolve, reject) => {
    const client = httpRequest({
      host: '127.0.0.1',
      port,
      path: `/organizations/${slug}/ws?token=${token}`,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': Buffer.from(
          `k${Math.random()}`.padEnd(16, '0').slice(0, 16)
        ).toString('base64'),
      },
    });

    client.on('response', (response) => {
      response.resume();
      reject(new Error(`handshake recusado com ${response.statusCode}`));
    });

    client.on('upgrade', (_response, socket) => {
      const received: ServerEvent[] = [];
      const waiting: {
        match: (event: ServerEvent) => boolean;
        resolve: (event: ServerEvent) => void;
      }[] = [];

      let resolveClosed: (close: { code: number; reason: string }) => void;
      const closed = new Promise<{ code: number; reason: string }>((r) => {
        resolveClosed = r;
      });

      let buffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);

      socket.on('data', (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);

        const { frames, rest } = drainFrames(buffer);
        buffer = rest;

        for (const frame of frames) {
          /* 0x8 = close: payload é uint16 com o código, mais a razão em utf8 */
          if (frame.opcode === 0x8) {
            /* um close pode vir sem payload: a RFC permite, e ler os 2 bytes
            do código às cegas estoura o buffer em vez de reprovar o check */
            resolveClosed(
              frame.payload.length >= 2
                ? {
                    code: frame.payload.readUInt16BE(0),
                    reason: frame.payload.subarray(2).toString('utf8'),
                  }
                : { code: 1005, reason: '' }
            );
            continue;
          }

          if (frame.opcode !== 0x1) continue;

          const event = JSON.parse(frame.payload.toString('utf8'));

          received.push(event);

          const index = waiting.findIndex((entry) => entry.match(event));

          if (index !== -1) {
            waiting.splice(index, 1)[0].resolve(event);
          }
        }
      });

      resolve({
        closed,
        nextEvent(match) {
          const already = received.find(match);

          if (already) return Promise.resolve(already);

          return new Promise<ServerEvent>((resolveEvent) => {
            waiting.push({ match, resolve: resolveEvent });
          });
        },
        destroy: () => socket.destroy(),
      });
    });

    client.on('error', reject);
    client.end();
  });
}

async function organizationWithMember() {
  const owner = await createUser();
  const organization = await createOrganization({ ownerId: owner.id });
  const member = await createUser();

  const membership = await addMember({
    organizationId: organization.id,
    userId: member.id,
    role: 'MEMBER',
  });

  return { owner, organization, member, membership };
}

function asOwner(ownerId: string) {
  return { authorization: `Bearer ${app.jwt.sign({ sub: ownerId })}` };
}

describe('revogação de acesso', () => {
  it('remover membro fecha as duas abas', async () => {
    const { owner, organization, member, membership } =
      await organizationWithMember();

    const token = app.jwt.sign({ sub: member.id });

    const first = await openSocket(organization.slug, token);
    const second = await openSocket(organization.slug, token);

    const response = await app.inject({
      method: 'DELETE',
      url: `/organizations/${organization.slug}/members/${membership.id}`,
      headers: asOwner(owner.id),
    });

    expect(response.statusCode).toBe(204);

    const [firstClose, secondClose] = await Promise.all([
      first.closed,
      second.closed,
    ]);

    expect(firstClose).toEqual({ code: 4003, reason: 'membership-revoked' });
    expect(secondClose).toEqual({ code: 4003, reason: 'membership-revoked' });

    first.destroy();
    second.destroy();
  });

  it('removido sai da presenca', async () => {
    const { owner, organization, member, membership } =
      await organizationWithMember();

    const socket = await openSocket(
      organization.slug,
      app.jwt.sign({ sub: member.id })
    );

    expect(getOnlineUserIds(organization.id)).toContain(member.id);

    await app.inject({
      method: 'DELETE',
      url: `/organizations/${organization.slug}/members/${membership.id}`,
      headers: asOwner(owner.id),
    });

    await socket.closed;

    expect(getOnlineUserIds(organization.id)).not.toContain(member.id);

    socket.destroy();
  });

  it('quem fica ve o removido sair na hora', async () => {
    const { owner, organization, member, membership } =
      await organizationWithMember();

    const ownerSocket = await openSocket(
      organization.slug,
      app.jwt.sign({ sub: owner.id })
    );
    const memberSocket = await openSocket(
      organization.slug,
      app.jwt.sign({ sub: member.id })
    );

    const offline = ownerSocket.nextEvent(
      (event) => event.type === 'presence:offline'
    );

    await app.inject({
      method: 'DELETE',
      url: `/organizations/${organization.slug}/members/${membership.id}`,
      headers: asOwner(owner.id),
    });

    /* corrida contra um relógio, e não uma espera seguida de medição: o
    período de graça do `disconnect` é de 5000ms, então uma implementação que
    passasse por ele perderia esta corrida e reprovaria **por assertiva**, em
    2s. Medir depois de esperar faria o runner estourar o timeout primeiro, e
    aí quem elevasse `testTimeout` desligaria a discriminação sem perceber */
    const tooLate = Symbol('chegou depois da graça');

    const outcome = await Promise.race([
      offline,
      new Promise((resolve) => setTimeout(() => resolve(tooLate), 2000)),
    ]);

    expect(outcome).toEqual({
      type: 'presence:offline',
      userId: member.id,
    });

    ownerSocket.destroy();
    memberSocket.destroy();
  });

  it('removido sem socket nao anuncia offline', async () => {
    const { owner, organization, member, membership } =
      await organizationWithMember();

    /* só o dono conecta: o membro é removido sem nunca ter aberto socket */
    const ownerSocket = await openSocket(
      organization.slug,
      app.jwt.sign({ sub: owner.id })
    );

    await app.inject({
      method: 'DELETE',
      url: `/organizations/${organization.slug}/members/${membership.id}`,
      headers: asOwner(owner.id),
    });

    const offline = ownerSocket.nextEvent(
      (event) => event.type === 'presence:offline'
    );

    const nothing = Symbol('nenhum evento');

    const outcome = await Promise.race([
      offline,
      new Promise((resolve) => setTimeout(() => resolve(nothing), 1000)),
    ]);

    expect(outcome).toBe(nothing);
    expect(getOnlineUserIds(organization.id)).not.toContain(member.id);

    ownerSocket.destroy();
  });

  it('remover sem socket responde 204', async () => {
    const { owner, organization, membership } = await organizationWithMember();

    const response = await app.inject({
      method: 'DELETE',
      url: `/organizations/${organization.slug}/members/${membership.id}`,
      headers: asOwner(owner.id),
    });

    expect(response.statusCode).toBe(204);
  });

  it('remover duas vezes responde 404', async () => {
    const { owner, organization, membership } = await organizationWithMember();

    const url = `/organizations/${organization.slug}/members/${membership.id}`;

    const first = await app.inject({
      method: 'DELETE',
      url,
      headers: asOwner(owner.id),
    });
    const second = await app.inject({
      method: 'DELETE',
      url,
      headers: asOwner(owner.id),
    });

    expect(first.statusCode).toBe(204);
    expect(second.statusCode).toBe(404);
    expect(second.json()).toEqual({ message: 'Record not found.' });
  });

  it('removido nao reabre o socket', async () => {
    const { owner, organization, member, membership } =
      await organizationWithMember();

    const token = app.jwt.sign({ sub: member.id });

    await app.inject({
      method: 'DELETE',
      url: `/organizations/${organization.slug}/members/${membership.id}`,
      headers: asOwner(owner.id),
    });

    await expect(openSocket(organization.slug, token)).rejects.toThrow(
      'handshake recusado com 401'
    );

    expect(getOnlineUserIds(organization.id)).not.toContain(member.id);
  });

  it('encerrar org derruba todos', async () => {
    const { owner, organization, member } = await organizationWithMember();

    const ownerSocket = await openSocket(
      organization.slug,
      app.jwt.sign({ sub: owner.id })
    );
    const memberSocket = await openSocket(
      organization.slug,
      app.jwt.sign({ sub: member.id })
    );

    const response = await app.inject({
      method: 'DELETE',
      url: `/organizations/${organization.slug}`,
      headers: asOwner(owner.id),
    });

    expect(response.statusCode).toBe(204);

    const [ownerClose, memberClose] = await Promise.all([
      ownerSocket.closed,
      memberSocket.closed,
    ]);

    expect(ownerClose.code).toBe(4003);
    expect(memberClose.code).toBe(4003);

    ownerSocket.destroy();
    memberSocket.destroy();
  });

  it('org encerrada fica sem presenca', async () => {
    const { owner, organization, member } = await organizationWithMember();

    const memberSocket = await openSocket(
      organization.slug,
      app.jwt.sign({ sub: member.id })
    );

    expect(getOnlineUserIds(organization.id)).toContain(member.id);

    await app.inject({
      method: 'DELETE',
      url: `/organizations/${organization.slug}`,
      headers: asOwner(owner.id),
    });

    await memberSocket.closed;

    expect(getOnlineUserIds(organization.id)).toEqual([]);

    memberSocket.destroy();
  });
});
