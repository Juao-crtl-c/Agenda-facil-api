import { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 não propaga rejeições de Promise pro error handler sozinho —
// todo controller async precisa passar por aqui pra um throw virar
// next(err) automaticamente, em vez de travar a request.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
