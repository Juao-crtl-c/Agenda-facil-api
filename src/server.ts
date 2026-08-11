import { app } from "./app";
import { env } from "./lib/env";

app.listen(env.PORT, () => {
  console.log(`Agenda Fácil API rodando em http://localhost:${env.PORT}`);
  console.log(`Documentação: http://localhost:${env.PORT}/docs`);
});
