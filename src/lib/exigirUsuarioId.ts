import { Request } from "express";
import { AppError } from "./AppError";

// O middleware `auth` sempre define req.usuarioId antes do controller
// rodar; isso só falha se uma rota autenticada esquecer de aplicar o
// middleware — nesse caso é melhor 401 do que undefined silencioso.
export function exigirUsuarioId(req: Request): string {
  if (!req.usuarioId) throw AppError.naoAutorizado();
  return req.usuarioId;
}
