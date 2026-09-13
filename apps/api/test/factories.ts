import { faker } from '@faker-js/faker';

import { prisma } from '@/lib/prisma';
import { createSlug } from '@/utils/create-slaug';

type Role = 'ADMIN' | 'MEMBER' | 'BILLING';

export async function createUser() {
  return prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
  });
}

/* devolve a organização e o dono. o dono entra como ADMIN, que é o que
`create-organization` faz hoje */
export async function createOrganization({ ownerId }: { ownerId: string }) {
  const name = faker.company.name();

  return prisma.organization.create({
    data: {
      name,
      slug: createSlug(`${name} ${faker.string.nanoid(8)}`),
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: 'ADMIN',
        },
      },
    },
  });
}

export async function addMember({
  organizationId,
  userId,
  role,
}: {
  organizationId: string;
  userId: string;
  role: Role;
}) {
  return prisma.member.create({
    data: { organizationId, userId, role },
  });
}
