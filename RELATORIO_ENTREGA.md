# Relatório de entrega — Agenda de eventos Univille

Data: 23/10/2026.

As alterações estão locais em `C:\Users\HP\Documents\Univille\Univille`. Não foi criado commit nem executado push nesta entrega.

## Funcionalidades implementadas

### Calendário público

- Abre como tela inicial sem exigir login.
- Visualizações de dia, semana, mês e ano, com navegação de períodos e botão Hoje.
- Mini calendário lateral e indicação de eventos.
- Eventos aprovados aparecem em blocos de horário nas visões diária/semanal e em itens na visão mensal.
- Clique no evento abre um cartão flutuante com título, local, início, término e descrição. Fecha por Esc, botão ou clique fora.
- A descrição aprovada é pública; dados pessoais do solicitante e solicitações pendentes/recusadas não são expostos pela consulta pública.
- Removidos o campo “Ir para uma data”, a palavra UNIVILLE acima do título e o aviso de aprovação no cartão público.

### Acesso e usuários

- Entrar/Sair no canto superior direito da faixa institucional.
- Login em `/login` e cadastro em `/cadastro`, sem botão de retorno ao calendário na página de login.
- Login ou cadastro concluído redireciona ao calendário autenticado.
- Cadastro público gera exclusivamente perfil `USUARIO`. O navegador não pode escolher ou elevar o perfil.
- Administração permite criar usuários, atribuir perfis, editar, desativar e redefinir senha.
- Senhas continuam armazenadas com hash bcrypt.
- JWT removido, incluindo a dependência `jsonwebtoken`.
- Sessões de 12 horas armazenadas no PostgreSQL; cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Identificador do cookie armazenado somente como hash no banco; logout invalida a sessão.
- O frontend remove o JWT legado do `localStorage`. `JWT_SECRET` não é mais utilizado.

### Solicitações de eventos

- Formulário de título, local, início, término e descrição.
- Apenas usuários autenticados podem solicitar.
- Tela de acompanhamento das próprias solicitações.
- Tela administrativa para aprovar ou recusar; recusa exige motivo.
- Pendentes ordenadas da mais antiga para a mais recente.
- Decisão atualiza o item em memória, sem recarregar a página ou buscar novamente toda a lista.
- Apenas a consulta de eventos do calendário é atualizada depois da decisão.
- Validação de campos, datas futuras e término posterior ao início.
- Aprovação impede sobreposição no mesmo espaço, inclusive com decisões simultâneas.
- Eventos consecutivos, sem sobreposição, são permitidos.

### Interface

- Paleta institucional, logos oficiais e fonte existente preservada.
- Faixa superior com logo centralizado.
- Navegação em abas com ícones, conforme a referência enviada.
- Mesmo ícone para solicitar evento na navbar e no botão do calendário.
- Introdução de 1 segundo.
- Login baseado no portal educacional da Univille.
- Rodapé baseado no site Seja Univille, com links oficiais, contatos, redes sociais e elementos institucionais locais.
- Dropdowns padronizados para status e perfil, com seleção, foco, teclado e fechamento por Esc/clique fora.
- Modos claro e escuro para calendário, formulários, usuários, login, cadastro, dropdowns, cartões e rodapé.
- Tema inicial acompanha o sistema; escolha manual fica salva no navegador.
- Verificação em desktop e telas móveis de 390 e 320 px.

## Banco e execução

Duas migrations novas:

1. `20261023000000_eventos`: tabela de eventos, estados, relacionamentos e índices.
2. `20261023010000_sessoes`: sessões persistentes no banco.

As migrations foram aplicadas no banco local. O PostgreSQL da Univille segue separado na porta 5433.

O backend de desenvolvimento usa `node --watch`. A instância antiga da API, que respondia 404 para as novas rotas, foi substituída por uma instância com o código atual.

O script `npm run db:demo` cria ou preserva 11 exemplos identificados com `[DEMO]`: inicialmente 6 aprovados, 4 pendentes e 1 recusado. São dados locais, não fazem parte das migrations e não serão enviados ao GitHub. Para remover somente esses exemplos:

