import { z } from "zod";
import "../lib/openapi";

export const criarAgendamentoBodySchema = z
  .object({
    servicoId: z.string().uuid(),
    clienteNome: z.string().min(2, "Informe seu nome."),
    clienteTelefone: z.string().min(8, "Informe um telefone válido."),
    clienteEmail: z.string().email("E-mail inválido."),
    // Instante UTC em ISO 8601 — o slot escolhido veio de
    // GET /disponibilidade, que já retorna nesse formato.
    dataHoraInicio: z.string().datetime({ message: "dataHoraInicio precisa ser um ISO 8601 válido." }),
  })
  .openapi("CriarAgendamentoBody");

export const remarcarAgendamentoBodySchema = z
  .object({
    dataHoraInicio: z.string().datetime({ message: "dataHoraInicio precisa ser um ISO 8601 válido." }),
  })
  .openapi("RemarcarAgendamentoBody");

export const tokenParamsSchema = z.object({ token: z.string().uuid() });

export type CriarAgendamentoBody = z.infer<typeof criarAgendamentoBodySchema>;
export type RemarcarAgendamentoBody = z.infer<typeof remarcarAgendamentoBodySchema>;
