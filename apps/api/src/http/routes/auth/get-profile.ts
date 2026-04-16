import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { FastifyInstance } from 'fastify/types/instance';
import { prisma } from '@/lib/prisma';
import z from 'zod/v4';
import { BadRequestError } from '../_errors/bad-request-errors';
import { auth } from '@/http/middlewares/auth';

export async function getProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/profile',
      {
        schema: {
          tags: ['auth'],
          summary: 'Get authenticated user profile',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              user: z.object({
                id: z.uuid(),
                name: z.string().nullable(),
                email: z.string(),
                avatarUrl: z.string().nullable(),
              }),
            }),
            400: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const user = await prisma.user.findUnique({
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
          where: {
            id: userId,
          },
        });

        if (!user) {
          throw new BadRequestError('User not found.');
        }

        return reply.send({ user });
      }
    );
}
