import { describe, expect, it } from "vitest";
import { calcularSlotsDisponiveis } from "../../src/services/disponibilidade.service";

const TIMEZONE = "America/Sao_Paulo";
const DATA = "2026-08-17"; // segunda-feira
const HORARIO = { horaAbertura: "09:00", horaFechamento: "12:00" };

// "Agora" bem no passado, pra nenhum teste ser afetado por slot filtrado
// por já ter passado (a menos que o próprio teste queira isso).
const AGORA_NO_PASSADO = new Date("2000-01-01T00:00:00Z");

function isoParaHorarioLocal(iso: Date) {
  return iso.toLocaleTimeString("pt-BR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" });
}

describe("calcularSlotsDisponiveis", () => {
  it("gera slots a cada duração do serviço dentro do expediente", () => {
    const slots = calcularSlotsDisponiveis({
      data: DATA,
      timezone: TIMEZONE,
      horario: HORARIO,
      duracaoMinutos: 60,
      ocupados: [],
      agora: AGORA_NO_PASSADO,
    });

    expect(slots.map((s) => isoParaHorarioLocal(s.inicio))).toEqual(["09:00", "10:00", "11:00"]);
  });

  it("retorna vazio quando o negócio não abre naquele dia", () => {
    const slots = calcularSlotsDisponiveis({
      data: DATA,
      timezone: TIMEZONE,
      horario: null,
      duracaoMinutos: 30,
      ocupados: [],
      agora: AGORA_NO_PASSADO,
    });

    expect(slots).toEqual([]);
  });

  it("remove slots que colidem com um agendamento existente", () => {
    const slots = calcularSlotsDisponiveis({
      data: DATA,
      timezone: TIMEZONE,
      horario: HORARIO,
      duracaoMinutos: 60,
      ocupados: [
        {
          inicio: new Date(`${DATA}T13:00:00.000Z`), // 10:00 em America/Sao_Paulo (UTC-3)
          fim: new Date(`${DATA}T14:00:00.000Z`),
        },
      ],
      agora: AGORA_NO_PASSADO,
    });

    expect(slots.map((s) => isoParaHorarioLocal(s.inicio))).toEqual(["09:00", "11:00"]);
  });

  it("remove slots que colidem com um bloqueio no meio do dia", () => {
    const slots = calcularSlotsDisponiveis({
      data: DATA,
      timezone: TIMEZONE,
      horario: { horaAbertura: "09:00", horaFechamento: "11:00" },
      duracaoMinutos: 30,
      ocupados: [{ inicio: new Date(`${DATA}T13:00:00.000Z`), fim: new Date(`${DATA}T13:30:00.000Z`) }],
      agora: AGORA_NO_PASSADO,
    });

    // 09:00, 09:30, 10:00, 10:30 seriam os candidatos; 10:00 colide.
    expect(slots.map((s) => isoParaHorarioLocal(s.inicio))).toEqual(["09:00", "09:30", "10:30"]);
  });

  it("não gera um slot cujo serviço não cabe antes do fechamento", () => {
    const slots = calcularSlotsDisponiveis({
      data: DATA,
      timezone: TIMEZONE,
      horario: { horaAbertura: "09:00", horaFechamento: "10:15" },
      duracaoMinutos: 60,
      ocupados: [],
      agora: AGORA_NO_PASSADO,
    });

    // Só cabe um serviço de 60min (09:00-10:00); um segundo (10:00-11:00)
    // passaria do fechamento (10:15) e não deve aparecer.
    expect(slots.map((s) => isoParaHorarioLocal(s.inicio))).toEqual(["09:00"]);
  });

  it("filtra slots que já passaram quando 'agora' está no meio do expediente", () => {
    const slots = calcularSlotsDisponiveis({
      data: DATA,
      timezone: TIMEZONE,
      horario: HORARIO,
      duracaoMinutos: 60,
      ocupados: [],
      agora: new Date(`${DATA}T13:30:00.000Z`), // 10:30 em America/Sao_Paulo
    });

    expect(slots.map((s) => isoParaHorarioLocal(s.inicio))).toEqual(["11:00"]);
  });

  it("calcula corretamente perto da virada de dia em UTC (fuso do negócio ≠ UTC)", () => {
    // 21h em America/Sao_Paulo é meia-noite (dia seguinte) em UTC — garante
    // que a abertura/fechamento são calculados no fuso do negócio, não em UTC.
    const slots = calcularSlotsDisponiveis({
      data: DATA,
      timezone: TIMEZONE,
      horario: { horaAbertura: "20:00", horaFechamento: "22:00" },
      duracaoMinutos: 60,
      ocupados: [],
      agora: AGORA_NO_PASSADO,
    });

    expect(slots.map((s) => isoParaHorarioLocal(s.inicio))).toEqual(["20:00", "21:00"]);
    // O segundo slot já está, de fato, no dia seguinte em UTC.
    expect(slots[1].inicio.toISOString().startsWith("2026-08-18")).toBe(true);
  });
});
