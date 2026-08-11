import { Request, Response } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  async registrar(req: Request, res: Response) {
    const resultado = await authService.registrar(req.body);
    res.status(201).json(resultado);
  },

  async login(req: Request, res: Response) {
    const resultado = await authService.login(req.body);
    res.json(resultado);
  },
};
