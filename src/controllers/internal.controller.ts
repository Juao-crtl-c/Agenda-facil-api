import { Request, Response } from "express";
import { lembreteService } from "../services/lembrete.service";

export const internalController = {
  async processarLembretes(_req: Request, res: Response) {
    const resultado = await lembreteService.processar();
    res.json(resultado);
  },
};
