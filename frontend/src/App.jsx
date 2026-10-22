import { useEffect, useState } from 'react';
import IntroScreen from './components/IntroScreen';
import { LoginView } from './components/LoginView';
import CalendarioView from './page/CalendarioView';
import UsuariosView from './page/UsuariosView';
import { AlterarSenhaModal } from './modals/AlterarSenhaModal';
import { authService } from './services/authService';

export default function App() {
  const [intro, setIntro] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(() => authService.temToken());
  const [erro, setErro] = useState('');
  const [tela, setTela] = useState('calendario');
  const [senha, setSenha] = useState(false);
  useEffect(() => {
    let ativo = true;
    const sair = () => {
      authService.definirToken(null);
      setUsuario(null);
      setTela('calendario');
      setSenha(false);
    };
    authService.aoExpirarSessao(sair);
    if (authService.temToken()) {
      authService.sessaoAtual().then((res) => {
        if (!ativo) return;
        if (res.ok) setUsuario(res.data);
        else sair();
      }).catch(() => {
        if (ativo) setErro('Não foi possível restaurar a sessão. Entre novamente.');
      }).finally(() => { if (ativo) setVerificando(false); });
    }
    return () => { ativo = false; authService.aoExpirarSessao(null); };
  }, []);
  if (!intro) return <IntroScreen onDone={() => setIntro(true)} />;
  if (verificando) return <p role="status">Verificando sessão…</p>;
  if (!usuario) return <>{erro && <p role="alert">{erro}</p>}<LoginView onLogin={({ token, usuario: pessoa }) => {
    authService.definirToken(token); setUsuario(pessoa); setErro('');
  }} /></>;
  const admin = usuario.setor === 'ADMIN';
  return <>
    <header className="app-header">
      <strong>Univille · Agenda</strong>
      <nav aria-label="Navegação principal">
        <button onClick={() => setTela('calendario')} aria-current={tela === 'calendario' ? 'page' : undefined}>Calendário</button>
        {admin && <button onClick={() => setTela('usuarios')} aria-current={tela === 'usuarios' ? 'page' : undefined}>Administração de usuários</button>}
        <button onClick={() => setSenha(true)}>Alterar senha</button>
        <button onClick={() => { authService.definirToken(null); setUsuario(null); setTela('calendario'); setSenha(false); }}>Sair</button>
      </nav>
      <span>{usuario.nome}</span>
    </header>
    {tela === 'usuarios' && admin ? <UsuariosView usuarioAtual={usuario} onBack={() => setTela('calendario')} /> : <CalendarioView />}
    {senha && <AlterarSenhaModal usuarioLogado={usuario.setor} onClose={() => setSenha(false)} />}
  </>;
}
