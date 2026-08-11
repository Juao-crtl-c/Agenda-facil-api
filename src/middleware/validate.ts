import { NextFunction, Request, RequestHandler, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

// Valida body/query/params contra schemas Zod e substitui req.<parte> pelo
// resultado já parseado (com coerções e defaults aplicados). Erros de
// validação viram ZodError, capturado pelo errorHandler central.
export function validate(schemas: { body?: Schema; query?: Schema; params?: Schema }): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) req.query = schemas.query.parse(req.query) as any;
    if (schemas.params) req.params = schemas.params.parse(req.params) as any;
    next();
  };
}
