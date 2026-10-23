// src/routes/authRoutes.js
import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { usuarioService } from '../services/usuarioService.js';
import { authService } from '../services/authService.js';
import { iniciarSessao, encerrarSessao } from '../services/sessaoService.js';

const router = Router();

// Públicas: são o que a pessoa usa antes de ter uma sessão. (Não existe mais
// lista pública de usuários: o login é digitado.)
router.post('/login', authController.login);
router.post('/criar-senha', authController.criarSenha);
// Cadastro público: o perfil é definido no servidor, nunca pelo navegador.
router.post('/cadastro', async (req, res, next) => {
  try {
    const { nome, email, login, senha } = req.body || {};
    await usuarioService.criar({ nome, email, login, senha, setor: 'USUARIO' });
    const sessao = await authService.login(login, senha);
    await iniciarSessao(req, res, sessao.usuario.id);
    res.status(201).json(sessao);
  } catch (erro) {
    if (erro.code === 'P2002') return res.status(400).json({ error: 'Usuário ou e-mail já cadastrado.' });
    if (erro.name === 'Error') return res.status(400).json({ error: erro.message });
    next(erro);
  }
});

// Exigem sessão.
router.post('/alterar-senha', autenticar, authController.alterarSenha);
router.get('/me', autenticar, authController.me);
router.post('/sair', async (req, res, next) => {
  try { await encerrarSessao(req, res); res.json({ ok: true }); }
  catch (erro) { next(erro); }
});


export default router;
