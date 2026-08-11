import { Request, Response } from "express";
import { exigirUsuarioId } from "../lib/exigirUsuarioId";
import { bloqueioService } from "../services/bloqueio.service";

export const bloqueioController = {
  async criar(req: Request, res: Response) {
    const bloqueio = await bloqueioService.criar(exigirUsuarioId(req), req.body);
    res.status(201).json(bloqueio);
  },

  async listar(req: Request, res: Response) {
    const bloqueios = await bloqueioService.listarMeus(exigirUsuarioId(req));
    res.json(bloqueios);
  },

  async remover(req: Request, res: Response) {
    await bloqueioService.remover(exigirUsuarioId(req), req.params.id);
    res.status(204).end();
  },
};
