import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { registry } from "../lib/openapi";
import { validate } from "../middleware/validate";
import { authResponseSchema, loginBodySchema, registroBodySchema } from "../schemas/auth.schemas";

export const authRouter = Router();

registry.registerPath({
  method: "post",
  path: "/api/auth/registro",
  tags: ["Auth"],
  summary: "Cria a conta do dono do negócio",
  request: { body: { content: { "application/json": { schema: registroBodySchema } } } },
  responses: {
    201: { description: "Conta criada", content: { "application/json": { schema: authResponseSchema } } },
    409: { description: "E-mail já cadastrado" },
  },
});
authRouter.post("/registro", validate({ body: registroBodySchema }), asyncHandler(authController.registrar));

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  summary: "Login do dono do negócio",
  request: { body: { content: { "application/json": { schema: loginBodySchema } } } },
  responses: {
    200: { description: "Login ok", content: { "application/json": { schema: authResponseSchema } } },
    401: { description: "Credenciais inválidas" },
  },
});
authRouter.post("/login", validate({ body: loginBodySchema }), asyncHandler(authController.login));
