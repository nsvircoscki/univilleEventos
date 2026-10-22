# Univille — base para agenda de reserva de eventos

Branch independente com calendário mensal extraído do SIS Ponto, animação de introdução, login JWT, troca de senha e administração de usuários (cadastro, edição, desativação e redefinição de senha).

O banco PostgreSQL contém apenas usuários (`User`) e perfis (`Role`: `ADMIN` e `USUARIO`). O calendário ainda não grava eventos: locais, reservas, horários e conflitos serão definidos na próxima etapa.

## Executar

Requer Node compatível com Vite 8/Prisma 7 e Docker Compose.

1. Execute `npm ci`, `npm ci --prefix backend` e `npm ci --prefix frontend`.
2. Copie `backend/.env.example` para `backend/.env` e defina senha do PostgreSQL, `DATABASE_URL`, `JWT_SECRET` e dados `ADMIN_*`. Se alterar a senha do banco, atualize também a URL (codifique caracteres especiais na URL).
3. Em `backend`, execute `docker compose up -d --wait`.
4. Em `backend`, execute `npx prisma generate` e `npx prisma migrate deploy`.
5. Em `backend`, execute `node scripts/criarAdmin.mjs`. O script cria perfis e um administrador; se o login já existir, recusa sem alterar a conta.
6. Na raiz, execute `npm run dev`. Abra http://localhost:5174. API em http://localhost:3001.

O Compose usa projeto e volume `univille`, com PostgreSQL em `localhost:5433`, separados do CCF. Use um banco novo: as migrations desta branch substituem o histórico específico do CCF e não devem ser aplicadas ao banco original. Nenhum banco existente foi alterado nesta extração.

## Verificação

`npm run build --prefix frontend` e `npm test --prefix backend`.

## Organização

- `frontend/src/page/CalendarioView.jsx`: calendário mensal, navegação e seleção de data, sem dados de ponto.
- `frontend/src/components/IntroScreen.jsx` e `LoginView.jsx`: introdução e autenticação reaproveitadas.
- `frontend/src/page/UsuariosView.jsx`: administração restrita ao perfil `ADMIN`.
- `backend/src`: autenticação, usuários e controles de acesso.
- `backend/prisma`: schema e migration inicial do banco independente.

Não há integração de ponto, documentos, serviços, faturamento ou Kanban nesta base.
