import type { GithubOAuth, GithubProfile } from '@/ports/github-oauth';
import type { Mail, Mailer } from '@/ports/mailer';

/* `Account.providerAccountId` e unico globalmente: dois perfis falsos com o
mesmo id violam a constraint e o teste morre com 500 em vez do que afirma */
let nextGithubId = 1;

export function fakeGithub(
  profile: Partial<GithubProfile> & { email: string | null }
): GithubOAuth {
  const id = profile.id ?? nextGithubId++;

  return {
    async fetchProfile() {
      return {
        id,
        avatarUrl: profile.avatarUrl ?? 'https://avatars.example/u/1234',
        name: profile.name ?? 'Usuária do GitHub',
        email: profile.email,
      };
    },
  };
}

export function brokenGithub(): GithubOAuth {
  return {
    async fetchProfile() {
      throw new Error('github unreachable');
    },
  };
}

export function fakeMailer() {
  const sent: Mail[] = [];

  const mailer: Mailer = {
    async send(mail) {
      sent.push(mail);
    },
  };

  return { mailer, sent };
}
