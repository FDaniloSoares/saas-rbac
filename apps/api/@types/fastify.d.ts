import 'fastify';

import { Member, Organization } from '../prisma/generated/client';

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>;
    getUserMembership(
      slug: string
    ): Promise<{ organization: Organization; membership: Member }>;
    presence?: { userId: string; organizationId: string };
  }
}
