import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Precisa rodar antes de qualquer schema chamar `.openapi(...)` — por isso
// este módulo é importado no topo de src/app.ts antes das rotas.
extendZodWithOpenApi(z);

// Registry compartilhado: cada arquivo de rota chama
// `registry.registerPath(...)` pra documentar seu próprio endpoint (schema
// Zod é a fonte única, tanto valida quanto documenta — evita a doc
// dessincronizar da validação real).
export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

export function gerarDocumentoOpenApi() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Agenda Fácil — API",
      version: "0.1.0",
      description:
        "API do Agenda Fácil (Vianova Dev): agendamento online para negócios locais. " +
        "Rotas sob /api/negocios/:slug/* são públicas (sem autenticação); as demais " +
        "exigem um token JWT obtido em /api/auth/login.",
    },
    servers: [{ url: "/" }],
  });
}
