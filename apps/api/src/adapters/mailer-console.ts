import type { Mail, Mailer } from '@/ports/mailer';

/* adaptador de desenvolvimento. o provedor real (Resend, SES) entra no deploy
e só precisa implementar `send` — nada fora deste arquivo muda */
export const mailerConsole: Mailer = {
  async send(mail: Mail) {
    console.log(`[mail] para ${mail.to} | ${mail.subject}\n${mail.body}`);
  },
};
