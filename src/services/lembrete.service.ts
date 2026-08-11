import { addHours } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { emailService } from "../lib/email";
import { agendamentoRepository } from "../repositories/agendamento.repository";

export const lembreteService = {
  // Roda 1x/dia (ver rota protegida em routes/internal.routes.ts). Janela
  // de 2h ao redor de "daqui 24h" pra não perder agendamentos por causa de
  // pequena variação no horário exato em que o job é disparado.
  async processar(agora: Date = new Date()) {
    const janelaInicio = addHours(agora, 23);
    const janelaFim = addHours(agora, 25);

    const agendamentos = await agendamentoRepository.listarParaLembrete(janelaInicio, janelaFim);

    let enviados = 0;
    const falhas: { agendamentoId: string; erro: string }[] = [];

    for (const agendamento of agendamentos) {
      try {
        const dataFormatada = formatInTimeZone(
          agendamento.dataHoraInicio,
          agendamento.negocio.timezone,
          "dd/MM/yyyy 'às' HH:mm"
        );

        await emailService.enviar({
          destinatario: agendamento.clienteEmail,
          assunto: `Lembrete: seu horário em ${agendamento.negocio.nome} é amanhã`,
          corpoHtml: `
            <p>Olá, ${agendamento.clienteNome}!</p>
            <p>Passando pra lembrar do seu horário em <strong>${agendamento.negocio.nome}</strong>:</p>
            <p><strong>${agendamento.servico.nome}</strong> — ${dataFormatada}</p>
            <p>Precisa cancelar ou remarcar? Use o link que você recebeu na confirmação.</p>
          `,
        });

        await agendamentoRepository.marcarLembreteEnviado(agendamento.id);
        enviados++;
      } catch (error) {
        falhas.push({ agendamentoId: agendamento.id, erro: error instanceof Error ? error.message : String(error) });
      }
    }

    return { total: agendamentos.length, enviados, falhas };
  },
};
