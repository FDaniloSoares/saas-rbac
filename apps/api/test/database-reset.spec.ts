import { describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';

/* este arquivo roda depois de create-project.spec.ts, que grava usuários,
organizações e membros. se o truncate do setup não disparasse, as contagens
abaixo viriam preenchidas — tanto por causa do arquivo anterior desta mesma
execução quanto por causa da execução anterior do comando */
describe('isolamento entre execuções', () => {
  it('comeca com as tabelas vazias', async () => {
    const [users, organizations, members, projects] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.member.count(),
      prisma.project.count(),
    ]);

    expect({ users, organizations, members, projects }).toEqual({
      users: 0,
      organizations: 0,
      members: 0,
      projects: 0,
    });
  });
});
