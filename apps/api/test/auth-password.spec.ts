import { hash } from 'bcryptjs';
import { describe, expect, it } from 'vitest';

import { buildApp } from '@/http/app';
import { prisma } from '@/lib/prisma';

describe('POST /sessions/password', () => {
  it('assina token com credenciais validas', async () => {
    const app = buildApp();

    await app.ready();

    const email = 'com-senha@example.com';
    const password = 'senha-secreta';

    const user = await prisma.user.create({
      data: {
        name: 'Quem tem senha',
        email,
        passwordHash: await hash(password, 6),
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: { email, password },
    });

    expect(response.statusCode).toBe(201);

    const { token } = response.json();

    /* verifica contra o mesmo JWT_SECRET que a app usa */
    expect(app.jwt.verify<{ sub: string }>(token).sub).toBe(user.id);

    await app.close();
  });
});
