// types/nodemailer.d.ts
declare module "nodemailer" {
  export interface TransportOptions {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
      user: string;
      pass: string;
    };
    debug?: boolean;
    logger?: boolean;
  }

  export interface MailOptions {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }

  export interface SendMailResult {
    messageId: string;
    envelope: {
      from: string;
      to: string[];
    };
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
  }

  export interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<SendMailResult>;
    verify(): Promise<boolean>;
  }

  export function createTransport(options: TransportOptions): Transporter;
}
