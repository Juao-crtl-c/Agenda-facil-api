import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { AppError } from "../lib/AppError";
import { agendamentoRepository } from "../repositories/agendamento.repository";
import { bloqueioRepository } from "../repositories/bloqueio.repository";
import { negocioRepository } from "../repositories/negocio.repository";
import { servicoRepository } from "../repositories/servico.repository";

export type Intervalo = { inicio: Date; fim: Date };

export type ParametrosCalculoSlots = {
  data: string; // "YYYY-MM-DD", calendário do negócio
  timezone: string; // IANA, ex: "America/Sao_Paulo"
  horario: { horaAbertura: string; horaFechamento: string } | null;
  duracaoMinutos: number;
  ocupados: Intervalo[];
  agora?: Date;
};

// Função pura: dado o horário de funcionamento do dia + o que já está
// ocupado, calcula os slots livres. Sem I/O — é o que os testes unitários
// exercitam diretamente, sem precisar de banco.
export function calcularSlotsDisponiveis(params: ParametrosCalculoSlots): Intervalo[] {
  const { data, timezone, horario, duracaoMinutos, ocupados, agora = new Date() } = params;
  if (!horario) return [];

  const abertura = fromZonedTime(`${data} ${horario.horaAbertura}:00`, timezone);
  const fechamento = fromZonedTime(`${data} ${horario.horaFechamento}:00`, timezone);

  const slots: Intervalo[] = [];
  let cursor = abertura;

  while (addMinutes(cursor, duracaoMinutos).getTime() <= fechamento.getTime()) {
    const fim = addMinutes(cursor, duracaoMinutos);
    const jaPassou = cursor.getTime() < agora.getTime();
    const colide = ocupados.some((o) => cursor.getTime() < o.fim.getTime() && fim.getTime() > o.inicio.getTime());

    if (!jaPassou && !colide) {
      slots.push({ inicio: cursor, fim });
    }

    cursor = fim;
  }

  return slots;
}

// diaSemana (0=domingo..6=sábado) a partir de uma data "YYYY-MM-DD" — isso
// NÃO depende de timezone: o dia da semana de um triplo ano-mês-dia é o
// mesmo em qualquer fuso, então dá pra calcular direto sem conversão.
function diaDaSemana(data: string): number {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export const disponibilidadeService = {
  async buscar(slug: string, servicoId: string, data: string) {
    const negocio = await negocioRepository.buscarPorSlug(slug);
    if (!negocio) throw AppError.naoEncontrado("Negócio");

    const servico = await servicoRepository.buscarPorId(servicoId);
    if (!servico || servico.negocioId !== negocio.id) {
      throw AppError.naoEncontrado("Serviço");
    }

    const horarioDoDia = negocio.horariosFuncionamento.find((h) => h.diaSemana === diaDaSemana(data));

    // Janela ampla o suficiente pra cobrir qualquer horário de abertura
    // possível dentro do dia local, mesmo perto da virada UTC.
    const inicioJanela = fromZonedTime(`${data} 00:00:00`, negocio.timezone);
    const fimJanela = fromZonedTime(`${data} 23:59:59`, negocio.timezone);

    const [agendamentos, bloqueios] = await Promise.all([
      agendamentoRepository.listarConfirmadosNoIntervalo(negocio.id, inicioJanela, fimJanela),
      bloqueioRepository.listarNoIntervalo(negocio.id, inicioJanela, fimJanela),
    ]);

    const ocupados: Intervalo[] = [
      ...agendamentos.map((a) => ({ inicio: a.dataHoraInicio, fim: a.dataHoraFim })),
      ...bloqueios.map((b) => ({ inicio: b.dataHoraInicio, fim: b.dataHoraFim })),
    ];

    return calcularSlotsDisponiveis({
      data,
      timezone: negocio.timezone,
      horario: horarioDoDia ?? null,
      duracaoMinutos: servico.duracaoMinutos,
      ocupados,
    });
  },
};
