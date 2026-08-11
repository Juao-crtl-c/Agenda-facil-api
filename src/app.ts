import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { gerarDocumentoOpenApi } from "./lib/openapi";
import { env } from "./lib/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { negociosRouter } from "./routes/negocios.routes";
import { servicosRouter } from "./routes/servicos.routes";
import { bloqueiosRouter } from "./routes/bloqueios.routes";
import { agendamentosRouter } from "./routes/agendamentos.routes";
import { internalRouter } from "./routes/internal.routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(gerarDocumentoOpenApi()));

app.use("/api/auth", authRouter);
app.use("/api/negocios", negociosRouter);
app.use("/api/servicos", servicosRouter);
app.use("/api/bloqueios", bloqueiosRouter);
app.use("/api/agendamentos", agendamentosRouter);
app.use("/api/internal/lembretes", internalRouter);

app.use(notFoundHandler);
app.use(errorHandler);
