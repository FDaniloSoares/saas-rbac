import { api } from './api-client';

interface GetProfileResponse {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export async function getProfile(): Promise<GetProfileResponse> {
  const response = await api.get('profile').json<GetProfileResponse>();

  return response;
}
