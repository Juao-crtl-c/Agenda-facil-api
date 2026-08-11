import { Router } from "express";
import { bloqueioController } from "../controllers/bloqueio.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { registry } from "../lib/openapi";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { bloqueioIdParamsSchema, criarBloqueioBodySchema } from "../schemas/bloqueio.schemas";

export const bloqueiosRouter = Router();
bloqueiosRouter.use(auth);

registry.registerPath({
  method: "get",
  path: "/api/bloqueios",
  tags: ["Bloqueios"],
  summary: "Lista os bloqueios do negócio do usuário autenticado",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "OK" } },
});
bloqueiosRouter.get("/", asyncHandler(bloqueioController.listar));

registry.registerPath({
  method: "post",
  path: "/api/bloqueios",
  tags: ["Bloqueios"],
  summary: "Cria um bloqueio de horário (folga, feriado etc.)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: criarBloqueioBodySchema } } } },
  responses: { 201: { description: "Criado" }, 409: { description: "Colide com agendamento confirmado" } },
});
bloqueiosRouter.post("/", validate({ body: criarBloqueioBodySchema }), asyncHandler(bloqueioController.criar));

registry.registerPath({
  method: "delete",
  path: "/api/bloqueios/{id}",
  tags: ["Bloqueios"],
  summary: "Remove um bloqueio",
  security: [{ bearerAuth: [] }],
  request: { params: bloqueioIdParamsSchema },
  responses: { 204: { description: "Removido" }, 404: { description: "Não encontrado" } },
});
bloqueiosRouter.delete(
  "/:id",
  validate({ params: bloqueioIdParamsSchema }),
  asyncHandler(bloqueioController.remover)
);
