import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { prisma } from '../src/prisma.js';
import { hashSessao } from '../src/services/sessaoService.js';
import eventoRoutes from '../src/routes/eventoRoutes.js';
import authRoutes from '../src/routes/authRoutes.js';
import usuarioRoutes from '../src/routes/usuarioRoutes.js';
import { autenticar, exigirSetor } from '../src/middlewares/autenticar.js';

test('fluxo de solicitações: privacidade pública, permissões e aprovação concorrente sem sobreposição', { skip: process.env.RUN_DB_TESTS !== '1' }, async () => {
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  const cookies = [];
  let server;
  try {
    const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, create: { name: 'ADMIN' }, update: {} });
    const userRole = await prisma.role.upsert({ where: { name: 'USUARIO' }, create: { name: 'USUARIO' }, update: {} });
    for (const [indice, id] of ids.entries()) await prisma.user.create({ data: {
      id, name: 'Teste integração', login: id, email: id + '@teste.invalid', roleId: indice === 0 ? adminRole.id : userRole.id,
    } });
    for (const id of ids) {
      const valor = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '');
      await prisma.sessao.create({ data: { id: hashSessao(valor), usuarioId: id, expiraEm: new Date(Date.now() + 3600000) } });
      cookies.push('univille.sid=' + valor);
    }
    const app = express();
    app.use(express.json()); app.use('/eventos', eventoRoutes);
    app.use('/auth', authRoutes);
    app.use('/usuarios', autenticar, exigirSetor('ADMIN'), usuarioRoutes);
    app.use((e, _req, res, _next) => res.status(500).json({ error: e.message }));
    await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
    const req = async (path, method = 'GET', body, indice) => {
      const rota = path.startsWith('/auth') || path.startsWith('/usuarios') ? path : '/eventos' + path;
      const res = await fetch(`http://127.0.0.1:${server.address().port}${rota}`, {
        method, headers: { 'Content-Type': 'application/json', ...(indice === undefined ? {} : { Cookie: cookies[indice] }) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: res.status, data: await res.json(), cookie: res.headers.get('set-cookie') };
    };
    assert.equal((await req('')).status, 200);
    assert.equal((await req('/solicitacoes')).status, 401);
    assert.equal((await req('/solicitacoes', 'GET', null, 1)).status, 403);
    const login = 'teste' + randomUUID().replaceAll('-', '').slice(0, 20);
    const cadastro = await req('/auth/cadastro', 'POST', { nome: 'Conta pública teste', login, email: login + '@teste.invalid', senha: 'Teste1234!', setor: 'ADMIN', ativo: true });
    assert.equal(cadastro.status, 201);
    ids.push(cadastro.data.usuario.id);
    cookies.push(cadastro.cookie.split(';')[0]);
    assert.match(cadastro.cookie, /HttpOnly/i);
    assert.match(cadastro.cookie, /SameSite=Lax/i);
    assert.equal(cadastro.data.token, undefined);
    assert.equal(cadastro.data.usuario.setor, 'USUARIO');
    assert.equal((await req('/usuarios', 'GET', null, 3)).status, 403);
    assert.equal((await req('/auth/login', 'POST', { login, senha: 'Teste1234!' })).status, 200);
    assert.equal((await req('/auth/me', 'GET', null, 3)).status, 200);
    assert.equal((await req('/auth/sair', 'POST', null, 3)).status, 200);
    assert.equal((await req('/auth/me', 'GET', null, 3)).status, 401);
    assert.equal((await req('/auth/cadastro', 'POST', { nome: 'Duplicado', login, email: login + '@teste.invalid', senha: 'Teste1234!' })).status, 400);
    const novoUsuario = await req('/usuarios', 'POST', { nome: 'Conta criada pelo admin', login: login + 'adm', email: login + 'adm@teste.invalid', senha: 'Teste1234!', setor: 'USUARIO' }, 0);
    assert.equal(novoUsuario.status, 201);
    ids.push(novoUsuario.data.id);
    const inicio = new Date(Date.now() + 3 * 86400000);
    const dados = { titulo: 'Evento de teste', local: 'Espaço teste ' + ids[0], descricao: 'Descrição pública', tema: 'Tema de teste', palestrante: 'Palestrante teste', solicitanteTexto: 'Solicitante teste', publicoAlvo: 'Comunidade', justificativa: 'Justificativa privada', objetivo: 'Objetivo de teste', cerimonial: false, haveraInscricoes: false, necessidadeDeclaracoes: false, inicio: inicio.toISOString(), fim: new Date(+inicio + 3600000).toISOString(), status: 'APROVADO' };
    assert.equal((await req('/solicitacoes', 'POST', dados)).status, 401);
    const a = await req('/solicitacoes', 'POST', dados, 1);
    const b = await req('/solicitacoes', 'POST', dados, 2);
    assert.equal(a.status, 201); assert.equal(a.data.status, 'PENDENTE');
    assert.equal((await req('')).data.some((e) => e.id === a.data.id), false);
    const minhas = (await req('/minhas-solicitacoes', 'GET', null, 1)).data;
    assert.deepEqual(minhas.map((e) => e.id), [a.data.id]);
    const fila = (await req('/solicitacoes', 'GET', null, 0)).data;
    assert(fila.every((e, i) => i === 0 || new Date(fila[i - 1].criadoEm) <= new Date(e.criadoEm)));
    assert.equal((await req(`/solicitacoes/${a.data.id}/decisao`, 'PATCH', { status: 'APROVADO' }, 1)).status, 403);
    const decisoes = await Promise.all([a, b].map((e) => req(`/solicitacoes/${e.data.id}/decisao`, 'PATCH', { status: 'APROVADO' }, 0)));
    assert.deepEqual(decisoes.map((d) => d.status).sort(), [200, 400]);
    const aprovado = decisoes.find((d) => d.status === 200).data;
    const recusado = aprovado.id === a.data.id ? b.data : a.data;
    const publico = (await req('')).data.find((e) => e.id === aprovado.id);
    assert.deepEqual(Object.keys(publico).sort(), ['ambienteId', 'cursoId', 'descricao', 'fim', 'id', 'inicio', 'local', 'palestrante', 'tema', 'temaId', 'titulo']);
    assert.equal((await req(`/solicitacoes/${aprovado.id}/decisao`, 'PATCH', { status: 'RECUSADO', motivo: 'teste' }, 0)).status, 400);
    assert.equal((await req(`/solicitacoes/${recusado.id}/decisao`, 'PATCH', { status: 'RECUSADO' }, 0)).status, 400);
    assert.equal((await req(`/solicitacoes/${recusado.id}/decisao`, 'PATCH', { status: 'RECUSADO', motivo: 'Horário indisponível' }, 0)).status, 200);
    const adjacente = await req('/solicitacoes', 'POST', { ...dados, inicio: dados.fim, fim: new Date(+inicio + 7200000).toISOString() }, 1);
    assert.equal((await req(`/solicitacoes/${adjacente.data.id}/decisao`, 'PATCH', { status: 'APROVADO' }, 0)).status, 200);

    const dono = aprovado.id === a.data.id ? 1 : 2;
    const outro = dono === 1 ? 2 : 1;
    assert.equal((await req(`/solicitacoes/${aprovado.id}`, 'PUT', { ...dados, titulo: 'Edição sem permissão' }, outro)).status, 400);
    assert.equal((await req('')).data.some((e) => e.id === aprovado.id), true);
    const editado = await req(`/solicitacoes/${aprovado.id}`, 'PUT', { ...dados, titulo: 'Palestra revisada', revisorId: ids[0], decididoEm: new Date().toISOString() }, dono);
    assert.equal(editado.status, 200);
    assert.equal(editado.data.status, 'PENDENTE');
    assert.equal(editado.data.revisorId, null);
    assert.equal(editado.data.decididoEm, null);
    assert.equal(editado.data.motivo, null);
    assert.equal((await req('')).data.some((e) => e.id === aprovado.id), false);
    assert.equal((await req(`/solicitacoes/${aprovado.id}/decisao`, 'PATCH', { status: 'APROVADO' }, dono)).status, 403);
    assert.equal((await req(`/solicitacoes/${aprovado.id}/decisao`, 'PATCH', { status: 'APROVADO' }, 0)).status, 200);
    assert.equal((await req('')).data.find((e) => e.id === aprovado.id).titulo, 'Palestra revisada');
    const edicaoAdmin = await req(`/${aprovado.id}`, 'PUT', { ...dados, titulo: 'Revisão administrativa' }, 0);
    assert.equal(edicaoAdmin.status, 200);
    assert.equal(edicaoAdmin.data.status, 'PENDENTE');
    assert.equal(edicaoAdmin.data.revisorId, null);
    assert.equal((await req('')).data.some((e) => e.id === aprovado.id), false);
    assert.equal((await req(`/solicitacoes/${aprovado.id}/decisao`, 'PATCH', { status: 'RECUSADO', motivo: 'Revisar alterações' }, 0)).status, 200);
    assert.equal((await req('')).data.some((e) => e.id === aprovado.id), false);
  } finally {
    if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
    await prisma.evento.deleteMany({ where: { solicitanteId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
});
