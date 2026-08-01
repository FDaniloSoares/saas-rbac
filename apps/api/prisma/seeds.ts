import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@saas/env';
import { hash } from 'bcryptjs';
import { Pool } from 'pg';

import { PrismaClient } from './generated/client/client';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['query'],
});

async function seed() {
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash('123', 1);

  await prisma.user.createMany({
    data: [
      {
        name: 'John Senna',
        email: 'john@senna.com',
        avatarUrl: 'https://github.com/fdanilosoares.png',
        passwordHash,
      },
      {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatarUrl: faker.image.avatarGitHub(),
        passwordHash,
      },
      {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatarUrl: faker.image.avatarGitHub(),
        passwordHash,
      },
    ],
  });

  const [user, anotherUser, anotherUser2] = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    take: 3,
  });

  const organization = await prisma.organization.create({
    data: {
      nome: 'Acme Inc (Admin)',
      slug: 'acme-inc-admin',
      domain: 'acme.com',
      shouldAttachUsersByDomain: true,
      avatarUrl: 'https://github.com/acme.png',
      owner: {
        connect: { id: user.id },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: 'ADMIN',
            },
            {
              userId: anotherUser.id,
              role: 'MEMBER',
            },
            {
              userId: anotherUser2.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    },
  });

  await prisma.project.create({
    data: {
      nome: faker.lorem.words(5),
      slug: faker.lorem.slug(5),
      description: faker.lorem.paragraph(),
      avatarUrl: faker.image.avatarGitHub(),
      organization: {
        connect: { id: organization.id },
      },
      owner: {
        connect: { id: user.id },
      },
    },
  });

  await prisma.project.create({
    data: {
      nome: faker.lorem.words(5),
      slug: faker.lorem.slug(5),
      description: faker.lorem.paragraph(),
      avatarUrl: faker.image.avatarGitHub(),
      organization: {
        connect: { id: organization.id },
      },
      owner: {
        connect: { id: anotherUser.id },
      },
    },
  });

  await prisma.project.create({
    data: {
      nome: faker.lorem.words(5),
      slug: faker.lorem.slug(5),
      description: faker.lorem.paragraph(),
      avatarUrl: faker.image.avatarGitHub(),
      organization: {
        connect: { id: organization.id },
      },
      owner: {
        connect: { id: anotherUser2.id },
      },
    },
  });

  const memberOrganization = await prisma.organization.create({
    data: {
      nome: 'Rocketseat (Member)',
      slug: 'rocketseat-member',
      avatarUrl: 'https://github.com/rocketseat.png',
      owner: {
        connect: { id: anotherUser.id },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: 'MEMBER',
            },
            {
              userId: anotherUser.id,
              role: 'ADMIN',
            },
            {
              userId: anotherUser2.id,
              role: 'MEMBER',
            },
          ],
        },
      },
      projects: {
        createMany: {
          data: [
            {
              nome: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user.id,
            },
            {
              nome: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: anotherUser.id,
            },
            {
              nome: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: anotherUser2.id,
            },
          ],
        },
      },
    },
  });

  const billingOrganization = await prisma.organization.create({
    data: {
      nome: 'Vercel (Billing)',
      slug: 'vercel-billing',
      avatarUrl: 'https://github.com/vercel.png',
      owner: {
        connect: { id: anotherUser2.id },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: 'BILLING',
            },
            {
              userId: anotherUser.id,
              role: 'MEMBER',
            },
            {
              userId: anotherUser2.id,
              role: 'ADMIN',
            },
          ],
        },
      },
      projects: {
        createMany: {
          data: [
            {
              nome: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user.id,
            },
            {
              nome: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: anotherUser.id,
            },
            {
              nome: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: anotherUser2.id,
            },
          ],
        },
      },
    },
  });

  console.log('Seed completed successfully!');
  console.log('Organizations:', [
    organization.nome,
    memberOrganization.nome,
    billingOrganization.nome,
  ]);
}

seed().then(() => {
  console.log();
});
