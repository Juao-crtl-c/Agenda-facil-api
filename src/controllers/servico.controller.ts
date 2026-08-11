import { Request, Response } from "express";
import { exigirUsuarioId } from "../lib/exigirUsuarioId";
import { servicoService } from "../services/servico.service";

export const servicoController = {
  async criar(req: Request, res: Response) {
    const servico = await servicoService.criar(exigirUsuarioId(req), req.body);
    res.status(201).json(servico);
  },

  async listar(req: Request, res: Response) {
    const servicos = await servicoService.listarMeus(exigirUsuarioId(req));
    res.json(servicos);
  },

  async atualizar(req: Request, res: Response) {
    const servico = await servicoService.atualizar(exigirUsuarioId(req), req.params.id, req.body);
    res.json(servico);
  },

  async remover(req: Request, res: Response) {
    await servicoService.remover(exigirUsuarioId(req), req.params.id);
    res.status(204).end();
  },
};
