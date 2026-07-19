import type { FastifyInstance } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

import { prisma } from '@/lib/prisma';

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

    request.getUserMembership = async (slug: string) => {
      const userId = await request.getCurrentUserId();

      const member = await prisma.member.findFirst({
        where: {
          userId,
          organization: {
            slug,
          },
        },
        include: {
          organization: true,
        },
      });

      if (!member) {
        throw new UnauthorizedError('You are not the father!!!');
      }

      const { organization, ...membership } = member;

      return {
        organization,
        membership,
      };
    };
  });
});
