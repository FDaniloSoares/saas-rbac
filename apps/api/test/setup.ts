import { afterAll, beforeAll } from 'vitest';

import { pool, prisma } from '@/lib/prisma';

/* ordem não importa: CASCADE resolve as FKs, e RESTART IDENTITY zera
sequências para que ids não vazem de uma execução para a seguinte */
const TABLES = [
  'tokens',
  'accounts',
  'invites',
  'members',
  'projects',
  'organizations',
  'users',
];

beforeAll(async () => {
  await pool.query(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`
  );
});

/* sem isto o pool do pg mantém o processo vivo e o runner nunca encerra */
afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
});
