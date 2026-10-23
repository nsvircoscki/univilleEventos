import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, CalendarPlus, ClipboardList, ClipboardCheck, Users, LogIn, LogOut, KeyRound } from 'lucide-react';
import IntroScreen from './components/IntroScreen';
import { LoginView } from './components/LoginView';
import CalendarioView from './page/CalendarioView';
import UsuariosView from './page/UsuariosView';
import { SolicitarEventoView, SolicitacoesView } from './page/EventosView';
import { AlterarSenhaModal } from './modals/AlterarSenhaModal';
import { authService } from './services/authService';
import { api } from './services/api';
import { BrandBar } from './components/BrandLogo';
import CadastroUsuarioView from './page/CadastroUsuarioView';
import Footer from './components/Footer';
import ThemeToggle from './components/ThemeToggle';

const telaDaUrl = () => window.location.pathname === '/login' ? 'login' : window.location.pathname === '/cadastro' ? 'cadastro' : 'calendario';

export default function App() {
  const [intro, setIntro] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const revisaoSessao = useRef(0);
  const [erro, setErro] = useState('');
  const [tela, setTelaEstado] = useState(telaDaUrl);
  const setTela = (destino) => {
    const url = destino === 'login' ? '/login' : destino === 'cadastro' ? '/cadastro' : '/';
    if (window.location.pathname !== url) window.history.pushState({}, '', url);
    setTelaEstado(destino);
  };
  const [senha, setSenha] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [erroEventos, setErroEventos] = useState('');
  const [dataSolicitacao, setDataSolicitacao] = useState('');
  const concluirIntro = useCallback(() => setIntro(true), []);
  const carregarEventos = useCallback(async () => {
    try {
      const res = await api.getEventos();
      if (!res.ok) throw new Error('Não foi possível carregar os eventos.');
      setEventos(res.data); setErroEventos('');
    } catch { setErroEventos('Não foi possível carregar os eventos. Tente novamente.'); }
  }, []);
  useEffect(() => { carregarEventos(); }, [carregarEventos]);
  useEffect(() => {
    const voltar = () => setTelaEstado(telaDaUrl());
    window.addEventListener('popstate', voltar);
    return () => window.removeEventListener('popstate', voltar);
  }, []);
  useEffect(() => {
    let ativo = true;
    const revisaoInicial = revisaoSessao.current;
    const sair = () => {
      setUsuario(null); setTela('calendario'); setSenha(false);
    };
    authService.aoExpirarSessao(sair);
    {
      authService.sessaoAtual().then((res) => {
        if (!ativo || revisaoInicial !== revisaoSessao.current) return;
        if (res.ok) {
          setUsuario(res.data);
          if (['/login', '/cadastro'].includes(window.location.pathname)) setTela('calendario');
        } else setUsuario(null);
      }).catch(() => {
        if (ativo && revisaoInicial === revisaoSessao.current) { setUsuario(null); setErro('Não foi possível verificar sua sessão. Tente entrar novamente.'); }
      }).finally(() => { if (ativo) setVerificando(false); });
    }
    return () => { ativo = false; authService.aoExpirarSessao(null); };
  }, []);
  const abrirLogin = () => setTela('login');
  const solicitar = (data = '') => {
    setDataSolicitacao(data);
    if (usuario) setTela('solicitar');
    else abrirLogin();
  };
  if (!intro) return <IntroScreen onDone={concluirIntro} />;
  const concluirAcesso = ({ usuario: pessoa }) => {
    revisaoSessao.current++;
    setUsuario(pessoa); setErro(''); setTela('calendario');
  };
  const encerrarAcesso = async () => {
    setSaindo(true);
    try {
      const res = await authService.sair();
      if (!res.ok) throw new Error();
      revisaoSessao.current++;
      setUsuario(null); setTela('calendario'); setSenha(false); setErro('');
    } catch { setErro('Não foi possível encerrar a sessão. Tente novamente.'); }
    finally { setSaindo(false); }
  };
  if (tela === 'cadastro' && !usuario) return <><ThemeToggle floating /><CadastroUsuarioView onCadastrado={concluirAcesso} onLogin={abrirLogin} /></>;
  if (tela === 'login' && !usuario) return <><ThemeToggle floating /><LoginView aviso={erro} onCadastro={() => setTela('cadastro')} onLogin={concluirAcesso} /></>;
  const admin = usuario?.setor === 'ADMIN';
  return <>
    <BrandBar>
      <ThemeToggle />
      <div className="account-actions">
        {usuario ? <><span>{usuario.nome}</span><button className="account-password" aria-label="Alterar senha" onClick={() => setSenha(true)}><KeyRound size={15} aria-hidden="true" /><span>Alterar senha</span></button>
          <button className="account-primary" disabled={saindo} onClick={encerrarAcesso}><LogOut size={16} aria-hidden="true" />{saindo ? 'Saindo…' : 'Sair'}</button></>
          : <button className="account-primary" disabled={verificando} onClick={() => abrirLogin()}><LogIn size={16} aria-hidden="true" />{verificando ? 'Verificando sessão…' : 'Entrar'}</button>}
      </div>
    </BrandBar>
    <header className="app-header">
      <nav aria-label="Navegação principal">
        <button onClick={() => setTela('calendario')} aria-current={tela === 'calendario' ? 'page' : undefined}><CalendarDays aria-hidden="true" />Calendário</button>
        <button onClick={() => solicitar()} aria-current={tela === 'solicitar' ? 'page' : undefined}><CalendarPlus aria-hidden="true" />Solicitar evento</button>
        {usuario && <button onClick={() => setTela('minhas')} aria-current={tela === 'minhas' ? 'page' : undefined}><ClipboardList aria-hidden="true" />Minhas solicitações</button>}
        {admin && <><button onClick={() => setTela('aprovacoes')} aria-current={tela === 'aprovacoes' ? 'page' : undefined}><ClipboardCheck aria-hidden="true" />Aprovar solicitações</button>
          <button onClick={() => setTela('usuarios')} aria-current={tela === 'usuarios' ? 'page' : undefined}><Users aria-hidden="true" />Usuários</button></>}
      </nav>
    </header>
    {erro && <p className="event-error" role="alert">{erro}</p>}
    {tela === 'usuarios' && admin ? <UsuariosView usuarioAtual={usuario} onBack={() => setTela('calendario')} />
      : tela === 'aprovacoes' && admin ? <SolicitacoesView administracao onDecisao={carregarEventos} />
      : tela === 'minhas' && usuario ? <SolicitacoesView />
      : tela === 'solicitar' && usuario ? <SolicitarEventoView dataInicial={dataSolicitacao} onEnviado={() => setTela('minhas')} />
      : <CalendarioView eventos={eventos} erro={erroEventos} onRecarregar={carregarEventos} onSolicitar={solicitar} />}
    {senha && usuario && <AlterarSenhaModal usuarioLogado={usuario.setor} onClose={() => setSenha(false)} />}
    <Footer />
  </>;
}
