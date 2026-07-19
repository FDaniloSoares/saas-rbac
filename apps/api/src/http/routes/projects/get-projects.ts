import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/http/middlewares/auth';
import { prisma } from '@/lib/prisma';
import { getUserPermissions } from '@/utils/get-user-permissions';

import { UnauthorizedError } from '../_errors/unauthorized-error';

export async function getProjects(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:slug/projects',
      {
        schema: {
          tags: ['projects'],
          summary: 'Get project list of a organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              projects: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  description: z.string().nullable(),
                  slug: z.string(),
                  ownerId: z.uuid(),
                  avatarUrl: z.string().nullable(),
                  organizationId: z.uuid(),
                  createdAt: z.date(),
                  owner: z.object({
                    id: z.uuid(),
                    name: z.string().nullable(),
                    avatarUrl: z.string().nullable(),
                  }),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;

        const userId = await request.getCurrentUserId();
        const { organization, membership } =
          await request.getUserMembership(slug);

        const { cannot } = getUserPermissions(userId, membership.role);

        if (cannot('get', 'Project')) {
          throw new UnauthorizedError(
            'You are not allowed to see these projects'
          );
        }

        const projects = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            slug: true,
            ownerId: true,
            avatarUrl: true,
            organizationId: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            organizationId: organization.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return reply.status(200).send({
          projects,
        });
      }
    );
}
