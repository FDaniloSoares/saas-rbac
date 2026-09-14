import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/http/middlewares/auth';
import { prisma } from '@/lib/prisma';
import { getUserPermissions } from '@/utils/get-user-permissions';
import { disconnectUser } from '@/ws/presence';

import { UnauthorizedError } from '../_errors/unauthorized-error';

export async function removeMember(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/members/:memberId',
      {
        schema: {
          tags: ['members'],
          summary: 'Remove a member',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            memberId: z.uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, memberId } = request.params;
        const userId = await request.getCurrentUserId();

        const { organization, membership } =
          await request.getUserMembership(slug);

        const { cannot } = getUserPermissions(userId, membership.role);

        if (cannot('delete', 'User')) {
          throw new UnauthorizedError(
            'You are not allowed to remove this member from the organization'
          );
        }

        /* o delete devolve o registro apagado, e é dele que sai o userId
        necessário para alcançar os sockets de quem acabou de perder acesso */
        const removed = await prisma.member.delete({
          where: {
            id: memberId,
            organizationId: organization.id,
          },
        });

        disconnectUser(organization.id, removed.userId);

        return reply.status(204).send();
      }
    );
}
