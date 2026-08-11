import { AppError } from "../lib/AppError";
import { agendamentoRepository } from "../repositories/agendamento.repository";
import { bloqueioRepository } from "../repositories/bloqueio.repository";
import { CriarBloqueioBody } from "../schemas/bloqueio.schemas";
import { negocioService } from "./negocio.service";

export const bloqueioService = {
  async criar(usuarioId: string, dados: CriarBloqueioBody) {
    const negocio = await negocioService.buscarMeuNegocio(usuarioId);
    const inicio = new Date(dados.dataHoraInicio);
    const fim = new Date(dados.dataHoraFim);

    // Não deixa bloquear em cima de agendamento confirmado sem avisar — o
    // dono precisa decidir manualmente o que fazer com o cliente já marcado.
    const conflitos = await agendamentoRepository.listarConfirmadosNoIntervalo(negocio.id, inicio, fim);
    if (conflitos.length > 0) {
      throw AppError.conflito(
        `Esse período tem ${conflitos.length} agendamento(s) confirmado(s). Cancele-os antes de bloquear, ou escolha outro período.`,
        { agendamentosConflitantes: conflitos }
      );
    }

    return bloqueioRepository.criar({ negocioId: negocio.id, dataHoraInicio: inicio, dataHoraFim: fim, motivo: dados.motivo });
  },

  async listarMeus(usuarioId: string) {
    const negocio = await negocioService.buscarMeuNegocio(usuarioId);
    return bloqueioRepository.listarPorNegocio(negocio.id);
  },

  async remover(usuarioId: string, bloqueioId: string) {
    const negocio = await negocioService.buscarMeuNegocio(usuarioId);
    const bloqueio = await bloqueioRepository.buscarPorId(bloqueioId);
    if (!bloqueio || bloqueio.negocioId !== negocio.id) {
      throw AppError.naoEncontrado("Bloqueio");
    }
    await bloqueioRepository.remover(bloqueioId);
  },
};
