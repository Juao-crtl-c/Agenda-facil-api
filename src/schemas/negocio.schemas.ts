import { z } from "zod";
import "../lib/openapi";

const slugSchema = z
  .string()
  .min(3, "O identificador da URL precisa ter pelo menos 3 caracteres.")
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen (ex: barbearia-do-joao).");

const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:mm (ex: 09:00).");

export const criarNegocioBodySchema = z
  .object({
    nome: z.string().min(2, "Informe o nome do negócio."),
    slug: slugSchema,
    timezone: z.string().default("America/Sao_Paulo"),
  })
  .openapi("CriarNegocioBody");

export const atualizarNegocioBodySchema = z
  .object({
    nome: z.string().min(2).optional(),
    timezone: z.string().optional(),
  })
  .openapi("AtualizarNegocioBody");

export const horarioFuncionamentoItemSchema = z
  .object({
    diaSemana: z.number().int().min(0).max(6),
    horaAbertura: horaSchema,
    horaFechamento: horaSchema,
  })
  .refine((h) => h.horaAbertura < h.horaFechamento, {
    message: "O horário de abertura precisa ser antes do de fechamento.",
    path: ["horaFechamento"],
  });

export const substituirHorariosBodySchema = z
  .object({
    horarios: z.array(horarioFuncionamentoItemSchema).max(7, "No máximo um horário por dia da semana."),
  })
  .openapi("SubstituirHorariosBody");

export const slugParamsSchema = z.object({ slug: slugSchema });

export type CriarNegocioBody = z.infer<typeof criarNegocioBodySchema>;
export type AtualizarNegocioBody = z.infer<typeof atualizarNegocioBodySchema>;
export type SubstituirHorariosBody = z.infer<typeof substituirHorariosBodySchema>;
