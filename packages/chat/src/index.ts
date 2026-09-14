import { z } from 'zod';

export const messageSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  senderId: z.uuid(),
  recipientId: z.uuid(),
  createdAt: z.iso.datetime(),
  readAt: z.iso.datetime().nullable(),
});

export type ChatMessage = z.infer<typeof messageSchema>;

/* cliente → servidor: validado em runtime, é o que vem da rede */
export const clientEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message:send'),
    toUserId: z.uuid(),
    content: z.string().trim().min(1).max(4000),
    clientId: z.uuid(),
  }),
  z.object({
    type: z.literal('message:read'),
    withUserId: z.uuid(),
  }),
]);

export type ClientEvent = z.infer<typeof clientEventSchema>;

/* servidor → cliente: só tipo, não se valida a própria saída */
export type ServerEvent =
  | { type: 'presence:sync'; userIds: string[] }
  | { type: 'presence:online'; userId: string }
  | { type: 'presence:offline'; userId: string }
  | { type: 'message:new'; message: ChatMessage }
  | { type: 'message:ack'; clientId: string; message: ChatMessage }
  | { type: 'message:read'; withUserId: string; readAt: string }
  | { type: 'error'; code: string; message: string };

/* contrato de fechamento: o servidor fecha com este código quando o
pertencimento acaba, e o cliente para de reconectar ao vê-lo. faixa 4000-4999,
uso privado pela RFC 6455 — um handshake recusado chegaria como 1006, que o
navegador não distingue de queda de rede */
export const REVOKED_CLOSE_CODE = 4003;
export const REVOKED_CLOSE_REASON = 'membership-revoked';
