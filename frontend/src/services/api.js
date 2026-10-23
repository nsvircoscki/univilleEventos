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
  if (res.status === 401 && !['/auth/me', '/auth/login'].includes(path)) aoPerderSessao?.();
  return { data: await res.json(), ok: res.ok };
}
export const api = {
  sair: () => req('/auth/sair', 'POST'),
  getEventos: () => req('/eventos'),
  verificarDisponibilidade: (ambienteId, inicio, fim, ignorarId = '') => {
    const params = new URLSearchParams({ ambienteId, inicio, fim, ...(ignorarId ? { ignorarId } : {}) });
    return req(`/eventos/disponibilidade?${params}`);
  },
  getMinhasSolicitacoes: () => req('/eventos/minhas-solicitacoes'),
  getSolicitacoes: () => req('/eventos/solicitacoes'),
  solicitarEvento: (dados) => req('/eventos/solicitacoes', 'POST', dados),
  salvarRascunho: (dados) => req('/eventos/rascunhos', 'POST', dados),
  atualizarSolicitacao: (id, dados) => req(`/eventos/solicitacoes/${id}`, 'PUT', dados),
  enviarRascunho: (id, dados) => req(`/eventos/solicitacoes/${id}/enviar`, 'PATCH', dados),
  excluirRascunho: (id) => req(`/eventos/solicitacoes/${id}`, 'DELETE'),
  cancelarSolicitacao: (id) => req(`/eventos/solicitacoes/${id}/cancelar`, 'PATCH'),
  cancelarEventoAdmin: (id) => req(`/eventos/solicitacoes/${id}/cancelar-admin`, 'PATCH'),
  relatorio: (tipo, filtros = {}) => {
    const params = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor));
    return fetch(`${BASE_URL}/usuarios/relatorios/${tipo}${params.toString() ? `?${params}` : ''}`, { credentials: 'include' });
  },
  consultarRelatorio: (tipo, filtros = {}) => {
    const params = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor));
    return req(`/usuarios/relatorios/${tipo}/dados${params.toString() ? `?${params}` : ''}`);
  },
  getRelatorioFiltros: () => Promise.all([req('/cadastros/temas'), req('/cadastros/cursos')]),
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
  getCadastros: (tipo) => req(`/cadastros/${tipo}`),
  criarCadastro: (tipo, dados) => req(`/cadastros/${tipo}`, 'POST', dados),
  atualizarCadastro: (tipo, id, dados) => req(`/cadastros/${tipo}/${id}`, 'PUT', dados),
  excluirCadastro: (tipo, id) => req(`/cadastros/${tipo}/${id}`, 'DELETE'),
};
