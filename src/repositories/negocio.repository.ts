import { prisma } from "../lib/prisma";

export const negocioRepository = {
  criar(dados: { nome: string; slug: string; donoId: string; timezone?: string }) {
    return prisma.negocio.create({ data: dados });
  },

  buscarPorDono(donoId: string) {
    return prisma.negocio.findFirst({
      where: { donoId },
      include: { servicos: true, horariosFuncionamento: true },
    });
  },

  buscarPorSlug(slug: string) {
    return prisma.negocio.findUnique({
      where: { slug },
      include: {
        servicos: true,
        horariosFuncionamento: { orderBy: { diaSemana: "asc" } },
      },
    });
  },

  buscarPorId(id: string) {
    return prisma.negocio.findUnique({ where: { id } });
  },

  atualizar(id: string, dados: { nome?: string; timezone?: string }) {
    return prisma.negocio.update({ where: { id }, data: dados });
  },

  // Substitui a lista inteira de horários de funcionamento do negócio —
  // mais simples e menos propenso a erro do que PATCH incremental numa tela
  // de configuração onde o dono redefine a semana toda de uma vez.
  substituirHorarios(
    negocioId: string,
    horarios: { diaSemana: number; horaAbertura: string; horaFechamento: string }[]
  ) {
    return prisma.$transaction([
      prisma.horarioFuncionamento.deleteMany({ where: { negocioId } }),
      prisma.horarioFuncionamento.createMany({
        data: horarios.map((h) => ({ ...h, negocioId })),
      }),
    ]);
  },
};
