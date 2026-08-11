import { StatusAgendamento } from "@prisma/client";
import { prisma } from "../lib/prisma";

// Nome da exclusion constraint criada na migration
// `add_agendamentos_sem_sobreposicao` — é o que realmente impede
// double-booking sob concorrência (ver services/agendamento.service.ts).
// Prisma não tem um "código" próprio pra esse tipo de erro de banco (só
// mapeia um conjunto fixo de erros conhecidos, e EXCLUDE não é um deles),
// então a checagem mais confiável é procurar o nome da constraint na
// mensagem de erro que o Postgres devolve — funciona independente de qual
// classe de erro o Prisma usa pra embrulhar.
const NOME_CONSTRAINT_SOBREPOSICAO = "agendamentos_sem_sobreposicao";

export const agendamentoRepository = {
  listarConfirmadosNoIntervalo(negocioId: string, inicio: Date, fim: Date) {
    return prisma.agendamento.findMany({
      where: {
        negocioId,
        status: StatusAgendamento.CONFIRMADO,
        dataHoraInicio: { lt: fim },
        dataHoraFim: { gt: inicio },
      },
      select: { dataHoraInicio: true, dataHoraFim: true },
    });
  },

  criar(dados: {
    negocioId: string;
    servicoId: string;
    clienteNome: string;
    clienteTelefone: string;
    clienteEmail: string;
    dataHoraInicio: Date;
    dataHoraFim: Date;
  }) {
    return prisma.agendamento.create({ data: dados });
  },

  buscarPorToken(token: string) {
    return prisma.agendamento.findUnique({
      where: { tokenCancelamento: token },
      // slug é necessário pro frontend montar a URL de
      // GET /negocios/:slug/disponibilidade na tela de remarcação.
      include: { servico: true, negocio: { select: { nome: true, slug: true, timezone: true } } },
    });
  },

  atualizarStatus(id: string, status: StatusAgendamento) {
    return prisma.agendamento.update({ where: { id }, data: { status } });
  },

  atualizarHorario(id: string, dataHoraInicio: Date, dataHoraFim: Date) {
    return prisma.agendamento.update({ where: { id }, data: { dataHoraInicio, dataHoraFim } });
  },

  listarPorNegocio(negocioId: string, de?: Date, ate?: Date) {
    return prisma.agendamento.findMany({
      where: {
        negocioId,
        ...(de || ate
          ? {
              dataHoraInicio: {
                ...(de ? { gte: de } : {}),
                ...(ate ? { lte: ate } : {}),
              },
            }
          : {}),
      },
      include: { servico: true },
      orderBy: { dataHoraInicio: "asc" },
    });
  },

  // Agendamentos confirmados cujo início cai dentro da janela informada e
  // que ainda não tiveram lembrete enviado — usado pelo job diário de e-mail.
  listarParaLembrete(janelaInicio: Date, janelaFim: Date) {
    return prisma.agendamento.findMany({
      where: {
        status: StatusAgendamento.CONFIRMADO,
        lembreteEnviado: false,
        dataHoraInicio: { gte: janelaInicio, lte: janelaFim },
      },
      include: { servico: true, negocio: { select: { nome: true, timezone: true } } },
    });
  },

  marcarLembreteEnviado(id: string) {
    return prisma.agendamento.update({ where: { id }, data: { lembreteEnviado: true } });
  },

  isViolacaoSobreposicao(error: unknown): boolean {
    const mensagem = error instanceof Error ? error.message : String(error);
    return mensagem.includes(NOME_CONSTRAINT_SOBREPOSICAO);
  },
};
