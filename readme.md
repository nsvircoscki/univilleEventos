# Univille — Agenda de eventos

Calendário público com visualizações de dia, semana, mês e ano. Qualquer visitante pode consultar os eventos aprovados. Para solicitar um evento é necessário entrar ou criar uma conta; a administração analisa as solicitações e gerencia os usuários.

# No desevolvimento foi utilizado agentes de IA

## Pré-requisitos

- Git.
- Node.js 24 (versão usada na validação) e npm. As dependências também aceitam Node 20.19+ ou 22.12+ nas respectivas versões principais.
- Docker Desktop aberto, com Docker Compose e suporte a containers Linux.
- Acesso à internet na primeira instalação para baixar os pacotes e a imagem PostgreSQL.

Confira as ferramentas:

```powershell
git --version
node --version
npm.cmd --version
docker compose version
```

Os exemplos abaixo usam PowerShell no Windows. `npm.cmd` evita o bloqueio de scripts `npm.ps1`. No Linux/macOS use `npm` e substitua `Copy-Item` por `cp`.

## Primeira configuração em outro computador

### 1. Clonar e entrar na pasta correta

```powershell
git clone https://github.com/nsvircoscki/univilleEventos.git
cd univilleEventos
```

Execute os comandos na pasta que contém `package.json`, `backend` e `frontend`. Não é necessário clonar o repositório CCF nem copiar um banco existente.

### 2. Criar o arquivo de configuração local

```powershell
Copy-Item backend/.env.example backend/.env
```

Edite `backend/.env` **antes de iniciar o banco**:

```dotenv
POSTGRES_USER=univille
POSTGRES_PASSWORD=escolha-uma-senha-local
POSTGRES_DB=univille
POSTGRES_PORT=5432
DATABASE_URL=postgresql://univille:escolha-uma-senha-local@localhost:5432/univille
PORT=3000
CORS_ORIGENS=http://localhost:5173
ADMIN_NOME=Administrador
ADMIN_EMAIL=seu-email@exemplo.com
ADMIN_LOGIN=admin
ADMIN_SENHA=escolha-a-senha-do-primeiro-admin
```

A senha de `POSTGRES_PASSWORD` deve ser igual à senha usada em `DATABASE_URL`. Se ela contiver caracteres especiais, codifique-os na URL. Os campos `ADMIN_*` servem para criar o primeiro administrador; a senha do administrador é diferente da senha do banco.

O `.env` é local e ignorado pelo Git. As credenciais de outro desenvolvedor não vêm no clone. Não publique esse arquivo.

### 3. Instalar as dependências

Na raiz:

