import { describe, expect, it } from 'vitest';

import { buildApp } from '@/http/app';

import { addMember, createOrganization, createUser } from './factories';

describe('POST /organizations/:slug/projects', () => {
  it('não-membro recebe 401', async () => {
    const app = buildApp();

    await app.ready();

    const owner = await createUser();
    const organization = await createOrganization({ ownerId: owner.id });
    const outsider = await createUser();

    const response = await app.inject({
      method: 'POST',
      url: `/organizations/${organization.slug}/projects`,
      headers: {
        authorization: `Bearer ${app.jwt.sign({ sub: outsider.id })}`,
      },
      payload: {
        name: 'Projeto de fora',
        description: 'Criado por quem não é membro',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: 'You are not the father!!!' });

    await app.close();
  });

  it('BILLING não pode criar projeto', async () => {
    const app = buildApp();

    await app.ready();

    const owner = await createUser();
    const organization = await createOrganization({ ownerId: owner.id });
    const billing = await createUser();

    await addMember({
      organizationId: organization.id,
      userId: billing.id,
      role: 'BILLING',
    });

    const response = await app.inject({
      method: 'POST',
      url: `/organizations/${organization.slug}/projects`,
      headers: {
        authorization: `Bearer ${app.jwt.sign({ sub: billing.id })}`,
      },
      payload: {
        name: 'Projeto do billing',
        description: 'Criado por quem só cuida da fatura',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'You are not allowed to create a new project',
    });

    await app.close();
  });
});
