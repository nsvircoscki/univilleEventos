import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../prisma.js';

const COOKIE = 'univille.sid';
const DURACAO = 12 * 60 * 60 * 1000;
const opcoes = () => ({ httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
export const hashSessao = (valor) => createHash('sha256').update(valor).digest('hex');
export function idSessao(req) {
  const valor = (req.headers.cookie || '').split(';').map((p) => p.trim()).find((p) => p.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(valor || '') ? hashSessao(valor) : null;
}
export async function iniciarSessao(req, res, usuarioId) {
  const valor = randomBytes(32).toString('hex');
  const idAnterior = idSessao(req);
  await prisma.sessao.deleteMany({ where: { OR: [{ expiraEm: { lt: new Date() } }, ...(idAnterior ? [{ id: idAnterior }] : [])] } });
  await prisma.sessao.create({ data: { id: hashSessao(valor), usuarioId, expiraEm: new Date(Date.now() + DURACAO) } });
  res.cookie(COOKIE, valor, { ...opcoes(), maxAge: DURACAO });
}
export async function encerrarSessao(req, res) {
  const id = idSessao(req);
  if (id) await prisma.sessao.deleteMany({ where: { id } });
  res.clearCookie(COOKIE, opcoes());
}
