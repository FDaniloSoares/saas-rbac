import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { prisma } from '@/lib/prisma';
import { connect, disconnect } from '@/ws/presence';

import { UnauthorizedError } from '../_errors/unauthorized-error';

const HEARTBEAT_INTERVAL_IN_MS = 30_000;

export async function organizationPresence(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/organizations/:slug/presence',
    {
      websocket: true,
      schema: {
        hide: true,
        params: z.object({ slug: z.string() }),
        querystring: z.object({ token: z.string() }),
      },
      /* preHandler roda DEPOIS da validação e ANTES do upgrade:
      se lançar aqui, o cliente leva 401 e a conexão nem sobe */
      preHandler: async (request) => {
        const { slug } = request.params;
        const { token } = request.query;

        let userId: string;

        try {
          const { sub } = await app.jwt.verify<{ sub: string }>(token);
          userId = sub;
        } catch {
          throw new UnauthorizedError('Invalid auth token');
        }

        const member = await prisma.member.findFirst({
          where: {
            userId,
            organization: { slug },
          },
          select: {
            organizationId: true,
          },
        });

        if (!member) {
          throw new UnauthorizedError(
            'You are not member of this organization'
          );
        }

        request.presence = { userId, organizationId: member.organizationId };
      },
    },
    (socket, request) => {
      /* garantido pelo preHandler */
      const { userId, organizationId } = request.presence!;

      connect(organizationId, userId, socket);

      /* conexão meio-aberta (wifi caiu, notebook fechou) não dispara 'close' */
      let isAlive = true;

      socket.on('pong', () => {
        isAlive = true;
      });

      const heartbeat = setInterval(() => {
        if (!isAlive) {
          return socket.terminate();
        }

        isAlive = false;
        socket.ping();
      }, HEARTBEAT_INTERVAL_IN_MS);

      socket.on('close', () => {
        clearInterval(heartbeat);
        disconnect(organizationId, userId, socket);
      });
    }
  );
}
