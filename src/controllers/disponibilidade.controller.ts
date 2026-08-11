import { Request, Response } from "express";
import { disponibilidadeService } from "../services/disponibilidade.service";

export const disponibilidadeController = {
  async buscar(req: Request, res: Response) {
    const { servicoId, data } = req.query as unknown as { servicoId: string; data: string };
    const slots = await disponibilidadeService.buscar(req.params.slug, servicoId, data);
    res.json(slots.map((s) => ({ inicio: s.inicio.toISOString(), fim: s.fim.toISOString() })));
  },
};
