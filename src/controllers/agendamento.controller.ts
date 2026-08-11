import { Request, Response } from "express";
import { exigirUsuarioId } from "../lib/exigirUsuarioId";
import { negocioService } from "../services/negocio.service";
import { agendamentoService } from "../services/agendamento.service";

export const agendamentoController = {
  async criar(req: Request, res: Response) {
    const agendamento = await agendamentoService.criar(req.params.slug, req.body);
    res.status(201).json(agendamento);
  },

  async buscarPorToken(req: Request, res: Response) {
    const agendamento = await agendamentoService.buscarPorToken(req.params.token);
    res.json(agendamento);
  },

  async cancelar(req: Request, res: Response) {
    const agendamento = await agendamentoService.cancelar(req.params.token);
    res.json(agendamento);
  },

  async remarcar(req: Request, res: Response) {
    const agendamento = await agendamentoService.remarcar(req.params.token, req.body);
    res.json(agendamento);
  },

  async listarMeus(req: Request, res: Response) {
    const negocio = await negocioService.buscarMeuNegocio(exigirUsuarioId(req));
    const { de, ate } = req.query as { de?: string; ate?: string };
    const agendamentos = await agendamentoService.listarDoNegocio(
      negocio.id,
      de ? new Date(de) : undefined,
      ate ? new Date(ate) : undefined
    );
    res.json(agendamentos);
  },
};
