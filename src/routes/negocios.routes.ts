import { Router } from "express";
import { agendamentoController } from "../controllers/agendamento.controller";
import { disponibilidadeController } from "../controllers/disponibilidade.controller";
import { negocioController } from "../controllers/negocio.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { registry } from "../lib/openapi";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { criarAgendamentoBodySchema } from "../schemas/agendamento.schemas";
import { disponibilidadeQuerySchema } from "../schemas/disponibilidade.schemas";
import {
  atualizarNegocioBodySchema,
  criarNegocioBodySchema,
  slugParamsSchema,
  substituirHorariosBodySchema,
} from "../schemas/negocio.schemas";

export const negociosRouter = Router();

// IMPORTANTE: as rotas literais /me* precisam vir antes de /:slug, senão
// o Express casa "/me" com o parâmetro :slug da rota pública.

registry.registerPath({
  method: "post",
  path: "/api/negocios/me",
  tags: ["Negócios"],
  summary: "Cria o negócio do usuário autenticado (um por dono)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: criarNegocioBodySchema } } } },
  responses: { 201: { description: "Negócio criado" }, 409: { description: "Já existe negócio ou slug em uso" } },
});
negociosRouter.post("/me", auth, validate({ body: criarNegocioBodySchema }), asyncHandler(negocioController.criar));

registry.registerPath({
  method: "get",
  path: "/api/negocios/me",
  tags: ["Negócios"],
  summary: "Dados do negócio do usuário autenticado",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "OK" }, 404: { description: "Ainda não criou um negócio" } },
});
negociosRouter.get("/me", auth, asyncHandler(negocioController.meuNegocio));

registry.registerPath({
  method: "put",
  path: "/api/negocios/me",
  tags: ["Negócios"],
  summary: "Atualiza nome/timezone do negócio",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: atualizarNegocioBodySchema } } } },
  responses: { 200: { description: "OK" } },
});
negociosRouter.put(
  "/me",
  auth,
  validate({ body: atualizarNegocioBodySchema }),
  asyncHandler(negocioController.atualizar)
);

registry.registerPath({
  method: "put",
  path: "/api/negocios/me/horario-funcionamento",
  tags: ["Negócios"],
  summary: "Substitui a semana inteira de horário de funcionamento",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: substituirHorariosBodySchema } } } },
  responses: { 200: { description: "OK" } },
});
negociosRouter.put(
  "/me/horario-funcionamento",
  auth,
  validate({ body: substituirHorariosBodySchema }),
  asyncHandler(negocioController.substituirHorarios)
);

registry.registerPath({
  method: "get",
  path: "/api/negocios/{slug}",
  tags: ["Negócios"],
  summary: "Dados públicos do negócio (página de agendamento)",
  request: { params: slugParamsSchema },
  responses: { 200: { description: "OK" }, 404: { description: "Negócio não encontrado" } },
});
negociosRouter.get("/:slug", validate({ params: slugParamsSchema }), asyncHandler(negocioController.publico));

registry.registerPath({
  method: "get",
  path: "/api/negocios/{slug}/disponibilidade",
  tags: ["Agendamentos"],
  summary: "Slots livres de um serviço num dia",
  request: { params: slugParamsSchema, query: disponibilidadeQuerySchema },
  responses: { 200: { description: "OK" }, 404: { description: "Negócio ou serviço não encontrado" } },
});
negociosRouter.get(
  "/:slug/disponibilidade",
  validate({ params: slugParamsSchema, query: disponibilidadeQuerySchema }),
  asyncHandler(disponibilidadeController.buscar)
);

registry.registerPath({
  method: "post",
  path: "/api/negocios/{slug}/agendamentos",
  tags: ["Agendamentos"],
  summary: "Cria um agendamento (cliente, sem login)",
  request: {
    params: slugParamsSchema,
    body: { content: { "application/json": { schema: criarAgendamentoBodySchema } } },
  },
  responses: {
    201: { description: "Agendamento confirmado" },
    409: { description: "Horário não está mais disponível" },
  },
});
negociosRouter.post(
  "/:slug/agendamentos",
  validate({ params: slugParamsSchema, body: criarAgendamentoBodySchema }),
  asyncHandler(agendamentoController.criar)
);
