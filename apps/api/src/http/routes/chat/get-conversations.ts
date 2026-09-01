import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/http/middlewares/auth';
import { listConversationSummaries } from '@/ws/message-store';
import { messageSchema } from '@/ws/protocol';

export async function getConversations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/conversations',
      {
        schema: {
          tags: ['chat'],
          summary: 'List conversations of the current user in an organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              conversations: z.array(
                z.object({
                  withUserId: z.uuid(),
                  lastMessage: messageSchema,
                  unreadCount: z.number().int(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;

        const userId = await request.getCurrentUserId();

        /* lança 401 se o usuário não for membro desta organização */
        const { organization } = await request.getUserMembership(slug);

        const conversations = await listConversationSummaries(
          organization.id,
          userId
        );

        return reply.status(200).send({ conversations });
      }
    );
}
