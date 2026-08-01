import { api } from './api-client';

interface GetOrganizationsResponse {
  organizations: {
    id: string;
    nome: string | null;
    slug: string;
    avatarUrl: string | null;
  }[];
}

export async function getOrganizations(): Promise<GetOrganizationsResponse> {
  const response = await api
    .get('organizations')
    .json<GetOrganizationsResponse>();

  return response;
}
