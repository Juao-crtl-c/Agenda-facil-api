import "dotenv/config";
import { z } from "zod";

// Falha rápido e com mensagem clara se alguma variável de ambiente
// obrigatória estiver faltando, em vez de quebrar silenciosamente mais
// tarde (ex: JWT_SECRET undefined vira um token que nunca verifica certo).
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL é obrigatória (connection string sem -pooler, usada pelas migrations)"),
  PORT: z.coerce.number().int().positive().default(3333),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter pelo menos 16 caracteres"),
  LEMBRETES_SECRET: z.string().min(16, "LEMBRETES_SECRET deve ter pelo menos 16 caracteres"),
  RESEND_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Configuração de ambiente inválida — confira o .env contra o .env.example.");
}

export const env = parsed.data;
