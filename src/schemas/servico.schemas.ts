import { z } from "zod";
import "../lib/openapi";

export const criarServicoBodySchema = z
  .object({
    nome: z.string().min(2, "Informe o nome do serviço."),
    duracaoMinutos: z.number().int().min(5, "Duração mínima de 5 minutos.").max(600),
    preco: z.number().nonnegative("O preço não pode ser negativo."),
  })
  .openapi("CriarServicoBody");

export const atualizarServicoBodySchema = criarServicoBodySchema.partial().openapi("AtualizarServicoBody");

export const servicoIdParamsSchema = z.object({ id: z.string().uuid() });

export type CriarServicoBody = z.infer<typeof criarServicoBodySchema>;
export type AtualizarServicoBody = z.infer<typeof atualizarServicoBodySchema>;
