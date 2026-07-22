import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/http/middlewares/auth';
import { prisma } from '@/lib/prisma';

export async function getOrganizations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations',
      {
        schema: {
          tags: ['organization'],
          summary: 'Get organization where user is a member',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              organizations: z.array(
                z.object({
                  id: z.uuid(),
                  nome: z.string(),
                  slug: z.string(),
                  avatarUrl: z.url().nullable(),
                  role: z.enum(['ADMIN', 'MEMBER', 'BILLING']),
                })
              ),
            }),
          },
        },
      },
      async (request) => {
        const userId = await request.getCurrentUserId();

        const organizations = await prisma.organization.findMany({
          select: {
            id: true,
            nome: true,
            slug: true,
            avatarUrl: true,
            members: {
              select: {
                role: true,
              },
              where: {
                userId,
              },
            },
          },
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
        });

        const organizationWithUserRole = organizations.map(
          ({ members, ...org }) => {
            return {
              ...org,
              role: members[0].role,
            };
          }
        );

        return {
          organizations: organizationWithUserRole,
        };
      }
    );
}
