// src/routes/authRoutes.js
import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { encerrarSessao } from '../services/sessaoService.js';

const router = Router();

// Públicas: são o que a pessoa usa antes de ter uma sessão. (Não existe mais
// lista pública de usuários: o login é digitado.)
router.post('/login', authController.login);
router.post('/criar-senha', authController.criarSenha);
// O cadastro de contas é exclusivo da administração, em POST /usuarios.
router.post('/cadastro', (_req, res) => {
  res.status(403).json({ error: 'Somente administradores podem criar contas pela área de usuários.' });
});

// Exigem sessão.
router.post('/alterar-senha', autenticar, authController.alterarSenha);
router.get('/me', autenticar, authController.me);
router.post('/sair', async (req, res, next) => {
  try { await encerrarSessao(req, res); res.json({ ok: true }); }
  catch (erro) { next(erro); }
});


export default router;
