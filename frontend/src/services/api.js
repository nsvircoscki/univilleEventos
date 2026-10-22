const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CHAVE_TOKEN = 'univille:token';
let tokenAtual = localStorage.getItem(CHAVE_TOKEN);
let aoPerderSessao = null;
export function definirToken(token) {
  tokenAtual = token || null;
  if (tokenAtual) localStorage.setItem(CHAVE_TOKEN, tokenAtual);
  else localStorage.removeItem(CHAVE_TOKEN);
}
export const temToken = () => Boolean(tokenAtual);
export function aoExpirarSessao(callback) { aoPerderSessao = callback; }
async function req(path, method = 'GET', body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401 && tokenAtual) aoPerderSessao?.();
  return { data: await res.json(), ok: res.ok };
}
export const api = {
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
