export interface Mail {
  to: string;
  subject: string;
  body: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}
