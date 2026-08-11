import { z } from "zod";
import "../lib/openapi"; // garante extendZodWithOpenApi antes do .openapi()

export const registroBodySchema = z
  .object({
    nome: z.string().min(2, "Informe o nome completo."),
    email: z.string().email("E-mail inválido."),
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  })
  .openapi("RegistroBody");

export const loginBodySchema = z
  .object({
    email: z.string().email("E-mail inválido."),
    senha: z.string().min(1, "Informe a senha."),
  })
  .openapi("LoginBody");

export const authResponseSchema = z
  .object({
    token: z.string(),
    usuario: z.object({
      id: z.string().uuid(),
      nome: z.string(),
      email: z.string().email(),
    }),
  })
  .openapi("AuthResponse");

export type RegistroBody = z.infer<typeof registroBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
