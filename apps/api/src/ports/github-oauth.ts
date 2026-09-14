export interface GithubProfile {
  id: number;
  avatarUrl: string;
  name: string | null;
  /* o GitHub devolve null quando o usuário esconde o e-mail */
  email: string | null;
}

export interface GithubOAuth {
  fetchProfile(code: string): Promise<GithubProfile>;
}
