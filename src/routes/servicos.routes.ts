import { Router } from "express";
import { servicoController } from "../controllers/servico.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { registry } from "../lib/openapi";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  atualizarServicoBodySchema,
  criarServicoBodySchema,
  servicoIdParamsSchema,
} from "../schemas/servico.schemas";

export const servicosRouter = Router();
servicosRouter.use(auth);

registry.registerPath({
  method: "get",
  path: "/api/servicos",
  tags: ["Serviços"],
  summary: "Lista os serviços do negócio do usuário autenticado",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "OK" } },
});
servicosRouter.get("/", asyncHandler(servicoController.listar));

registry.registerPath({
  method: "post",
  path: "/api/servicos",
  tags: ["Serviços"],
  summary: "Cria um serviço",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: criarServicoBodySchema } } } },
  responses: { 201: { description: "Criado" } },
});
servicosRouter.post("/", validate({ body: criarServicoBodySchema }), asyncHandler(servicoController.criar));

registry.registerPath({
  method: "put",
  path: "/api/servicos/{id}",
  tags: ["Serviços"],
  summary: "Atualiza um serviço",
  security: [{ bearerAuth: [] }],
  request: { params: servicoIdParamsSchema, body: { content: { "application/json": { schema: atualizarServicoBodySchema } } } },
  responses: { 200: { description: "OK" }, 404: { description: "Não encontrado" } },
});
servicosRouter.put(
  "/:id",
  validate({ params: servicoIdParamsSchema, body: atualizarServicoBodySchema }),
  asyncHandler(servicoController.atualizar)
);

registry.registerPath({
  method: "delete",
  path: "/api/servicos/{id}",
  tags: ["Serviços"],
  summary: "Remove um serviço",
  security: [{ bearerAuth: [] }],
  request: { params: servicoIdParamsSchema },
  responses: { 204: { description: "Removido" }, 404: { description: "Não encontrado" } },
});
servicosRouter.delete("/:id", validate({ params: servicoIdParamsSchema }), asyncHandler(servicoController.remover));
