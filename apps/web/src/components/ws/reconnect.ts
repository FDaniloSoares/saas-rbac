import { REVOKED_CLOSE_CODE } from '@saas/chat';

/* o caso offline: o membro é removido sem socket aberto, então não há frame de
fechamento para ler e o 401 do handshake seguinte chega como 1006. sem teto, o
navegador bateria na API a cada 30s para sempre */
export const MAX_RECONNECT_ATTEMPTS = 8;

export function shouldReconnect(closeCode: number, attempt: number) {
  if (closeCode === REVOKED_CLOSE_CODE) {
    return false;
  }

  return attempt < MAX_RECONNECT_ATTEMPTS;
}
