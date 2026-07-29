import { api } from './api-client';

interface SignInWithGithubRequest {
  code: string;
}

interface SignInWithGithubResponse {
  token: string;
}

export async function signInWithGithub({
  code,
}: SignInWithGithubRequest): Promise<SignInWithGithubResponse> {
  const response = await api
    .post('sessions/password', {
      json: {
        code,
      },
    })
    .json<SignInWithGithubResponse>();

  return response;
}
