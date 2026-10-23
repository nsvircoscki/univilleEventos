// src/controllers/usuarioController.js
import { usuarioService } from '../services/usuarioService.js';

export const usuarioController = {
  async listar(req, res) {
    try {
      res.json(await usuarioService.listar());
    } catch (error) {
      res.status(500).json({ error: 'Erro ao carregar usuários.' });
    }
  },

  async setores(req, res) {
    try {
      res.json(await usuarioService.listarSetores());
    } catch (error) {
      res.status(500).json({ error: 'Erro ao carregar setores.' });
    }
  },

  async criar(req, res) {
    try {
      res.status(201).json(await usuarioService.criar(req.body));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // req.usuario.id: impede o admin de desativar a si mesmo ou sair do setor.
  async atualizar(req, res) {
    try {
      res.json(await usuarioService.atualizar(req.params.id, req.body, req.usuario.id, req.body.senhaAdmin));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async definirSenha(req, res) {
    try {
      await usuarioService.definirSenha(req.params.id, req.body.novaSenha);
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  async relatorio(req, res) {
    try {
      const tipo = req.params.tipo;
      if (!['solicitacoes', 'eventos-aprovados', 'usuarios'].includes(tipo)) return res.status(400).json({ error: 'Relatório inválido.' });
      for (const campo of ['dataInicial', 'dataFinal']) {
        if (req.query[campo] && !/^\d{4}-\d{2}-\d{2}$/.test(req.query[campo])) return res.status(400).json({ error: `${campo} inválida.` });
      }
      if (req.query.dataInicial && req.query.dataFinal && req.query.dataInicial > req.query.dataFinal) return res.status(400).json({ error: 'A data inicial deve ser anterior ou igual à data final.' });
      const linhas = await usuarioService.relatorio(tipo, req.query);
      const campos = tipo === 'usuarios'
        ? ['nome', 'email', 'login', 'setor', 'ativo']
        : ['nomeEvento', 'data', 'horarioInicial', 'horarioFinal', 'tema', 'curso', 'centroCusto', 'local', 'solicitante', 'status'];
      const valor = (linha, campo) => {
        if (campo === 'setor') return linha.role.name;
        if (campo === 'solicitante') return linha.solicitante?.name;
        if (campo === 'ativo') return linha.ativo ? 'SIM' : 'NAO';
        if (campo === 'nomeEvento') return linha.titulo;
        if (campo === 'data') return new Date(linha.inicio).toLocaleDateString('pt-BR');
        if (campo === 'horarioInicial') return new Date(linha.inicio).toLocaleTimeString('pt-BR');
        if (campo === 'horarioFinal') return new Date(linha.fim).toLocaleTimeString('pt-BR');
        if (campo === 'tema') return linha.temaRef?.nome || linha.tema;
        if (campo === 'curso') return linha.curso?.nome;
        if (campo === 'centroCusto') return linha.curso?.centroCusto || linha.centroCusto;
        return linha[campo];
      };
      const csv = [campos, ...linhas.map((linha) => campos.map((campo) => valor(linha, campo)))]
        .map((linha) => linha.map((valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
      res.attachment(`${tipo}.csv`).type('text/csv; charset=utf-8').send(`\uFEFF${csv}`);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao emitir relatório.' });
    }
  },
  async consultarRelatorio(req, res) {
    try {
      if (!['solicitacoes', 'eventos-aprovados'].includes(req.params.tipo)) return res.status(400).json({ error: 'Relatório inválido.' });
      res.json(await usuarioService.relatorio(req.params.tipo, req.query));
    } catch (error) {
      res.status(500).json({ error: 'Erro ao consultar relatório.' });
    }
  },
};
