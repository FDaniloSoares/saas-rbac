import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/http/middlewares/auth';
import { prisma } from '@/lib/prisma';
import { getConversationId } from '@/utils/get-conversation-id';
import { listMessages, serializeMessage } from '@/ws/message-store';
import { messageSchema } from '@/ws/protocol';

import { BadRequestError } from '../_errors/bad-request-errors';

export async function getConversationMessages(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/conversations/:withUserId/messages',
      {
        schema: {
          tags: ['chat'],
          summary: 'Get the message history of a one-to-one conversation',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            withUserId: z.uuid(),
          }),
          querystring: z.object({
            /* cursor: id da mensagem mais antiga já carregada */
            before: z.uuid().optional(),
            limit: z.coerce.number().int().min(1).max(100).default(50),
          }),
          response: {
            200: z.object({
              messages: z.array(messageSchema),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug, withUserId } = request.params;
        const { before, limit } = request.query;

        const userId = await request.getCurrentUserId();

        /* lança 401 se o usuário não for membro desta organização */
        const { organization } = await request.getUserMembership(slug);

        if (withUserId === userId) {
          throw new BadRequestError(
            'You cannot open a conversation with yourself'
          );
        }

        /* o outro lado precisa ser membro da mesma organização */
        const member = await prisma.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: withUserId,
            },
          },
          select: { userId: true },
        });

        if (!member) {
          throw new BadRequestError(
            'This user is not a member of this organization'
          );
        }

        const messages = await listMessages(
          getConversationId(organization.id, userId, withUserId),
          { before, limit }
        );

        return reply.status(200).send({
          messages: messages.map(serializeMessage),
        });
      }
    );
}
