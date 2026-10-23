import { prisma } from '../prisma.js';

const modelos = {
  temas: { model: 'tema', campos: ['nome'] },
  ambientes: { model: 'ambiente', campos: ['nome'] },
  recursos: { model: 'recurso', campos: ['nome'] },
  cursos: { model: 'curso', campos: ['nome', 'centroCusto'] },
};

function configuracao(tipo) {
  const config = modelos[tipo];
  if (!config) throw new Error('Cadastro auxiliar inválido.');
  return config;
}
export const cadastroService = {
  listar(tipo) {
    return prisma[configuracao(tipo).model].findMany({
      orderBy: { nome: 'asc' },
      include: tipo === 'ambientes' ? { recursos: { include: { recurso: true } } } : undefined,
    });
  },
  async criar(tipo, dados) {
    const config = configuracao(tipo);
    const valores = Object.fromEntries(config.campos.map((campo) => [campo, String(dados[campo] || '').trim()]));
    if (config.campos.some((campo) => !valores[campo])) throw new Error('Preencha todos os campos obrigatórios.');
    const item = await prisma[config.model].create({ data: valores });
    if (tipo === 'ambientes' && Array.isArray(dados.recursos)) {
      await prisma.ambienteRecurso.createMany({ data: dados.recursos.map((recursoId) => ({ ambienteId: item.id, recursoId })), skipDuplicates: true });
    }
    return item;
  },
  async atualizar(tipo, id, dados) {
    const config = configuracao(tipo);
    const valores = Object.fromEntries(config.campos.filter((campo) => dados[campo] !== undefined).map((campo) => [campo, String(dados[campo]).trim()]));
    if (tipo === 'ambientes' && Array.isArray(dados.recursos)) {
      await prisma.ambienteRecurso.deleteMany({ where: { ambienteId: id } });
      await prisma.ambienteRecurso.createMany({ data: dados.recursos.map((recursoId) => ({ ambienteId: id, recursoId })), skipDuplicates: true });
    }
    return prisma[config.model].update({ where: { id }, data: valores });
  },
  async excluir(tipo, id) {
    try {
      return await prisma[configuracao(tipo).model].delete({ where: { id } });
    } catch (erro) {
      if (erro.code === 'P2003' || erro.code === 'P2025') throw new Error('Não é possível excluir: o cadastro não existe ou possui vínculos.');
      throw erro;
    }
  },
};
