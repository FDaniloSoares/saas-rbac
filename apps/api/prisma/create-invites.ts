import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@saas/env';
import { Pool } from 'pg';

import { PrismaClient } from './generated/client/client';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const DEFAULT_SLUG = 'acme-inc-admin';
const DEFAULT_AMOUNT = 4;

const ROLES = ['ADMIN', 'MEMBER', 'BILLING'] as const;

async function createInvites() {
  const [slugArg, amountArg] = process.argv.slice(2);

  const slug = slugArg ?? DEFAULT_SLUG;
  const amount = Number(amountArg ?? DEFAULT_AMOUNT);

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { slug },
  });

  const author = await prisma.member.findFirstOrThrow({
    where: { organizationId: organization.id, role: 'ADMIN' },
  });

  const invites = await Promise.all(
    Array.from({ length: amount }).map(() =>
      prisma.invite.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          role: faker.helpers.arrayElement(ROLES),
          authorId: author.userId,
          organizationId: organization.id,
        },
      }),
    ),
  );

  console.log(`Invites created for "${organization.name}":`);
  console.table(
    invites.map((invite) => ({ email: invite.email, role: invite.role })),
  );
}

createInvites()
  .then(() => prisma.$disconnect())
  .then(() => pool.end());
