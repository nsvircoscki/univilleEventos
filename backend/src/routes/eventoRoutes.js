import { Router } from 'express';
import { autenticar, exigirSetor, tentarAutenticar } from '../middlewares/autenticar.js';
import { eventoService } from '../services/eventoService.js';

const router = Router();
const executar = (acao, status = 200) => async (req, res, next) => {
  try { res.status(status).json(await acao(req)); }
  catch (erro) {
    if (erro.name === 'Error') return res.status(400).json({ error: erro.message });
    next(erro);
  }
};
router.get('/', tentarAutenticar, executar((req) => eventoService.listarPublicos(req.usuario)));
router.get('/disponibilidade', autenticar, executar((req) => eventoService.verificarDisponibilidade({
  ambienteId: req.query.ambienteId,
  inicio: req.query.inicio,
  fim: req.query.fim,
  ignorarId: req.query.ignorarId,
})));
router.get('/minhas-solicitacoes', autenticar, executar((req) => eventoService.listarSolicitacoes(req.usuario.id)));
router.post('/solicitacoes', autenticar, executar((req) => eventoService.salvar(req.body, req.usuario.id, 'PENDENTE'), 201));
router.post('/rascunhos', autenticar, executar((req) => eventoService.salvar(req.body, req.usuario.id), 201));
router.put('/solicitacoes/:id', autenticar, executar((req) => eventoService.atualizar(req.params.id, req.body, req.usuario)));
router.patch('/solicitacoes/:id/enviar', autenticar, executar((req) => eventoService.enviarRascunho(req.params.id, req.body, req.usuario)));
router.delete('/solicitacoes/:id', autenticar, executar((req) => eventoService.excluir(req.params.id, req.usuario)));
router.patch('/solicitacoes/:id/cancelar', autenticar, executar((req) => eventoService.cancelar(req.params.id, req.usuario)));
router.patch('/solicitacoes/:id/cancelar-admin', autenticar, exigirSetor('ADMIN'), executar((req) => eventoService.cancelarComoAdministrador(req.params.id)));
router.get('/solicitacoes', autenticar, exigirSetor('ADMIN'), executar(() => eventoService.listarSolicitacoes()));
router.patch('/solicitacoes/:id/decisao', autenticar, exigirSetor('ADMIN'), executar((req) => eventoService.decidir(req.params.id, req.body, req.usuario.id)));
router.put('/:id', autenticar, exigirSetor('ADMIN'), executar((req) => eventoService.atualizar(req.params.id, req.body, req.usuario)));
export default router;
