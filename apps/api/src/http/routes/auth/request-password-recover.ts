import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { FastifyInstance } from 'fastify/types/instance';
import { prisma } from '@/lib/prisma';
import z from 'zod/v4';

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/recover',
    {
      schema: {
        tags: ['auth'],
        summary: 'Request password recovery',
        security: [{ bearerAuth: [] }],
        body: z.object({
          email: z.email(),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body;

      const userFromEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!userFromEmail) {
        // We don't want to reveal that the email does not exist in our system,
        // so we return 201 even if the user is not found.
        return reply.status(201).send();
      }

      const { id: code } = await prisma.token.create({
        data: {
          userId: userFromEmail.id,
          type: 'PASSWORD_RECOVER',
        },
      });

      // Send email with the code to the user to recover the password
      console.log(`Password recovery: ${code}`);
      return reply.status(201).send();
    }
  );
}
