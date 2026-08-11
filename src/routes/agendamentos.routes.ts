import { Router } from "express";
import { agendamentoController } from "../controllers/agendamento.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { registry } from "../lib/openapi";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { remarcarAgendamentoBodySchema, tokenParamsSchema } from "../schemas/agendamento.schemas";

export const agendamentosRouter = Router();

registry.registerPath({
  method: "get",
  path: "/api/agendamentos",
  tags: ["Agendamentos"],
  summary: "Agenda do negócio do usuário autenticado",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "OK" } },
});
agendamentosRouter.get("/", auth, asyncHandler(agendamentoController.listarMeus));

registry.registerPath({
  method: "get",
  path: "/api/agendamentos/{token}",
  tags: ["Agendamentos"],
  summary: "Detalhes de um agendamento pelo token do link de confirmação",
  request: { params: tokenParamsSchema },
  responses: { 200: { description: "OK" }, 404: { description: "Não encontrado" } },
});
agendamentosRouter.get(
  "/:token",
  validate({ params: tokenParamsSchema }),
  asyncHandler(agendamentoController.buscarPorToken)
);

registry.registerPath({
  method: "post",
  path: "/api/agendamentos/{token}/cancelar",
  tags: ["Agendamentos"],
  summary: "Cancela um agendamento pelo token",
  request: { params: tokenParamsSchema },
  responses: { 200: { description: "Cancelado" }, 404: { description: "Não encontrado" } },
});
agendamentosRouter.post(
  "/:token/cancelar",
  validate({ params: tokenParamsSchema }),
  asyncHandler(agendamentoController.cancelar)
);

registry.registerPath({
  method: "patch",
  path: "/api/agendamentos/{token}",
  tags: ["Agendamentos"],
  summary: "Remarca um agendamento pelo token",
  request: {
    params: tokenParamsSchema,
    body: { content: { "application/json": { schema: remarcarAgendamentoBodySchema } } },
  },
  responses: { 200: { description: "Remarcado" }, 409: { description: "Novo horário indisponível" } },
});
agendamentosRouter.patch(
  "/:token",
  validate({ params: tokenParamsSchema, body: remarcarAgendamentoBodySchema }),
  asyncHandler(agendamentoController.remarcar)
);
