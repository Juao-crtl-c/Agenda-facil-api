import { prisma } from "../lib/prisma";

export const usuarioRepository = {
  criar(dados: { nome: string; email: string; senhaHash: string }) {
    return prisma.usuario.create({ data: dados });
  },

  buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  },

  buscarPorId(id: string) {
    return prisma.usuario.findUnique({ where: { id } });
  },
};
