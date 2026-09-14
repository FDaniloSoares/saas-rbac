import { FastifyInstance } from 'fastify/types/instance';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod/v4';

import { prisma } from '@/lib/prisma';
import type { Mailer } from '@/ports/mailer';

interface Deps {
  mailer: Mailer;
}

export function requestPasswordRecover({ mailer }: Deps) {
  return async function (app: FastifyInstance) {
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
          /* não revela que o e-mail não existe: mesma resposta, e o mailer
          não é chamado — quem observasse o tempo de resposta veria o mesmo */
          return reply.status(201).send();
        }

        const { id: code } = await prisma.token.create({
          data: {
            userId: userFromEmail.id,
            type: 'PASSWORD_RECOVER',
          },
        });

        await mailer.send({
          to: email,
          subject: 'Recuperação de senha',
          body: `Use este código para recuperar sua senha: ${code}`,
        });

        return reply.status(201).send();
      }
    );
  };
}
