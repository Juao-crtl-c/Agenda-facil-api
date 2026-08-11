import { z } from "zod";
import "../lib/openapi";

export const criarBloqueioBodySchema = z
  .object({
    dataHoraInicio: z.string().datetime({ message: "dataHoraInicio precisa ser um ISO 8601 válido." }),
    dataHoraFim: z.string().datetime({ message: "dataHoraFim precisa ser um ISO 8601 válido." }),
    motivo: z.string().max(200).optional(),
  })
  .refine((b) => new Date(b.dataHoraInicio) < new Date(b.dataHoraFim), {
    message: "dataHoraInicio precisa ser antes de dataHoraFim.",
    path: ["dataHoraFim"],
  })
  .openapi("CriarBloqueioBody");

export const bloqueioIdParamsSchema = z.object({ id: z.string().uuid() });

export type CriarBloqueioBody = z.infer<typeof criarBloqueioBodySchema>;
