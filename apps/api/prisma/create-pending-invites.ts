import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@saas/env';
import { Pool } from 'pg';

import { PrismaClient } from './generated/client/client';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const DEFAULT_TARGET_EMAIL = 'fdanilosoares@gmail.com';
const AUTHOR_EMAIL = 'john@senna.com';

async function createPendingInvites() {
  const [targetEmailArg] = process.argv.slice(2);

  const targetEmail = (targetEmailArg ?? DEFAULT_TARGET_EMAIL).toLowerCase();

  const author = await prisma.user.findUniqueOrThrow({
    where: { email: AUTHOR_EMAIL },
  });

  const acme = await prisma.organization.findUniqueOrThrow({
    where: { slug: 'acme-inc-admin' },
  });

  const stripe = await prisma.organization.upsert({
    where: { slug: 'stripe-admin' },
    update: {},
    create: {
      name: 'Stripe (Admin)',
      slug: 'stripe-admin',
      avatarUrl: 'https://github.com/stripe.png',
      owner: {
        connect: { id: author.id },
      },
      members: {
        create: {
          userId: author.id,
          role: 'ADMIN',
        },
      },
    },
  });

  const invites = await Promise.all(
    [acme, stripe].map((organization) =>
      prisma.invite.upsert({
        where: {
          email_organizationId: {
            email: targetEmail,
            organizationId: organization.id,
          },
        },
        update: {
          authorId: author.id,
          role: 'MEMBER',
        },
        create: {
          email: targetEmail,
          role: 'MEMBER',
          authorId: author.id,
          organizationId: organization.id,
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
      }),
    ),
  );

  console.log(`Pending invites for "${targetEmail}":`);
  console.table(
    invites.map((invite) => ({
      organization: invite.organization.name,
      role: invite.role,
      author: author.name,
    })),
  );
}

createPendingInvites()
  .then(() => prisma.$disconnect())
  .then(() => pool.end());
