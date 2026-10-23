CREATE TYPE "StatusEvento" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');
CREATE TABLE "Evento" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL DEFAULT '',
  "local" TEXT NOT NULL,
  "localChave" TEXT NOT NULL,
  "inicio" TIMESTAMP(3) NOT NULL,
  "fim" TIMESTAMP(3) NOT NULL,
  "status" "StatusEvento" NOT NULL DEFAULT 'PENDENTE',
  "motivo" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decididoEm" TIMESTAMP(3),
  "solicitanteId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "revisorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Evento_horario_valido" CHECK ("fim" > "inicio")
);
CREATE INDEX "Evento_status_inicio_fim_idx" ON "Evento"("status", "inicio", "fim");
CREATE INDEX "Evento_localChave_status_inicio_fim_idx" ON "Evento"("localChave", "status", "inicio", "fim");
CREATE INDEX "Evento_solicitanteId_criadoEm_idx" ON "Evento"("solicitanteId", "criadoEm");
