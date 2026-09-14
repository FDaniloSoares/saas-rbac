import type { FastifyInstance } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

import { getMembership } from '@/services/membership';

import { UnauthorizedError } from '../routes/_errors/unauthorized-error';

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    let currentUserId: string | null = null;

    request.getCurrentUserId = async () => {
      if (currentUserId) {
        return currentUserId;
      }

      try {
        const { sub } = await request.jwtVerify<{ sub: string }>();
        currentUserId = sub;
        return sub;
      } catch {
        throw new UnauthorizedError('Invalid auth token');
      }
    };

    /* a regra vive em services/membership; isto é só a ponte para o request */
    request.getUserMembership = async (slug: string) => {
      const userId = await request.getCurrentUserId();

      return getMembership({ userId, slug });
    };
  });
});
