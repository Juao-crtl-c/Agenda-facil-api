import { z } from "zod";
import "../lib/openapi";

export const disponibilidadeQuerySchema = z.object({
  servicoId: z.string().uuid("servicoId precisa ser um UUID válido."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD."),
});

export type DisponibilidadeQuery = z.infer<typeof disponibilidadeQuerySchema>;
