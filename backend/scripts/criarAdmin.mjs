import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma.js';
import { SENHA_MIN, normalizarLogin } from '../src/services/authService.js';

try {
  const { ADMIN_NOME = 'Administrador', ADMIN_EMAIL, ADMIN_LOGIN, ADMIN_SENHA } = process.env;
  const login = normalizarLogin(ADMIN_LOGIN);
  if (!/^[a-z0-9._-]{3,30}$/.test(login) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL || '') || !ADMIN_SENHA || ADMIN_SENHA.length < SENHA_MIN) {
    throw new Error('Defina ADMIN_EMAIL, ADMIN_LOGIN (3–30 caracteres) e ADMIN_SENHA no .env.');
  }
  const role = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
  await prisma.role.upsert({ where: { name: 'USUARIO' }, update: {}, create: { name: 'USUARIO' } });
  const existente = await prisma.user.findUnique({ where: { login } });
  if (existente) throw new Error('Login já cadastrado. Nenhuma conta foi alterada.');
  await prisma.user.create({ data: {
    name: ADMIN_NOME, email: ADMIN_EMAIL.trim().toLowerCase(), login,
    password_hash: await bcrypt.hash(ADMIN_SENHA, 10), roleId: role.id,
  } });
  console.log('Administrador criado. Entre com o login e a senha definidos no .env.');
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
