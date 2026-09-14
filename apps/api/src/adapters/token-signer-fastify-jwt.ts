import type { FastifyInstance } from 'fastify';

import type { TokenSigner } from '@/ports/token-signer';

const EXPIRES_IN = '7d';

/* fecha sobre a instância, não sobre um `reply`: `app.jwt` só existe depois do
`register`, e o `sign` aqui só roda no momento da request, quando já existe */
export function tokenSignerFastifyJwt(app: FastifyInstance): TokenSigner {
  return {
    async sign(payload: { sub: string }) {
      return app.jwt.sign(payload, { expiresIn: EXPIRES_IN });
    },
  };
}
