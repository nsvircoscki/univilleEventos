import { prisma } from '../prisma.js';
import { idSessao } from '../services/sessaoService.js';

export async function autenticar(req, res, next) {
  const id = idSessao(req);
  if (!id) return res.status(401).json({ error: 'Sessão ausente. Faça login.' });
  try {
    const sessao = await prisma.sessao.findUnique({ where: { id }, include: { usuario: { include: { role: true } } } });
    if (!sessao || sessao.expiraEm <= new Date() || !sessao.usuario.ativo) {
      return res.status(401).json({ error: 'Sessão expirada ou usuário inativo. Entre novamente.' });
    }
    const usuario = sessao.usuario;
    req.usuario = { id: usuario.id, nome: usuario.name, setor: usuario.role.name };
    next();
  } catch (erro) { next(erro); }
}
export function exigirSetor(...setores) {
  return (req, res, next) => {
    if (!req.usuario || !setores.includes(req.usuario.setor)) return res.status(403).json({ error: 'Sem permissão para esta ação.' });
    next();
  };
}
export async function tentarAutenticar(req, _res, next) {
  if (!idSessao(req)) return next();
  try {
    const sessao = await prisma.sessao.findUnique({ where: { id: idSessao(req) }, include: { usuario: { include: { role: true } } } });
    if (sessao && sessao.expiraEm > new Date() && sessao.usuario.ativo) {
      req.usuario = { id: sessao.usuario.id, nome: sessao.usuario.name, setor: sessao.usuario.role.name };
    }
    next();
  } catch (erro) { next(erro); }
}
