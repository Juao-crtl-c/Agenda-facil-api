import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";

// Testes de integração contra um banco real (a mesma Neon usada em dev —
// não há um banco de teste isolado nesta fase do projeto, ver README).
// Cada teste usa um slug/e-mail únicos por execução pra não colidir com
// dados que já existam, e o afterAll limpa tudo que criou.

const sufixo = Date.now();
const email = `teste-${sufixo}@exemplo.com`;
const slug = `negocio-teste-${sufixo}`;

let token: string;
let negocioId: string;
let servicoId: string;

// Horário de funcionamento generoso (todo santo dia, 08h-20h) pra o teste
// não depender de em qual dia da semana ele roda.
const HORARIOS_TODO_DIA = Array.from({ length: 7 }, (_, diaSemana) => ({
  diaSemana,
  horaAbertura: "08:00",
  horaFechamento: "20:00",
}));

beforeAll(async () => {
  const registro = await request(app)
    .post("/api/auth/registro")
    .send({ nome: "Dono de Teste", email, senha: "senha12345" });
  token = registro.body.token;

  const negocio = await request(app)
    .post("/api/negocios/me")
    .set("Authorization", `Bearer ${token}`)
    .send({ nome: "Negócio de Teste", slug, timezone: "America/Sao_Paulo" });
  negocioId = negocio.body.id;

  await request(app)
    .put("/api/negocios/me/horario-funcionamento")
    .set("Authorization", `Bearer ${token}`)
    .send({ horarios: HORARIOS_TODO_DIA });

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

describe("fluxo público de agendamento", () => {
  it("lista slots disponíveis respeitando o horário de funcionamento", async () => {
    const resposta = await request(app)
      .get(`/api/negocios/${slug}/disponibilidade`)
      .query({ servicoId, data: amanhaISO() });

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);
    expect(resposta.body.length).toBeGreaterThan(0);
  });

  it("cria um agendamento num slot disponível e ele some da disponibilidade depois", async () => {
    const antes = await request(app)
      .get(`/api/negocios/${slug}/disponibilidade`)
      .query({ servicoId, data: amanhaISO() });
    const slotEscolhido = antes.body[0].inicio;

    const criado = await request(app).post(`/api/negocios/${slug}/agendamentos`).send({
      servicoId,
      clienteNome: "Cliente Teste",
      clienteTelefone: "11999999999",
      clienteEmail: "cliente@exemplo.com",
      dataHoraInicio: slotEscolhido,
    });

    expect(criado.status).toBe(201);
    expect(criado.body.tokenCancelamento).toBeTruthy();

    const depois = await request(app)
      .get(`/api/negocios/${slug}/disponibilidade`)
      .query({ servicoId, data: amanhaISO() });
    expect(depois.body.map((s: { inicio: string }) => s.inicio)).not.toContain(slotEscolhido);
  });

  it("cancela um agendamento pelo token e o slot volta a aparecer disponível", async () => {
    const antes = await request(app)
      .get(`/api/negocios/${slug}/disponibilidade`)
      .query({ servicoId, data: amanhaISO() });
    const slotEscolhido = antes.body[0].inicio;

    const criado = await request(app).post(`/api/negocios/${slug}/agendamentos`).send({
      servicoId,
      clienteNome: "Cliente Cancelamento",
      clienteTelefone: "11999999999",
      clienteEmail: "cliente2@exemplo.com",
      dataHoraInicio: slotEscolhido,
    });

    const cancelado = await request(app).post(`/api/agendamentos/${criado.body.tokenCancelamento}/cancelar`);
    expect(cancelado.status).toBe(200);
    expect(cancelado.body.status).toBe("CANCELADO");

    const depois = await request(app)
      .get(`/api/negocios/${slug}/disponibilidade`)
      .query({ servicoId, data: amanhaISO() });
    expect(depois.body.map((s: { inicio: string }) => s.inicio)).toContain(slotEscolhido);
  });

  // O teste que realmente importa pro portfólio: duas requisições
  // concorrentes pro MESMO slot só uma pode vencer — é a exclusion
  // constraint do banco (agendamentos_sem_sobreposicao) fazendo esse
  // trabalho, não só a checagem de disponibilidade na aplicação (que
  // sozinha ainda deixaria a corrida acontecer entre o check e o insert).
  it("impede double-booking quando duas requisições concorrentes pedem o mesmo slot", async () => {
    const disponibilidade = await request(app)
      .get(`/api/negocios/${slug}/disponibilidade`)
      .query({ servicoId, data: amanhaISO() });
    const slotDisputado = disponibilidade.body.at(-1).inicio; // um slot ainda não usado pelos testes anteriores

    const payload = {
      servicoId,
      clienteTelefone: "11988888888",
      dataHoraInicio: slotDisputado,
    };

    const [respostaA, respostaB] = await Promise.all([
      request(app)
        .post(`/api/negocios/${slug}/agendamentos`)
        .send({ ...payload, clienteNome: "Cliente A", clienteEmail: "clienteA@exemplo.com" }),
      request(app)
        .post(`/api/negocios/${slug}/agendamentos`)
        .send({ ...payload, clienteNome: "Cliente B", clienteEmail: "clienteB@exemplo.com" }),
    ]);

    const statusCodes = [respostaA.status, respostaB.status].sort();
    expect(statusCodes).toEqual([201, 409]);
  });
});
