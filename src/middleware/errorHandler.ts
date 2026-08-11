import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/AppError";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `Rota não encontrada: ${req.method} ${req.path}`, code: "NOT_FOUND" } });
};

// Handler central de erros — todo throw dentro de uma rota async cai aqui
// (desde que a rota seja envolvida por asyncHandler, ver lib/asyncHandler.ts).
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, code: err.code, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        message: "Dados inválidos.",
        code: "VALIDATION_ERROR",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Erro interno do servidor.", code: "INTERNAL_ERROR" } });
};
