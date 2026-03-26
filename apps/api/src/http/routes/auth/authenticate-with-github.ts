import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { FastifyInstance } from 'fastify/types/instance';
import z from 'zod';
import { BadRequestError } from '../_errors/bad-request-errors';
import { prisma } from '@/lib/prisma';
import { env } from '@saas/env';

export async function authenticateWithGithub(app: FastifyInstance) {
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
          })
        },
      },
    },
    async (request, reply) => {
      const { code } = request.body;

      const githubOAuthUrl = new URL('https://github.com/login/oauth/access_token');
      
      githubOAuthUrl.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID);
      githubOAuthUrl.searchParams.set('client_secret', env.GITHUB_OAUTH_CLIENT_SECRET);
      githubOAuthUrl.searchParams.set('redirect_uri', env.GITHUB_OAUTH_CLIENT_REDIRECT_URI);
      githubOAuthUrl.searchParams.set('code', code);

      const gitHubAcessTokenResponse = await fetch(githubOAuthUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      const gitToken = await gitHubAcessTokenResponse.json();

      const { access_token: githubAccessToken } = z.object({
        access_token: z.string(),
        token_type: z.literal('bearer'),
        scope: z.string(),
      }).parse(gitToken);  
      
      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
        },
      });

      const githubUserData = await githubUserResponse.json();

      const { id: githubId, avatar_url: githubAvatarUrl, name, email } = z.object({
        id: z.number(),
        avatar_url: z.string(),
        name: z.string().nullable(),
        email: z.email().nullable(),
      }).parse(githubUserData);

      if (!email) {
        throw new BadRequestError('Email is required to authenticate with GitHub')
      }

      let user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl: githubAvatarUrl,
          },
        });
      }

      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      });

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GITHUB',
            providerAccountId: String(githubId),
            userId: user.id,
          },
        });
      }

      const token = await reply.jwtSign(
        { sub: user.id },
        {
          sign: {
            expiresIn: '7d',
          },
        }
      );

      return reply.status(201).send({ token });
    }
  );
}