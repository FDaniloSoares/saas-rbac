import { describe, expect, it } from 'vitest';

import {
  MAX_RECONNECT_ATTEMPTS,
  shouldReconnect,
} from '@/components/ws/reconnect';

const NETWORK_DROP = 1006;

describe('decisao de reconexao', () => {
  it('4003 nao reconecta', () => {
    expect(shouldReconnect(4003, 0)).toBe(false);
  });

  it('4003 nao reconecta nem na primeira tentativa de todas', () => {
    for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt += 1) {
      expect(shouldReconnect(4003, attempt)).toBe(false);
    }
  });

  it('desiste apos 8 tentativas', () => {
    for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt += 1) {
      expect(shouldReconnect(NETWORK_DROP, attempt)).toBe(true);
    }

    expect(shouldReconnect(NETWORK_DROP, MAX_RECONNECT_ATTEMPTS)).toBe(false);
    expect(shouldReconnect(NETWORK_DROP, MAX_RECONNECT_ATTEMPTS + 1)).toBe(
      false
    );
  });

  it('fechamento limpo tambem respeita o teto', () => {
    expect(shouldReconnect(1000, 0)).toBe(true);
    expect(shouldReconnect(1000, MAX_RECONNECT_ATTEMPTS)).toBe(false);
  });
});
