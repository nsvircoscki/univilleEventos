import { useState } from 'react';
import { UserRound, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import logoPortal from '../assets/login/logo-portal.png';
import './LoginView.css';
import { authService } from '../services/authService';

// Último usuário que entrou nesta máquina: quem usa sempre o mesmo computador
// só digita a senha. Guardado só o nome de usuário, nunca a senha.
const CHAVE_ULTIMO_LOGIN = 'univille:ultimoLogin';
const lerUltimoLogin = () => {
  try { return localStorage.getItem(CHAVE_ULTIMO_LOGIN) || ''; } catch { return ''; }
};

export function LoginView({ onLogin, aviso }) {
  const [senhaInput, setSenhaInput] = useState('');
  const [confirmarSenhaInput, setConfirmarSenhaInput] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loginInput, setLoginInput] = useState(lerUltimoLogin);
  // 'login': tela normal. 'criar-senha': primeiro acesso desse usuário —
  // password_hash ainda é nulo no banco, então pedimos pra ele definir uma.
  const [modo, setModo] = useState('login');
  const [erro, setErro] = useState('');
  const [ajuda, setAjuda] = useState(false);
  const [carregando, setCarregando] = useState(false);
  // Nome da pessoa no primeiro acesso (vem do backend, pra saudação).
  const [nomePrimeiroAcesso, setNomePrimeiroAcesso] = useState('');

  // Mudou o usuário digitado: volta pro login normal (sai do "criar senha"
  // que era de outra conta).
  const trocarLogin = (valor) => {
    setLoginInput(valor);
    if (modo === 'criar-senha') {
      setModo('login');
      setSenhaInput('');
      setConfirmarSenhaInput('');
    }
    setErro('');
  };

  const entrar = (sessao) => {
    try { localStorage.setItem(CHAVE_ULTIMO_LOGIN, loginInput.trim().toLowerCase()); } catch { /* sem storage */ }
    onLogin(sessao);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (carregando) return;
    setErro('');

    if (!loginInput.trim()) {
      setErro('Informe o usuário.');
      return;
    }

    if (modo === 'criar-senha') {
      if (senhaInput !== confirmarSenhaInput) {
        setErro('As senhas não coincidem.');
        return;
      }
      setCarregando(true);
      try {
        const res = await authService.criarSenha(loginInput, senhaInput);
        if (!res.ok) {
          setErro(res.data?.error || 'Erro ao criar senha.');
          return;
        }
        // Criar a senha já devolve a sessão ({ usuario }).
        entrar(res.data);
      } catch (erro) {
        console.error(erro);
        setErro('Erro ao conectar com o servidor.');
      } finally {
        setCarregando(false);
      }
      return;
    }

    setCarregando(true);
    try {
      const res = await authService.login(loginInput, senhaInput);
      if (!res.ok) {
        setErro(res.data?.error || 'Erro ao entrar.');
        return;
      }
      if (res.data.precisaCriarSenha) {
        setNomePrimeiroAcesso(res.data.nome || '');
        setModo('criar-senha');
        setSenhaInput('');
        setConfirmarSenhaInput('');
        return;
      }
      entrar(res.data);
    } catch (erro) {
      console.error(erro);
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return <main className="portal-login">
    <div className="portal-login-content">
      <img className="portal-login-logo" src={logoPortal} width="198" height="45" alt="Univille" />
      <section className="portal-login-card" aria-labelledby="portal-login-title">
        <h1 id="portal-login-title">{modo === 'criar-senha' ? 'Crie sua senha' : 'Agenda de eventos'}</h1>
        {modo === 'criar-senha' && <p className="portal-login-greeting">Primeiro acesso de {nomePrimeiroAcesso}. Defina uma senha para continuar.</p>}
        <form onSubmit={handleLogin} aria-busy={carregando}>
          <div className="portal-login-field">
            <label htmlFor="portal-usuario" className="portal-login-icon"><UserRound size={22} strokeWidth={1} /><span className="portal-sr-only">Usuário</span></label>
            <input id="portal-usuario" name="username" type="text" value={loginInput}
              onChange={(e) => trocarLogin(e.target.value)} placeholder="Usuário" autoComplete="username"
              autoCapitalize="none" spellCheck={false} autoFocus={!loginInput} required
              aria-invalid={Boolean(erro)} aria-describedby={erro ? 'portal-login-error' : undefined} />
          </div>
          <div className="portal-login-field">
            <label htmlFor="portal-senha" className="portal-login-icon"><LockKeyhole size={22} strokeWidth={1} /><span className="portal-sr-only">{modo === 'criar-senha' ? 'Nova senha' : 'Senha'}</span></label>
            <div className="portal-password">
              <input id="portal-senha" name="password" type={mostrarSenha ? 'text' : 'password'} value={senhaInput}
                onChange={(e) => setSenhaInput(e.target.value)} placeholder={modo === 'criar-senha' ? 'Nova senha' : 'Senha'}
                autoComplete={modo === 'criar-senha' ? 'new-password' : 'current-password'} autoFocus={Boolean(loginInput)} required
                aria-invalid={Boolean(erro)} aria-describedby={erro ? 'portal-login-error' : undefined} />
              <button className="portal-password-toggle" type="button" aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha} onClick={() => setMostrarSenha((atual) => !atual)}>
                {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {modo === 'criar-senha' && <div className="portal-login-field">
            <label htmlFor="portal-confirmacao" className="portal-login-icon"><LockKeyhole size={22} strokeWidth={1} /><span className="portal-sr-only">Confirmar senha</span></label>
            <input id="portal-confirmacao" name="confirmPassword" type={mostrarSenha ? 'text' : 'password'} value={confirmarSenhaInput}
              onChange={(e) => setConfirmarSenhaInput(e.target.value)} placeholder="Confirmar senha" autoComplete="new-password" required />
          </div>}
          {erro && <p id="portal-login-error" className="portal-login-message portal-login-error" role="alert">{erro}</p>}
          {aviso && !erro && <p className="portal-login-message" role="status">{aviso}</p>}
          <button className="portal-login-submit" type="submit" disabled={carregando}>
            {carregando ? 'Acessando…' : modo === 'criar-senha' ? 'Criar senha e acessar' : 'Acessar'}
          </button>
        </form>
        <button className="portal-login-help" type="button" onClick={() => setAjuda((atual) => !atual)} aria-expanded={ajuda} aria-controls="portal-login-help-text">Esqueceu sua senha?</button>
        {ajuda && <p className="portal-login-message" id="portal-login-help-text" role="status">Solicite à administração da agenda a redefinição da sua senha.</p>}
      </section>
    </div>
  </main>;
}
