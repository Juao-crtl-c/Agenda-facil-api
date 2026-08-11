import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../lib/AppError";
import { env } from "../lib/env";

// Protege rotas internas (chamadas só por um job agendado, não por um
// usuário) — mesmo padrão do CRON_SECRET usado no Vianova Gestão Financeira.
export const internalAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header !== `Bearer ${env.LEMBRETES_SECRET}`) {
    next(AppError.naoAutorizado("Token interno inválido."));
    return;
  }
  next();
};
