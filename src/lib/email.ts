import { env } from "./env";

export type EmailService = {
  enviar(params: { destinatario: string; assunto: string; corpoHtml: string }): Promise<void>;
};

// Sem RESEND_API_KEY configurada (padrão em dev), só loga no console — dá
// pra testar o fluxo de lembretes sem precisar de conta em provedor
// nenhum. Com a chave configurada, chama a API REST da Resend direto via
// fetch (Node 20+ já tem fetch nativo, sem precisar da SDK deles como
// dependência extra).
const consoleEmailService: EmailService = {
  async enviar({ destinatario, assunto, corpoHtml }) {
    console.log(`[email:dev] Para: ${destinatario} | Assunto: ${assunto}\n${corpoHtml}`);
  },
};

const resendEmailService: EmailService = {
  async enviar({ destinatario, assunto, corpoHtml }) {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Agenda Fácil <agendamentos@agendafacil.app>",
        to: destinatario,
        subject: assunto,
        html: corpoHtml,
      }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      throw new Error(`Falha ao enviar e-mail via Resend (${resposta.status}): ${corpo}`);
    }
  },
};

export const emailService: EmailService = env.RESEND_API_KEY ? resendEmailService : consoleEmailService;
