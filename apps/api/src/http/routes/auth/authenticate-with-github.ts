import { FastifyInstance } from 'fastify/types/instance';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { prisma } from '@/lib/prisma';
import type { GithubOAuth } from '@/ports/github-oauth';
import type { TokenSigner } from '@/ports/token-signer';

import { BadRequestError } from '../_errors/bad-request-errors';

interface Deps {
  github: GithubOAuth;
  tokenSigner: TokenSigner;
}

export function authenticateWithGithub({ github, tokenSigner }: Deps) {
  return async function (app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
      '/sessions/github',
      {
        schema: {
          tags: ['auth'],
          summary: 'Authenticate with GitHub',
          body: z.object({
            code: z.string(),
          }),
          response: {
            201: z.object({
              token: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { code } = request.body;

        const profile = await github.fetchProfile(code);

        if (!profile.email) {
          throw new BadRequestError(
            'Email is required to authenticate with GitHub'
          );
        }

        let user = await prisma.user.findUnique({
          where: {
            email: profile.email,
          },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              avatarUrl: profile.avatarUrl,
            },
          });
        }

        const account = await prisma.account.findUnique({
          where: {
            provider_userId: {
              provider: 'GITHUB',
              userId: user.id,
            },
          },
        });

        if (!account) {
          await prisma.account.create({
            data: {
              provider: 'GITHUB',
              providerAccountId: String(profile.id),
              userId: user.id,
            },
          });
        }

        const token = await tokenSigner.sign({ sub: user.id });

        return reply.status(201).send({ token });
      }
    );
  };
}
