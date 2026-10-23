import { Router } from 'express';
import { autenticar, exigirSetor } from '../middlewares/autenticar.js';
import { eventoService } from '../services/eventoService.js';

const router = Router();
const executar = (acao, status = 200) => async (req, res, next) => {
  try { res.status(status).json(await acao(req)); }
  catch (erro) {
    if (erro.name === 'Error') return res.status(400).json({ error: erro.message });
    next(erro);
  }
};
router.get('/', executar(() => eventoService.listarPublicos()));
router.get('/minhas-solicitacoes', autenticar, executar((req) => eventoService.listarSolicitacoes(req.usuario.id)));
router.post('/solicitacoes', autenticar, executar((req) => eventoService.solicitar(req.body, req.usuario.id), 201));
router.get('/solicitacoes', autenticar, exigirSetor('ADMIN'), executar(() => eventoService.listarSolicitacoes()));
router.patch('/solicitacoes/:id/decisao', autenticar, exigirSetor('ADMIN'), executar((req) => eventoService.decidir(req.params.id, req.body, req.usuario.id)));
export default router;
