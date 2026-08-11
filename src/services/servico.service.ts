import { AppError } from "../lib/AppError";
import { servicoRepository } from "../repositories/servico.repository";
import { AtualizarServicoBody, CriarServicoBody } from "../schemas/servico.schemas";
import { negocioService } from "./negocio.service";

export const servicoService = {
  async criar(usuarioId: string, dados: CriarServicoBody) {
    const negocio = await negocioService.buscarMeuNegocio(usuarioId);
    return servicoRepository.criar({ ...dados, negocioId: negocio.id, preco: dados.preco.toFixed(2) });
  },

  async listarMeus(usuarioId: string) {
    const negocio = await negocioService.buscarMeuNegocio(usuarioId);
    return servicoRepository.listarPorNegocio(negocio.id);
  },

  async atualizar(usuarioId: string, servicoId: string, dados: AtualizarServicoBody) {
    const servico = await buscarComDono(usuarioId, servicoId);
    return servicoRepository.atualizar(servico.id, {
      ...dados,
      preco: dados.preco !== undefined ? dados.preco.toFixed(2) : undefined,
    });
  },

  async remover(usuarioId: string, servicoId: string) {
    await buscarComDono(usuarioId, servicoId);
    await servicoRepository.remover(servicoId);
  },
};

// Garante que o serviço existe E pertence ao negócio do usuário autenticado
// — sem isso, qualquer dono logado poderia editar serviço de outro negócio
// só sabendo o id (IDOR).
async function buscarComDono(usuarioId: string, servicoId: string) {
  const negocio = await negocioService.buscarMeuNegocio(usuarioId);
  const servico = await servicoRepository.buscarPorId(servicoId);
  if (!servico || servico.negocioId !== negocio.id) {
    throw AppError.naoEncontrado("Serviço");
  }
  return servico;
}
