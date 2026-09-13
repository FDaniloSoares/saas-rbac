import { describe, expect, it } from 'vitest';

import { buildApp } from '@/http/app';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

describe('buildApp', () => {
  it('não escuta porta ao ser construída', async () => {
    const app = buildApp();

    await app.ready();

    expect(app.server.listening).toBe(false);

    await app.close();
  });

  it('expõe 30 operações HTTP, com a rota de WebSocket fora do documento', async () => {
    const app = buildApp();

    await app.ready();

    const document = app.swagger();

    const operations = Object.values(document.paths ?? {}).flatMap((path) =>
      Object.keys(path ?? {}).filter((key) => HTTP_METHODS.includes(key))
    );

    expect(operations).toHaveLength(30);
    expect(document.paths?.['/organizations/{slug}/ws']).toBeUndefined();

    await app.close();
  });
});
