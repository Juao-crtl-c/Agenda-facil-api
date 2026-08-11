import { addMinutes, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { AppError } from "../lib/AppError";
import { agendamentoRepository } from "../repositories/agendamento.repository";
import { negocioRepository } from "../repositories/negocio.repository";
import { servicoRepository } from "../repositories/servico.repository";
import { CriarAgendamentoBody, RemarcarAgendamentoBody } from "../schemas/agendamento.schemas";
import { disponibilidadeService } from "./disponibilidade.service";

async function carregarNegocioEServico(slug: string, servicoId: string) {
  const negocio = await negocioRepository.buscarPorSlug(slug);
  if (!negocio) throw AppError.naoEncontrado("Negócio");

  const servico = await servicoRepository.buscarPorId(servicoId);
  if (!servico || servico.negocioId !== negocio.id) {
    throw AppError.naoEncontrado("Serviço");
  }

  return { negocio, servico };
}

// Confia na mesma lógica de GET /disponibilidade pra validar o slot pedido:
// recalcula os slots livres do dia (no fuso do negócio) e confere se o
// horário pedido é exatamente um deles. Evita duplicar a checagem de
// horário de funcionamento + colisão em dois lugares.
async function validarSlotAindaLivre(slug: string, servicoId: string, dataHoraInicio: Date) {
  const negocio = await negocioRepository.buscarPorSlug(slug);
  if (!negocio) throw AppError.naoEncontrado("Negócio");

  const dataLocal = format(toZonedTime(dataHoraInicio, negocio.timezone), "yyyy-MM-dd");
  const slots = await disponibilidadeService.buscar(slug, servicoId, dataLocal);

  const disponivel = slots.some((s) => s.inicio.getTime() === dataHoraInicio.getTime());
  if (!disponivel) {
    throw AppError.conflito("Esse horário não está mais disponível. Escolha outro.");
  }
}

export const agendamentoService = {
  async criar(slug: string, dados: CriarAgendamentoBody) {
    const { negocio, servico } = await carregarNegocioEServico(slug, dados.servicoId);
    const inicio = new Date(dados.dataHoraInicio);
    const fim = addMinutes(inicio, servico.duracaoMinutos);

    await validarSlotAindaLivre(slug, dados.servicoId, inicio);

    try {
      return await agendamentoRepository.criar({
        negocioId: negocio.id,
        servicoId: servico.id,
        clienteNome: dados.clienteNome,
        clienteTelefone: dados.clienteTelefone,
        clienteEmail: dados.clienteEmail,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
      });
    } catch (error) {
      // Não deveria acontecer depois da checagem acima, exceto quando duas
      // requisições concorrentes passam na checagem ao mesmo tempo — é
      // exatamente esse caso que a exclusion constraint do banco resolve.
      if (agendamentoRepository.isViolacaoSobreposicao(error)) {
        throw AppError.conflito("Esse horário acabou de ser reservado por outra pessoa. Escolha outro.");
      }
      throw error;
    }
  },

  async buscarPorToken(token: string) {
    const agendamento = await agendamentoRepository.buscarPorToken(token);
    if (!agendamento) throw AppError.naoEncontrado("Agendamento");
    return agendamento;
  },

  async cancelar(token: string) {
    const agendamento = await this.buscarPorToken(token);
    if (agendamento.status !== "CONFIRMADO") {
      throw new AppError("Esse agendamento já não está mais confirmado.", 422, "ESTADO_INVALIDO");
    }
    return agendamentoRepository.atualizarStatus(agendamento.id, "CANCELADO");
  },

  async remarcar(token: string, dados: RemarcarAgendamentoBody) {
    const agendamento = await this.buscarPorToken(token);
    if (agendamento.status !== "CONFIRMADO") {
      throw new AppError("Esse agendamento já não está mais confirmado.", 422, "ESTADO_INVALIDO");
    }

    const negocio = await negocioRepository.buscarPorId(agendamento.negocioId);
    if (!negocio) throw AppError.naoEncontrado("Negócio");

    const inicio = new Date(dados.dataHoraInicio);
    const fim = addMinutes(inicio, agendamento.servico.duracaoMinutos);

    await validarSlotAindaLivre(negocio.slug, agendamento.servicoId, inicio);

    try {
      return await agendamentoRepository.atualizarHorario(agendamento.id, inicio, fim);
    } catch (error) {
      if (agendamentoRepository.isViolacaoSobreposicao(error)) {
        throw AppError.conflito("Esse horário acabou de ser reservado por outra pessoa. Escolha outro.");
      }
      throw error;
    }
  },

  async listarDoNegocio(negocioId: string, de?: Date, ate?: Date) {
    return agendamentoRepository.listarPorNegocio(negocioId, de, ate);
  },
};