```powershell
cd backend
npm.cmd run db:demo -- --limpar
```

## Documentação e Git

- README refeito com instalação do zero, dependências, Docker, arquivo de ambiente, migrations, primeiro administrador, execução diária e resolução de erros comuns.
- Incluídos fluxos, perfis, sessões sem JWT, testes, exemplos, temas e configuração de produção.
- Modelos `backend/.env.example` e `frontend/.env.example` disponíveis.
- `.gitignore` atualizado na raiz, backend e frontend: ignora ambientes, dependências, builds, logs, certificados e backups.
- `frontend/.env.production` retirado do índice Git, mas preservado localmente. Sua remoção do versionamento está preparada no índice; não houve exclusão do arquivo local.
- Migrations SQL, lockfiles e modelos de configuração continuam versionados.
- Repositório atual: `https://github.com/nsvircoscki/univilleEventos.git`.
- Branch atual: `main`.

## Validação realizada

- Build do frontend concluído.
- 6 testes de backend aprovados, incluindo integração com PostgreSQL.
- Cobertos cadastro público sem elevação de privilégio, criação administrativa de usuário, login, cookie HttpOnly, logout, privacidade pública, permissões, validação, ordem da fila e aprovação concorrente.
- Fluxo real no navegador: cadastro, entrada, solicitação, aprovação, publicação, administração, saída e restauração após recarregar.
- Confirmado que decidir uma solicitação não refaz a consulta da lista e preserva a tela existente.
- Dropdowns conferidos com mouse e teclado.
- Cartão mensal conferido com descrição real, Esc, clique fora e tela de 320 px.
- Temas claro/escuro conferidos em calendário, rodapé, login e usuários; preferência persistida.
- Instalação em banco temporário vazio validada: migrations, eventos, sessões, perfis, criação do primeiro administrador e recusa de sobrescrita, sem depender de JWT_SECRET.
- Registros temporários de teste removidos; exemplos demonstrativos preservados.

## Para atualizar outra instalação existente

Na raiz, após obter os arquivos:

```powershell
npm.cmd ci
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
cd backend
docker compose up -d --wait
npm.cmd run db:generate
npm.cmd run db:migrate
cd ..
npm.cmd run dev
```

As sessões antigas por JWT deixam de funcionar: usuários precisarão entrar novamente. Para uma máquina nova, siga o README, incluindo o comando `db:admin`.

## Publicação no GitHub pelo responsável

Revise os arquivos antes do commit. Os comandos abaixo são sugestões para executar manualmente na raiz deste repositório:

```powershell
git status
git diff --check
git add .
git diff --cached --stat
git diff --cached --name-only
git commit -m "Implementa agenda publica com solicitacoes sessoes e temas"
git push origin main
```

Confirme que nenhum `.env`, backup ou credencial aparece na lista preparada para commit. Os `.env.example` são modelos e devem entrar.

Título sugerido do commit/PR: **Implementa calendário público e fluxo de reservas da Univille**.

Descrição sugerida:

> Disponibiliza calendário público com quatro visualizações, cadastro e login por sessão, solicitações de eventos e aprovação administrativa sem recarregar a lista. Inclui identidade Univille, temas claro/escuro, rodapé, dropdowns, migrations, exemplos e documentação de instalação.
>
> Validação: build do frontend, 6 testes de backend, integração com PostgreSQL, fluxo real no navegador e instalação em banco vazio.

## Limites atuais

- Os locais são informados por nome, sem cadastro separado de espaços; use nomes consistentes.
- A aplicação não envia e-mails de confirmação ou recuperação.
- O login é próprio da agenda, sem integração de autenticação com o Portal do Aluno.
- Em produção, usar HTTPS, `NODE_ENV=production`, origens autorizadas e proxy de `/api`. Servir o frontend com fallback para `index.html` nas páginas de acesso.
