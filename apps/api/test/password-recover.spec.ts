import { describe, expect, it } from 'vitest';

import { buildApp } from '@/http/app';
import { prisma } from '@/lib/prisma';

import { fakeMailer } from './fakes';
import { createUser } from './factories';

describe('POST /password/recover', () => {
  it('envia codigo de recuperacao para email cadastrado', async () => {
    const { mailer, sent } = fakeMailer();

    const app = buildApp({ mailer });

    await app.ready();

    const user = await createUser();

    const response = await app.inject({
      method: 'POST',
      url: '/password/recover',
      payload: { email: user.email },
    });

    expect(response.statusCode).toBe(201);

    const token = await prisma.token.findFirstOrThrow({
      where: { userId: user.id, type: 'PASSWORD_RECOVER' },
    });

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(user.email);
    expect(sent[0].body).toContain(token.id);

    await app.close();
  });

  it('nao revela email inexistente', async () => {
    const { mailer, sent } = fakeMailer();

    const app = buildApp({ mailer });

    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/password/recover',
      payload: { email: 'ninguem@example.com' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBe('');
    expect(sent).toHaveLength(0);

    await app.close();
  });
});
