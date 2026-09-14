import { describe, expect, it } from 'vitest';

import { buildApp } from '@/http/app';
import { prisma } from '@/lib/prisma';

import { brokenGithub, fakeGithub } from './fakes';

describe('POST /sessions/github', () => {
  it('autentica com github sem rede', async () => {
    const app = buildApp({
      github: fakeGithub({ email: 'octocat@example.com' }),
    });

    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/github',
      payload: { code: 'qualquer-code' },
    });

    expect(response.statusCode).toBe(201);

    const { token } = response.json();

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    await app.close();
  });

  it('github sem email recusa com 400', async () => {
    const app = buildApp({ github: fakeGithub({ email: null }) });

    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/github',
      payload: { code: 'qualquer-code' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: 'Email is required to authenticate with GitHub',
    });

    await app.close();
  });

  it('github fora do ar vira 500', async () => {
    const app = buildApp({ github: brokenGithub() });

    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/github',
      payload: { code: 'qualquer-code' },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ message: 'Internal server error' });

    await app.close();
  });

  it('github nao duplica usuario nem conta em duas chamadas', async () => {
    const email = 'reincidente@example.com';

    const app = buildApp({ github: fakeGithub({ email }) });

    await app.ready();

    const payload = { code: 'qualquer-code' };

    const first = await app.inject({
      method: 'POST',
      url: '/sessions/github',
      payload,
    });
    const second = await app.inject({
      method: 'POST',
      url: '/sessions/github',
      payload,
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);

    const users = await prisma.user.count({ where: { email } });
    const accounts = await prisma.account.count({
      where: { provider: 'GITHUB', user: { email } },
    });

    expect({ users, accounts }).toEqual({ users: 1, accounts: 1 });

    await app.close();
  });
});
