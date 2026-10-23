import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api } from '../services/api';
import logoPortal from '../assets/login/logo-portal.png';
import '../components/LoginView.css';

export default function CadastroUsuarioView({ onCadastrado, onLogin }) {
  const [form, setForm] = useState({ nome: '', email: '', login: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const campo = (chave) => (e) => setForm({ ...form, [chave]: e.target.value });
  const enviar = async (e) => {
    e.preventDefault();
    if (salvando) return;
    if (form.senha !== form.confirmar) { setErro('As senhas não coincidem.'); return; }
    setSalvando(true); setErro('');
    try {
      const res = await api.cadastrar({ nome: form.nome, email: form.email, login: form.login, senha: form.senha });
      if (!res.ok) { setErro(res.data?.error || 'Não foi possível criar sua conta.'); return; }
      onCadastrado(res.data);
    } catch { setErro('Não foi possível conectar ao servidor. Tente novamente.'); }
    finally { setSalvando(false); }
  };
  return <main className="portal-login portal-register"><div className="portal-login-content">
    <img className="portal-login-logo" src={logoPortal} alt="Univille" width="198" height="45" />
    <section className="portal-login-card"><h1><UserPlus size={24} aria-hidden="true" />Criar conta</h1>
      <form className="register-form" onSubmit={enviar} aria-busy={salvando}>
        <label>Nome completo<input value={form.nome} onChange={campo('nome')} autoComplete="name" maxLength={120} required /></label>
        <label>E-mail<input type="email" value={form.email} onChange={campo('email')} autoComplete="email" maxLength={254} required /></label>
        <label>Usuário<input value={form.login} onChange={campo('login')} autoComplete="username" autoCapitalize="none" pattern="[a-z0-9._-]{3,30}" minLength={3} maxLength={30} required aria-describedby="login-hint" /></label>
        <p id="login-hint">Use 3 a 30 letras minúsculas, números, ponto, hífen ou sublinhado.</p>
        <label>Senha<input type="password" value={form.senha} onChange={campo('senha')} autoComplete="new-password" minLength={4} required /></label>
        <label>Confirmar senha<input type="password" value={form.confirmar} onChange={campo('confirmar')} autoComplete="new-password" minLength={4} required /></label>
        {erro && <p className="portal-login-message portal-login-error" role="alert">{erro}</p>}
        <button className="portal-login-submit" disabled={salvando}><UserPlus size={16} aria-hidden="true" />{salvando ? 'Criando conta…' : 'Criar conta'}</button>
      </form>
      <button className="portal-login-help" onClick={onLogin}>Já tenho conta. Entrar</button>
    </section>
  </div></main>;
}
