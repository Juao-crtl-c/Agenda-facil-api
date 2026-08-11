import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";

const sufixo = Date.now();
const email = `teste-bloqueio-${sufixo}@exemplo.com`;
const slug = `negocio-bloqueio-teste-${sufixo}`;

let token: string;
let negocioId: string;
let servicoId: string;

beforeAll(async () => {
  const registro = await request(app)
    .post("/api/auth/registro")
    .send({ nome: "Dono Bloqueio", email, senha: "senha12345" });
  token = registro.body.token;

  const negocio = await request(app)
    .post("/api/negocios/me")
    .set("Authorization", `Bearer ${token}`)
    .send({ nome: "Negócio Bloqueio", slug, timezone: "America/Sao_Paulo" });
  negocioId = negocio.body.id;

  await request(app)
    .put("/api/negocios/me/horario-funcionamento")
    .set("Authorization", `Bearer ${token}`)
    .send({
      horarios: Array.from({ length: 7 }, (_, diaSemana) => ({
        diaSemana,
        horaAbertura: "08:00",
        horaFechamento: "20:00",
      })),
    });

  const servico = await request(app)
    .post("/api/servicos")
    .set("Authorization", `Bearer ${token}`)
    .send({ nome: "Corte", duracaoMinutos: 30, preco: 50 });
  servicoId = servico.body.id;
});

afterAll(async () => {
  await prisma.agendamento.deleteMany({ where: { negocioId } });
  await prisma.bloqueio.deleteMany({ where: { negocioId } });
  await prisma.servico.deleteMany({ where: { negocioId } });
  await prisma.horarioFuncionamento.deleteMany({ where: { negocioId } });
  await prisma.negocio.deleteMany({ where: { id: negocioId } });
  await prisma.usuario.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

function amanhaISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe("validação de conflito ao criar bloqueio", () => {
  it("recusa bloquear um horário que já tem agendamento confirmado", async () => {
    const disponibilidade = await request(app)
      .get(`/api/negocios/${slug}/disponibilidade`)
      .query({ servicoId, data: amanhaISO() });
    const slot = disponibilidade.body[0];

    const agendamento = await request(app).post(`/api/negocios/${slug}/agendamentos`).send({
      servicoId,
      clienteNome: "Cliente",
      clienteTelefone: "11999999999",
      clienteEmail: "cliente@exemplo.com",
      dataHoraInicio: slot.inicio,
    });
    expect(agendamento.status).toBe(201);

    const bloqueio = await request(app)
      .post("/api/bloqueios")
      .set("Authorization", `Bearer ${token}`)
      .send({ dataHoraInicio: slot.inicio, dataHoraFim: slot.fim, motivo: "Teste" });

    expect(bloqueio.status).toBe(409);
    expect(bloqueio.body.error.details.agendamentosConflitantes).toHaveLength(1);
  });

  it("permite bloquear um horário livre", async () => {
    const disponibilidade = await request(app)
      .get(`/api/negocios/${slug}/disponibilidade`)
      .query({ servicoId, data: amanhaISO() });
    const slot = disponibilidade.body.at(-1);

    const bloqueio = await request(app)
      .post("/api/bloqueios")
      .set("Authorization", `Bearer ${token}`)
      .send({ dataHoraInicio: slot.inicio, dataHoraFim: slot.fim, motivo: "Folga" });

    expect(bloqueio.status).toBe(201);
  });
});
