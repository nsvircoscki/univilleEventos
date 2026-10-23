import { Router } from 'express';
import { cadastroService } from '../services/cadastroService.js';
import { exigirSetor } from '../middlewares/autenticar.js';

const router = Router();
const executar = (acao, status = 200) => async (req, res, next) => {
  try { res.status(status).json(await acao(req)); } catch (erro) {
    if (erro.name === 'Error' || erro.code === 'P2002') return res.status(400).json({ error: erro.code === 'P2002' ? 'Já existe um cadastro com esse nome.' : erro.message });
    next(erro);
  }
};
router.get('/:tipo', executar((req) => cadastroService.listar(req.params.tipo)));
router.post('/:tipo', exigirSetor('ADMIN'), executar((req) => cadastroService.criar(req.params.tipo, req.body), 201));
router.put('/:tipo/:id', exigirSetor('ADMIN'), executar((req) => cadastroService.atualizar(req.params.tipo, req.params.id, req.body)));
router.delete('/:tipo/:id', exigirSetor('ADMIN'), executar((req) => cadastroService.excluir(req.params.tipo, req.params.id)));
export default router;
