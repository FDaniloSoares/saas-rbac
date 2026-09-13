import 'dotenv/config';

import { env } from '@saas/env';

import { buildApp } from './app';

const app = buildApp();

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log(`Http server running in port ${env.SERVER_PORT}!`);
});
