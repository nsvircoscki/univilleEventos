import { prisma } from '../prisma.js';

const texto = (valor, campo, max, obrigatorio = true) => {
  if (typeof valor !== 'string' || (obrigatorio && !valor.trim()) || valor.trim().length > max) {
    throw new Error(`${campo}: informe um texto${obrigatorio ? ' obrigatório' : ''} com até ${max} caracteres.`);
  }
  return valor.trim();
};
export function validarSolicitacao(dados = {}) {
  const titulo = texto(dados.titulo, 'Título', 120);
  const local = texto(dados.local, 'Espaço', 120);
  const descricao = texto(dados.descricao ?? '', 'Descrição', 3000, false);
  const inicio = new Date(typeof dados.inicio === 'string' ? dados.inicio : NaN);
  const fim = new Date(typeof dados.fim === 'string' ? dados.fim : NaN);
  if (!Number.isFinite(+inicio) || !Number.isFinite(+fim) || fim <= inicio) throw new Error('Informe início e término válidos; o término deve ser depois do início.');
  if (inicio < new Date()) throw new Error('Escolha um horário de início futuro.');
  return { titulo, local, descricao, inicio, fim, localChave: local.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ') };
}
const incluirPessoas = {
  solicitante: { select: { id: true, name: true, email: true } },
  revisor: { select: { name: true } },
};
export const eventoService = {
  listarPublicos() {
    return prisma.evento.findMany({ where: { status: 'APROVADO' },
      select: { id: true, titulo: true, descricao: true, local: true, inicio: true, fim: true }, orderBy: { inicio: 'asc' } });
  },
  solicitar(dados, solicitanteId) {
    return prisma.evento.create({ data: { ...validarSolicitacao(dados), solicitanteId } });
  },
  listarSolicitacoes(solicitanteId) {
    return prisma.evento.findMany({ where: solicitanteId ? { solicitanteId } : {}, include: incluirPessoas, orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }] });
  },
  async decidir(id, dados = {}, revisorId) {
    if (!['APROVADO', 'RECUSADO'].includes(dados.status)) throw new Error('Escolha aprovar ou recusar.');
    const motivo = texto(dados.motivo ?? '', 'Motivo', 1000, dados.status === 'RECUSADO');
    return prisma.$transaction(async (tx) => {
      const inicial = await tx.evento.findUnique({ where: { id } });
      if (!inicial) throw new Error('Solicitação não encontrada.');
      // Serializa decisões por espaço, inclusive entre processos da API.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${inicial.localChave}))`;
      const evento = await tx.evento.findUnique({ where: { id } });
      if (evento.status !== 'PENDENTE') throw new Error('Esta solicitação já foi analisada.');
      if (dados.status === 'APROVADO') {
        if (evento.inicio < new Date()) throw new Error('O início deste evento já passou.');
        const conflito = await tx.evento.findFirst({ where: { status: 'APROVADO', localChave: evento.localChave,
          inicio: { lt: evento.fim }, fim: { gt: evento.inicio } } });
        if (conflito) throw new Error('Já existe um evento aprovado neste espaço e horário.');
      }
      return tx.evento.update({ where: { id }, data: { status: dados.status, motivo: motivo || null, revisorId, decididoEm: new Date() } });
    });
  },
};
