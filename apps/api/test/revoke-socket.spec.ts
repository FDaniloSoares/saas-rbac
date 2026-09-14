import { request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';

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
  destroy(): void;
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
      const closed = new Promise<{ code: number; reason: string }>(
        (resolveClosed) => {
          socket.on('data', (chunk: Buffer) => {
            /* frame de close: opcode 0x8, payload = uint16 code + razão utf8 */
            if ((chunk[0] & 0x0f) !== 0x8) return;

            const length = chunk[1] & 0x7f;
            const payload = chunk.subarray(2, 2 + length);

            resolveClosed({
              code: payload.readUInt16BE(0),
              reason: payload.subarray(2).toString('utf8'),
            });
          });
        }
      );

      resolve({ closed, destroy: () => socket.destroy() });
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
