import { env } from '@saas/env';
import z from 'zod';

import type { GithubOAuth, GithubProfile } from '@/ports/github-oauth';

const accessTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('bearer'),
  scope: z.string(),
});

const userSchema = z.object({
  id: z.number(),
  avatar_url: z.string(),
  name: z.string().nullable(),
  email: z.email().nullable(),
});

export const githubOAuthHttp: GithubOAuth = {
  async fetchProfile(code: string): Promise<GithubProfile> {
    const url = new URL('https://github.com/login/oauth/access_token');

    url.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID);
    url.searchParams.set('client_secret', env.GITHUB_OAUTH_CLIENT_SECRET);
    url.searchParams.set(
      'redirect_uri',
      env.GITHUB_OAUTH_CLIENT_REDIRECT_URI
    );
    url.searchParams.set('code', code);

    const accessTokenResponse = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    const { access_token: accessToken } = accessTokenSchema.parse(
      await accessTokenResponse.json()
    );

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const user = userSchema.parse(await userResponse.json());

    return {
      id: user.id,
      avatarUrl: user.avatar_url,
      name: user.name,
      email: user.email,
    };
  },
};
