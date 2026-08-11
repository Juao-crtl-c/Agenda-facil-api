import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../lib/AppError";
import { verificarToken } from "../lib/jwt";

// Estende o Request do Express com o usuarioId decodificado do JWT, pra não
// precisar de `as any` em todo controller autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuarioId?: string;
    }
  }
}

export const auth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    next(AppError.naoAutorizado("Token de autenticação ausente."));
    return;
  }

  try {
    const payload = verificarToken(token);
    req.usuarioId = payload.usuarioId;
    next();
  } catch {
    next(AppError.naoAutorizado("Token inválido ou expirado."));
  }
};
