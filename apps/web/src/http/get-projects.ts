import { api } from './api-client';

interface GetProjectsResponse {
  projects: {
    description: string | null;
    slug: string;
    id: string;
    name: string;
    avatarUrl: string | null;
    organizationId: string;
    ownerId: string;
    createdAt: string;
    owner: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }[];
}

export async function getProjects(org: string): Promise<GetProjectsResponse> {
  // Delay proposital
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const response = await api
    .get(`organizations/${org}/projects`)
    .json<GetProjectsResponse>();

  return response;
}
