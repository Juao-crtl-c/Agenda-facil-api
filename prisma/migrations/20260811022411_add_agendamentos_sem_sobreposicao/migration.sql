-- Garantia de verdade contra double-booking: o Postgres rejeita, por
-- construção, dois agendamentos CONFIRMADO do mesmo negócio com intervalos
-- de tempo sobrepostos — independente do que a camada de aplicação faça.
-- Isso cobre a condição de corrida que uma transação simples "verifica
-- depois insere" não cobre sob o isolamento READ COMMITTED (padrão do
-- Postgres).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "agendamentos"
  ADD CONSTRAINT "agendamentos_sem_sobreposicao"
  EXCLUDE USING gist (
    "negocioId" WITH =,
    tstzrange("dataHoraInicio", "dataHoraFim") WITH &&
  )
  WHERE (status = 'CONFIRMADO');
