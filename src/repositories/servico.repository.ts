import { prisma } from "../lib/prisma";

export const servicoRepository = {
  criar(dados: { negocioId: string; nome: string; duracaoMinutos: number; preco: string }) {
    return prisma.servico.create({ data: dados });
  },

  listarPorNegocio(negocioId: string) {
    return prisma.servico.findMany({ where: { negocioId }, orderBy: { nome: "asc" } });
  },

  buscarPorId(id: string) {
    return prisma.servico.findUnique({ where: { id } });
  },

  atualizar(id: string, dados: { nome?: string; duracaoMinutos?: number; preco?: string }) {
    return prisma.servico.update({ where: { id }, data: dados });
  },

  remover(id: string) {
    return prisma.servico.delete({ where: { id } });
  },
};
