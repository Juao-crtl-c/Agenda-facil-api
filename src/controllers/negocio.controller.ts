import { Request, Response } from "express";
import { exigirUsuarioId } from "../lib/exigirUsuarioId";
import { negocioService } from "../services/negocio.service";

export const negocioController = {
  async criar(req: Request, res: Response) {
    const negocio = await negocioService.criarParaUsuario(exigirUsuarioId(req), req.body);
    res.status(201).json(negocio);
  },

  async meuNegocio(req: Request, res: Response) {
    const negocio = await negocioService.buscarMeuNegocio(exigirUsuarioId(req));
    res.json(negocio);
  },

  async atualizar(req: Request, res: Response) {
    const negocio = await negocioService.atualizarMeuNegocio(exigirUsuarioId(req), req.body);
    res.json(negocio);
  },

  async substituirHorarios(req: Request, res: Response) {
    const negocio = await negocioService.substituirHorarios(exigirUsuarioId(req), req.body);
    res.json(negocio);
  },

  async publico(req: Request, res: Response) {
    const negocio = await negocioService.buscarPublico(req.params.slug);
    res.json(negocio);
  },
};
