CREATE TABLE "Sessao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "expiraEm" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Sessao_expiraEm_idx" ON "Sessao"("expiraEm");
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");