```powershell
npm.cmd ci
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

### 4. Iniciar o PostgreSQL, gerar o Prisma e aplicar as migrations

```powershell
cd backend
docker compose up -d --wait
npm.cmd run db:generate
npm.cmd run db:migrate
```

O Compose cria um PostgreSQL 15 na porta padrão local `5432`, com volume persistente próprio. As migrations criam os perfis, usuários e a estrutura de solicitações de eventos; os dados de usuários e os perfis iniciais são cadastrados pelo comando a seguir.

Use um banco exclusivo da Univille. Não aplique essas migrations ao banco CCF. Quando estiver em outro computador, use o seu próprio volume e o seu próprio `.env`.

### 5. Criar o primeiro administrador

Ainda em `backend`:

```powershell
npm.cmd run db:admin
```

O script lê os campos `ADMIN_*`, cria os perfis `ADMIN` e `USUARIO`, grava a senha com hash e cria o primeiro administrador. Ele **não sobrescreve** uma conta já existente: se o login estiver cadastrado, informa o problema e encerra.

Trocar `ADMIN_SENHA` no `.env` depois de criar a conta **não altera a senha já gravada**. Faça alterações de senha pela aplicação. Uma conta criada pelo cadastro público sempre recebe `USUARIO`; somente um administrador pode atribuir o perfil administrativo.

### 6. Rodar a aplicação

Volte para a raiz:

```powershell
cd ..
npm.cmd run dev
```

- Aplicação: http://localhost:5173
- API: http://localhost:3000
- Verificação da API: http://localhost:3000/health

O site abre no calendário sem exigir login. A autenticação usa sessões de 12 horas no PostgreSQL e cookie `HttpOnly` / `SameSite=Lax`, sem JWT e sem token de acesso no `localStorage`. O `JWT_SECRET` não é mais usado; se existir em um `.env` antigo, pode ser removido. Em produção, configure `NODE_ENV=production` e HTTPS para o cookie `Secure`. Clique em **Entrar** no canto superior direito da faixa verde da Univille e use `ADMIN_LOGIN` e `ADMIN_SENHA` para entrar pela primeira vez.

Não é necessário criar um `.env` no frontend. O Vite encaminha `/api` para a API local na porta 3000.

## Executar nas próximas vezes

Com o Docker Desktop aberto, na raiz do projeto:

```powershell
docker compose --project-directory backend up -d --wait
npm.cmd run dev
```

Encerre o servidor de desenvolvimento com **Ctrl+C**. Para parar o PostgreSQL sem apagar os dados:

```powershell
docker compose --project-directory backend stop
```

Após baixar mudanças que incluem schema ou migrations:

```powershell
git pull
npm.cmd ci
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
cd backend
npm.cmd run db:generate
npm.cmd run db:migrate
cd ..
npm.cmd run dev
```

## Fluxos da aplicação

- **Visitante:** consulta somente o calendário público do mês atual e dos dois meses seguintes. Os dados pessoais do solicitante e os eventos pendentes/recusados não aparecem na API pública.
- **Criar conta:** na página `/login`, clique em **Criar conta**. Preencha nome, e-mail, usuário e senha em `/cadastro`. O cadastro entra na conta automaticamente e redireciona ao calendário. Nunca concede perfil de administrador.
- **Entrar e sair:** login e cadastro são páginas próprias. Ao entrar, retorna ao calendário autenticado. O botão **Sair** fica no canto superior direito da faixa verde e retorna ao calendário público.
- **Solicitante:** em **Solicitar evento**, use **Nova palestra** para criar uma solicitação e **Editar aprovadas** para alterar suas palestras já aprovadas. Ao enviar alterações, o evento volta para `PENDENTE`, sai do calendário público e exige nova aprovação. Palestras anteriores podem ser selecionadas e reagendadas para uma data futura. Também é possível salvar rascunhos, editar solicitações pendentes e recusadas, acompanhar o andamento, excluir rascunhos e cancelar solicitações pendentes.
- **Aprovar solicitações:** disponível ao `ADMIN`. Permite aprovar ou recusar. A recusa exige motivo. Um evento só aparece no calendário público depois de aprovado.
- **Administrador:** além dos fluxos de solicitante, pode cadastrar e inativar usuários. A inativação exige confirmação e a senha atual do administrador. Pode editar todas as palestras aprovadas; essas alterações também exigem reaprovação. Pode exportar relatórios de solicitações, eventos aprovados (incluindo anteriores) e usuários em CSV.
- **Conflitos:** não é possível aprovar eventos simultâneos no mesmo espaço, incluindo decisões concorrentes. Horários encostados são permitidos. O espaço é identificado pelo nome normalizado (ignorando maiúsculas, acentos e espaços repetidos); use nomes consistentes.
- **Relatórios:** a administração pode filtrar solicitações e eventos aprovados por período, curso/coordenação e tema, e exportar os mesmos campos filtrados em CSV.
- **Criar usuário pela administração:** entre como `ADMIN`, abra **Usuários**, clique em **Criar usuário**, preencha os dados e a senha inicial e selecione `USUARIO` ou `ADMIN`. Essa tela também permite editar, desativar e redefinir senhas.
- Horários são digitados e exibidos no fuso local do navegador e transmitidos à API como instantes ISO; o banco armazena esses instantes em UTC.

## Testes e build

Na raiz:

```powershell
npm.cmd test --prefix backend
npm.cmd run build --prefix frontend
```

Os testes de integração com banco são opcionais e exigem o banco de desenvolvimento configurado, migrations aplicadas, Prisma gerado. Eles criam e removem somente registros de teste; não execute contra produção.

O projeto usa somente dados fictícios e mantém credenciais locais no `.env`, que não deve ser publicado. A implementação foi desenvolvida com apoio de assistentes de programação (GitHub Copilot/Copilot SDK); as funcionalidades específicas, integrações e validações foram implementadas e revisadas neste repositório.

```powershell
cd backend
$env:RUN_DB_TESTS='1'
npm.cmd test
Remove-Item Env:RUN_DB_TESTS
cd ..
```

Sem a variável, o teste de integração é marcado como ignorado. Os testes de validação e segurança continuam executando.

## Problemas comuns

| Sintoma | Como verificar |
| --- | --- |
| `npm.ps1` bloqueado | Use `npm.cmd` no PowerShell. |
| Erro ao conectar ao Docker | Abra o Docker Desktop e aguarde a inicialização. |
| `ECONNREFUSED` / `P1001` no banco | Execute `docker compose up -d --wait` em `backend`; confira host e porta da URL. |
| `P1000` / senha do PostgreSQL inválida | Confira senha, usuário e URL. Alterar o `.env` não troca as credenciais de um volume já inicializado. Use as credenciais existentes ou ajuste o usuário do PostgreSQL; não apague o volume para resolver esse erro se houver dados importantes. |
| Tabela inexistente / erro Prisma | Rode `db:generate` e `db:migrate` em `backend`, depois reinicie a API. |
| Login já cadastrado no primeiro admin | O script não redefine contas. Entre com a senha gravada ou solicite redefinição a outro administrador. |
| 400 ao entrar | Leia a mensagem exibida na tela. Confira usuário, senha e conexão com o banco. |
| 429 ao entrar/cadastrar | Aguarde a janela de 15 minutos do limitador; em desenvolvimento, reiniciar a API limpa os contadores em memória. |
| `/api` não responde | Confirme a API na porta 3000 e o frontend na 5173. |
| Porta 5173 ocupada | Encerre a outra instância do frontend; a porta é fixa. |
| Alterou o `.env`, mas nada mudou | Reinicie o backend. Variáveis de ambiente são lidas ao iniciar. |

## Estrutura e limites atuais

- `frontend/src/page/CalendarioView.jsx` e `CalendarioEventos.jsx`: calendário público e blocos de horários.
- `frontend/src/page/EventosView.jsx`: solicitação, acompanhamento e análise.
- `frontend/src/page/UsuariosView.jsx`: administração de usuários.
- `frontend/src/page/CadastroUsuarioView.jsx`: cadastro público.
- `backend/src/routes` e `backend/src/services`: APIs, autenticação e regras de reserva.
- `backend/prisma`: schema e histórico de migrations.
- `backend/scripts/criarAdmin.mjs`: criação explícita do primeiro administrador.

A criação de uma solicitação não dispara e-mails. A aprovação, recusa e acompanhamento acontecem na aplicação. Locais ainda são informados por nome; não há cadastro separado de espaços ou integração com o Portal do Aluno.

O build de produção fica em `frontend/dist`. A hospedagem deve servir esse diretório com fallback para `index.html` nas rotas `/login` e `/cadastro`, encaminhar `/api` ao backend e fornecer as variáveis de ambiente de produção. `npm run dev` serve ao desenvolvimento.

## Arquivos locais e Git

Os `.gitignore` excluem ambientes `.env*`, dependências, builds, logs, certificados e backups. Os modelos `.env.example`, lockfiles e migrations SQL continuam versionados. `frontend/.env.production` é configuração local; se necessário copie o modelo `frontend/.env.example`. Nunca coloque senhas ou credenciais em variáveis `VITE_*`, pois são incorporadas ao JavaScript público.

## Dados demonstrativos

Depois de criar o primeiro administrador, opcionalmente carregue exemplos:

```powershell
cd backend
npm.cmd run db:demo
```

São 6 eventos aprovados, 4 solicitações pendentes e 1 recusada, identificados com `[DEMO]` e espaços com sufixo `(demo)`. Eles usam o dia da primeira execução e os próximos dias. Atualize a página para visualizar os eventos; entre como administrador para ver as solicitações.

Executar o comando novamente não duplica os exemplos nem sobrescreve decisões já feitas. Para remover somente esses exemplos:

```powershell
npm.cmd run db:demo -- --limpar
```

O backend usa `node --watch` no desenvolvimento e reinicia quando seus arquivos importados mudam. Alterações de `.env` ainda precisam de reinício manual.

## Interface e temas

- O botão de sol/lua na faixa institucional alterna entre modo claro e escuro. No primeiro acesso é usada a preferência do sistema; a escolha manual é salva no navegador.
- O tema abrange calendário, formulários, usuários, dropdowns, cartões de detalhes e rodapé.
- Na visão mensal, clique no evento para abrir o cartão flutuante com descrição, local e horários; clique fora ou pressione Esc para fechar.
- A análise de solicitações começa pelas pendentes, da mais antiga à mais recente. Aprovar ou recusar atualiza o item sem recarregar a página.
- O rodapé usa a estrutura e os links institucionais do site Seja Univille. Os arquivos visuais estão salvos no projeto.
