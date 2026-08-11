import { prisma } from "../lib/prisma";

export const bloqueioRepository = {
  listarNoIntervalo(negocioId: string, inicio: Date, fim: Date) {
    return prisma.bloqueio.findMany({
      where: { negocioId, dataHoraInicio: { lt: fim }, dataHoraFim: { gt: inicio } },
      select: { dataHoraInicio: true, dataHoraFim: true },
    });
  },

  criar(dados: { negocioId: string; dataHoraInicio: Date; dataHoraFim: Date; motivo?: string }) {
    return prisma.bloqueio.create({ data: dados });
  },

  listarPorNegocio(negocioId: string) {
    return prisma.bloqueio.findMany({ where: { negocioId }, orderBy: { dataHoraInicio: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.bloqueio.findUnique({ where: { id } });
  },

  remover(id: string) {
    return prisma.bloqueio.delete({ where: { id } });
  },
};
