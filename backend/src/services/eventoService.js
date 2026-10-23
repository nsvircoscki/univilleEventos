import { prisma } from '../prisma.js';

const texto = (valor, campo, max, obrigatorio = true) => {
  if (typeof valor !== 'string' || (obrigatorio && !valor.trim()) || valor.trim().length > max) {
    throw new Error(`${campo}: informe um texto${obrigatorio ? ' obrigatório' : ''} com até ${max} caracteres.`);
  }
  return valor.trim();
};
export function validarSolicitacao(dados = {}, completa = false) {
  const titulo = texto(dados.titulo, 'Título', 120);
  const local = texto(dados.local, 'Espaço', 120);
  const descricao = texto(dados.descricao ?? '', 'Descrição', 3000, false);
  const campoObrigatorio = (valor, campo, max) => completa ? texto(valor, campo, max) : texto(valor ?? '', campo, max, false);
  const tema = campoObrigatorio(dados.tema, 'Tema', 200);
  const palestrante = campoObrigatorio(dados.palestrante, 'Palestrante', 200);
  const solicitanteTexto = campoObrigatorio(dados.solicitanteTexto, 'Solicitante', 200);
  const publicoAlvo = campoObrigatorio(dados.publicoAlvo, 'Público-alvo', 500);
  const justificativa = campoObrigatorio(dados.justificativa, 'Justificativa', 3000);
  const objetivo = campoObrigatorio(dados.objetivo, 'Objetivo', 3000);
  const recursosNecessarios = texto(dados.recursosNecessarios ?? '', 'Recursos necessários', 2000, false);
  const observacoes = texto(dados.observacoes ?? '', 'Observações', 3000, false);
  const inicio = new Date(typeof dados.inicio === 'string' ? dados.inicio : NaN);
  const fim = new Date(typeof dados.fim === 'string' ? dados.fim : NaN);
  if (!Number.isFinite(+inicio) || !Number.isFinite(+fim) || fim <= inicio) throw new Error('Informe início e término válidos; o término deve ser depois do início.');
  if (inicio < new Date()) throw new Error('A data do evento não pode estar no passado.');
  const booleano = (valor, campo) => {
    if (typeof valor !== 'boolean') {
      if (!completa && valor === undefined) return false;
      throw new Error(`${campo}: informe sim ou não.`);
    }
    return valor;
  };
  return {
    titulo, local, descricao, tema, palestrante, solicitanteTexto, publicoAlvo, justificativa, objetivo,
    cerimonial: booleano(dados.cerimonial, 'Cerimonial'),
    haveraInscricoes: booleano(dados.haveraInscricoes, 'Haverá inscrições'),
    necessidadeDeclaracoes: booleano(dados.necessidadeDeclaracoes, 'Necessidade de declarações'),
    recursosNecessarios, observacoes, inicio, fim,
    localChave: local.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' '),
    ambienteId: dados.ambienteId || null, temaId: dados.temaId || null, cursoId: dados.cursoId || null,
    centroCusto: dados.centroCusto || '',
  };
}
async function validarRelacionamentos(dados) {
  if (dados.ambienteId) {
    const ambiente = await prisma.ambiente.findUnique({ where: { id: dados.ambienteId }, include: { recursos: true } });
    if (!ambiente) throw new Error('O ambiente selecionado não existe.');
    if (dados.recursos?.some((id) => !ambiente.recursos.some((item) => item.recursoId === id))) {
      throw new Error('Há recurso não disponível no ambiente selecionado.');
    }
  }
  if (dados.temaId && !(await prisma.tema.findUnique({ where: { id: dados.temaId } }))) throw new Error('O tema selecionado não existe.');
  if (dados.cursoId) {
    const curso = await prisma.curso.findUnique({ where: { id: dados.cursoId } });
    if (!curso) throw new Error('O curso/coordenação selecionado não existe.');
    dados.centroCusto = curso.centroCusto;
  }
}
async function aplicarAmbiente(dados) {
  if (!dados.ambienteId) return dados;
  const ambiente = await prisma.ambiente.findUnique({ where: { id: dados.ambienteId }, select: { nome: true } });
  if (!ambiente) throw new Error('O ambiente selecionado não existe.');
  return { ...dados, local: ambiente.nome };
}
async function validarConflitoComAprovado(dados, ignorarId = null) {
  const conflito = await prisma.evento.findFirst({
    where: {
      status: 'APROVADO',
      localChave: dados.localChave,
      inicio: { lt: dados.fim },
      fim: { gt: dados.inicio },
      ...(ignorarId ? { id: { not: ignorarId } } : {}),
    },
  });
  if (conflito) throw new Error('Já existe um evento aprovado neste ambiente e horário.');
}
async function verificarDisponibilidade(dados) {
  const ambiente = await prisma.ambiente.findUnique({ where: { id: dados.ambienteId }, select: { nome: true } });
  if (!ambiente) throw new Error('O ambiente selecionado não existe.');
  const inicio = new Date(dados.inicio);
  const fim = new Date(dados.fim);
  if (!Number.isFinite(+inicio) || !Number.isFinite(+fim) || fim <= inicio) {
    throw new Error('Informe um intervalo de horário válido.');
  }
  const localChave = ambiente.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');
  const conflito = await prisma.evento.findFirst({
    where: {
      status: 'APROVADO',
      localChave,
      inicio: { lt: fim },
      fim: { gt: inicio },
      ...(dados.ignorarId ? { id: { not: dados.ignorarId } } : {}),
    },
    select: { titulo: true, inicio: true, fim: true },
  });
  return conflito
    ? { disponivel: false, conflito: { titulo: conflito.titulo, inicio: conflito.inicio, fim: conflito.fim } }
    : { disponivel: true };
}
const incluirPessoas = {
  solicitante: { select: { id: true, name: true, email: true } },
  revisor: { select: { name: true } },
  temaRef: { select: { id: true, nome: true } },
  ambiente: { include: { recursos: { include: { recurso: true } } } },
  curso: { select: { id: true, nome: true, centroCusto: true } },
  recursos: { include: { recurso: true } },
};
export const eventoService = {
  verificarDisponibilidade,
  listarPublicos(usuario) {
    if (usuario) return prisma.evento.findMany({ where: { status: 'APROVADO' },
      select: { id: true, titulo: true, tema: true, palestrante: true, descricao: true, local: true, inicio: true, fim: true, temaId: true, ambienteId: true, cursoId: true }, orderBy: { inicio: 'asc' } });
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fim = new Date(agora.getFullYear(), agora.getMonth() + 3, 1);
    return prisma.evento.findMany({ where: { status: 'APROVADO', inicio: { lt: fim }, fim: { gt: inicio } },
      select: { id: true, titulo: true, tema: true, palestrante: true, descricao: true, local: true, inicio: true, fim: true, temaId: true, ambienteId: true, cursoId: true }, orderBy: { inicio: 'asc' } });
  },
  async salvar(dados, solicitanteId, status = 'RASCUNHO') {
    dados = await aplicarAmbiente(dados);
    const campos = status === 'RASCUNHO' && !dados.titulo?.trim()
      ? { titulo: '', local: '', descricao: '', tema: '', palestrante: '', solicitanteTexto: '', publicoAlvo: '', justificativa: '', objetivo: '', cerimonial: false, haveraInscricoes: false, necessidadeDeclaracoes: false, recursosNecessarios: '', observacoes: '', centroCusto: '', inicio: new Date(dados.inicio || Date.now()), fim: new Date(dados.fim || Date.now() + 3600000), localChave: '' }
      : validarSolicitacao(dados, status !== 'RASCUNHO');
    const recursos = dados.recursos || [];
    if (status !== 'RASCUNHO' || dados.titulo?.trim()) await validarRelacionamentos({ ...campos, recursos });
    if (status === 'PENDENTE') await validarConflitoComAprovado(campos);
    return prisma.evento.create({ data: { ...campos, status, solicitanteId, recursos: { create: recursos.map((recursoId) => ({ recursoId })) } } });
  },
  listarSolicitacoes(solicitanteId) {
    return prisma.evento.findMany({ where: solicitanteId ? { solicitanteId } : {}, include: incluirPessoas, orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }] });
  },
  async atualizar(id, dados, usuario) {
    dados = await aplicarAmbiente(dados);
    const atual = await prisma.evento.findUnique({ where: { id } });
    if (!atual) throw new Error('Solicitação não encontrada.');
    const admin = usuario.setor === 'ADMIN';
    if (!admin && atual.solicitanteId !== usuario.id) throw new Error('Sem permissão para editar esta solicitação.');
    if (!admin && !['RASCUNHO', 'PENDENTE', 'RECUSADO'].includes(atual.status)) throw new Error('Somente rascunhos, pendentes e recusadas podem ser editados.');
    if (admin && atual.status !== 'APROVADO') throw new Error('O administrador só pode editar eventos aprovados.');
    let campos;
    if (!admin && atual.status === 'RASCUNHO' && (!dados.titulo?.trim() || !dados.local?.trim() || !dados.inicio || !dados.fim)) {
      campos = {
        titulo: typeof dados.titulo === 'string' ? dados.titulo.trim() : atual.titulo,
        local: typeof dados.local === 'string' ? dados.local.trim() : atual.local,
        descricao: typeof dados.descricao === 'string' ? dados.descricao.trim() : atual.descricao,
        inicio: dados.inicio ? new Date(dados.inicio) : atual.inicio,
        fim: dados.fim ? new Date(dados.fim) : atual.fim,
        localChave: typeof dados.local === 'string' ? dados.local.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ') : atual.localChave,
      };
    } else campos = validarSolicitacao(dados, true);
    if (campos.titulo) await validarRelacionamentos({ ...campos, recursos: dados.recursos || [] });
    if (atual.status === 'PENDENTE' || admin) await validarConflitoComAprovado(campos, id);
    return prisma.evento.update({ where: { id }, data: { ...campos, status: admin ? 'APROVADO' : atual.status, ...(dados.recursos ? { recursos: { deleteMany: {}, create: dados.recursos.map((recursoId) => ({ recursoId })) } } : {}) } });
  },
  async enviarRascunho(id, dados, usuario) {
    dados = await aplicarAmbiente(dados);
    const atual = await prisma.evento.findUnique({ where: { id } });
    if (!atual || atual.solicitanteId !== usuario.id || !['RASCUNHO', 'RECUSADO'].includes(atual.status)) {
      throw new Error('Somente rascunhos ou solicitações recusadas podem ser reenviados.');
    }
    const campos = validarSolicitacao(dados, true);
    await validarRelacionamentos(campos);
    await validarConflitoComAprovado(campos);
    return prisma.evento.update({ where: { id }, data: { ...campos, status: 'PENDENTE', motivo: null, recursos: { deleteMany: {}, create: (dados.recursos || []).map((recursoId) => ({ recursoId })) } } });
  },
  async excluir(id, usuario) {
    const atual = await prisma.evento.findUnique({ where: { id } });
    if (!atual || atual.solicitanteId !== usuario.id || atual.status !== 'RASCUNHO') throw new Error('Somente seus rascunhos podem ser excluídos.');
    return prisma.evento.delete({ where: { id } });
  },
  async cancelar(id, usuario) {
    const atual = await prisma.evento.findUnique({ where: { id } });
    if (!atual || atual.solicitanteId !== usuario.id || atual.status !== 'PENDENTE') throw new Error('Somente suas solicitações pendentes podem ser canceladas.');
    return prisma.evento.update({ where: { id }, data: { status: 'CANCELADO', canceladoEm: new Date() } });
  },
  async cancelarComoAdministrador(id) {
    const atual = await prisma.evento.findUnique({ where: { id } });
    if (!atual) throw new Error('Evento não encontrado.');
    if (atual.status !== 'APROVADO') throw new Error('Somente eventos aprovados podem ser cancelados pelo administrador.');
    return prisma.evento.update({ where: { id }, data: { status: 'CANCELADO', canceladoEm: new Date() } });
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
