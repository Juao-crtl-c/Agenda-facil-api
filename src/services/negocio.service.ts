import { Prisma } from "@prisma/client";
import { AppError } from "../lib/AppError";
import { negocioRepository } from "../repositories/negocio.repository";
import { AtualizarNegocioBody, CriarNegocioBody, SubstituirHorariosBody } from "../schemas/negocio.schemas";

export const negocioService = {
  async criarParaUsuario(usuarioId: string, dados: CriarNegocioBody) {
    const existente = await negocioRepository.buscarPorDono(usuarioId);
    if (existente) {
      throw AppError.conflito("Você já tem um negócio cadastrado — use PUT /api/negocios/me para editar.");
    }

    try {
      return await negocioRepository.criar({ ...dados, donoId: usuarioId });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw AppError.conflito(`O identificador "${dados.slug}" já está em uso. Escolha outro.`);
      }
      throw error;
    }
  },

  async buscarMeuNegocio(usuarioId: string) {
    const negocio = await negocioRepository.buscarPorDono(usuarioId);
    if (!negocio) {
      throw AppError.naoEncontrado("Negócio (crie um em POST /api/negocios/me)");
    }
    return negocio;
  },

  async atualizarMeuNegocio(usuarioId: string, dados: AtualizarNegocioBody) {
    const negocio = await this.buscarMeuNegocio(usuarioId);
    return negocioRepository.atualizar(negocio.id, dados);
  },

  async substituirHorarios(usuarioId: string, dados: SubstituirHorariosBody) {
    const negocio = await this.buscarMeuNegocio(usuarioId);
    const dias = dados.horarios.map((h) => h.diaSemana);
    if (new Set(dias).size !== dias.length) {
      throw new AppError("Não pode repetir o mesmo dia da semana mais de uma vez.", 422, "DIA_DUPLICADO");
    }
    await negocioRepository.substituirHorarios(negocio.id, dados.horarios);
    return negocioRepository.buscarPorDono(usuarioId);
  },

  async buscarPublico(slug: string) {
    const negocio = await negocioRepository.buscarPorSlug(slug);
    if (!negocio) {
      throw AppError.naoEncontrado("Negócio");
    }

    return {
      nome: negocio.nome,
      slug: negocio.slug,
      timezone: negocio.timezone,
      servicos: negocio.servicos.map((s) => ({
        id: s.id,
        nome: s.nome,
        duracaoMinutos: s.duracaoMinutos,
        preco: s.preco,
      })),
      horariosFuncionamento: negocio.horariosFuncionamento.map((h) => ({
        diaSemana: h.diaSemana,
        horaAbertura: h.horaAbertura,
        horaFechamento: h.horaFechamento,
      })),
    };
  },
};
