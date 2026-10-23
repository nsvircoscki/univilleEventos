import { prisma } from '../src/prisma.js';

const exemplos = [
  ['integracao', 'Recepção e integração', 'Auditório Central', 0, 9, 0, 10, 30, 'APROVADO'],
  ['pesquisa', 'Encontro de pesquisa', 'Sala de reuniões A', 0, 13, 0, 15, 0, 'APROVADO'],
  ['oficina', 'Oficina de projetos', 'Laboratório de informática', 0, 14, 0, 16, 0, 'APROVADO'],
  ['conselho', 'Reunião do conselho acadêmico', 'Sala de reuniões A', 1, 10, 0, 11, 30, 'APROVADO'],
  ['cultura', 'Mostra cultural', 'Auditório Central', 2, 14, 0, 17, 0, 'APROVADO'],
  ['palestra', 'Palestra de inovação', 'Auditório Central', 3, 9, 0, 11, 0, 'APROVADO'],
  ['extensao', 'Seminário de extensão', 'Auditório Central', 4, 9, 0, 12, 0, 'PENDENTE'],
  ['estudantes', 'Encontro de estudantes', 'Sala de reuniões B', 2, 14, 0, 16, 0, 'PENDENTE'],
  ['formacao', 'Formação de equipes', 'Laboratório de informática', 3, 8, 30, 10, 30, 'PENDENTE'],
  ['visita', 'Visita guiada ao campus', 'Recepção do campus', 5, 10, 0, 12, 0, 'PENDENTE'],
  ['recusado', 'Reserva de auditório', 'Auditório Central', 3, 9, 30, 10, 30, 'RECUSADO'],
];
const idDemo = (chave) => 'demo-univille-' + chave;
try {
  if (process.argv.includes('--limpar')) {
    const resultado = await prisma.evento.deleteMany({ where: { id: { in: exemplos.map(([chave]) => idDemo(chave)) } } });
    console.log(`${resultado.count} registros demonstrativos removidos. Nenhum outro registro foi alterado.`);
  } else {
    const admin = await prisma.user.findFirst({ where: { ativo: true, role: { name: 'ADMIN' } }, orderBy: { login: 'asc' } });
    if (!admin) throw new Error('Crie o primeiro administrador com npm run db:admin antes de carregar os exemplos.');
    const hoje = new Date();
    for (const [chave, titulo, localBase, dias, hi, mi, hf, mf, status] of exemplos) {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias, hi, mi);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias, hf, mf);
      const local = localBase + ' (demo)';
      await prisma.evento.upsert({ where: { id: idDemo(chave) }, update: {}, create: {
        id: idDemo(chave), titulo: '[DEMO] ' + titulo, local,
        localChave: local.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' '),
        descricao: 'Exemplo demonstrativo para avaliar a agenda. Não representa uma reserva real.',
        inicio, fim, status, solicitanteId: admin.id,
        ...(status !== 'PENDENTE' ? { revisorId: admin.id, decididoEm: hoje } : {}),
        ...(status === 'RECUSADO' ? { motivo: 'Exemplo de recusa: o espaço já está reservado neste horário.' } : {}),
      } });
    }
    console.log('Exemplos disponíveis: 6 eventos aprovados, 4 solicitações pendentes e 1 recusada. Registros existentes foram preservados.');
  }
} catch (erro) { console.error(erro.message); process.exitCode = 1; }
finally { await prisma.$disconnect(); }
