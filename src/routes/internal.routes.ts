import { Router } from "express";
import { internalController } from "../controllers/internal.controller";
import { asyncHandler } from "../lib/asyncHandler";
import { internalAuth } from "../middleware/internalAuth";

export const internalRouter = Router();

// Não entra no registry do Swagger de propósito — não é uma rota pra
// clientes da API chamarem, só pro job agendado (cron da plataforma de
// deploy) disparar 1x/dia.
internalRouter.post("/processar", internalAuth, asyncHandler(internalController.processarLembretes));
