const BASE_URL = import.meta.env.VITE_API_URL || '/api';
try { localStorage.removeItem('univille:token'); } catch { /* JWT legado */ }
let aoPerderSessao = null;
export function aoExpirarSessao(callback) { aoPerderSessao = callback; }
async function req(path, method = 'GET', body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401 && !['/auth/me', '/auth/login', '/auth/cadastro'].includes(path)) aoPerderSessao?.();
  return { data: await res.json(), ok: res.ok };
}
export const api = {
  sair: () => req('/auth/sair', 'POST'),
  cadastrar: (dados) => req('/auth/cadastro', 'POST', dados),
  getEventos: () => req('/eventos'),
  getMinhasSolicitacoes: () => req('/eventos/minhas-solicitacoes'),
  getSolicitacoes: () => req('/eventos/solicitacoes'),
  solicitarEvento: (dados) => req('/eventos/solicitacoes', 'POST', dados),
  decidirEvento: (id, status, motivo) => req(`/eventos/solicitacoes/${id}/decisao`, 'PATCH', { status, motivo }),
  login: (login, senha) => req('/auth/login', 'POST', { login, senha }),
  criarSenha: (login, novaSenha) => req('/auth/criar-senha', 'POST', { login, novaSenha }),
  alterarSenha: (senhaAtual, novaSenha) => req('/auth/alterar-senha', 'POST', { senhaAtual, novaSenha }),
  getSessao: () => req('/auth/me'),
  getUsuarios: () => req('/usuarios'),
  getSetores: () => req('/usuarios/setores'),
  criarUsuario: (dados) => req('/usuarios', 'POST', dados),
  atualizarUsuario: (id, dados) => req(`/usuarios/${id}`, 'PUT', dados),
  definirSenhaUsuario: (id, novaSenha) => req(`/usuarios/${id}/senha`, 'PUT', { novaSenha }),
};
