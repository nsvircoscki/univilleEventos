import { useEffect, useState } from 'react';
import { CalendarPlus, CalendarCheck, ClipboardList, Send, Check, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import Dropdown from '../components/Dropdown';
import './eventos.css';

const rotulos = { PENDENTE: 'Pendente', APROVADO: 'Aprovado', RECUSADO: 'Recusado' };
const formatar = (data) => new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export function SolicitarEventoView({ dataInicial, onEnviado }) {
  const [form, setForm] = useState({ titulo: '', local: '', inicio: dataInicial ? dataInicial + 'T09:00' : '', fim: dataInicial ? dataInicial + 'T10:00' : '', descricao: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campo = (nome) => (e) => setForm({ ...form, [nome]: e.target.value });
  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    if (new Date(form.fim) <= new Date(form.inicio)) { setErro('O término deve ser depois do início.'); return; }
    setEnviando(true); setErro('');
    try {
      const res = await api.solicitarEvento({ ...form, inicio: new Date(form.inicio).toISOString(), fim: new Date(form.fim).toISOString() });
      if (!res.ok) { setErro(res.data?.error || 'Não foi possível enviar.'); return; }
      onEnviado();
    } catch { setErro('Não foi possível conectar ao servidor. Seus dados foram mantidos.'); }
    finally { setEnviando(false); }
  };
  return <main className="event-page">
    <h1><CalendarPlus aria-hidden="true" />Solicitar evento</h1><p>Envie os dados para análise. O evento aparecerá no calendário após a aprovação.</p>
    <form className="event-form" onSubmit={enviar} aria-busy={enviando}>
      <label>Título do evento<input value={form.titulo} onChange={campo('titulo')} maxLength={120} required /></label>
      <label>Espaço / local<input value={form.local} onChange={campo('local')} maxLength={120} required placeholder="Ex.: Auditório do bloco A" /></label>
      <div className="event-form-row"><label>Início<input type="datetime-local" value={form.inicio} onChange={campo('inicio')} required /></label>
        <label>Término<input type="datetime-local" value={form.fim} onChange={campo('fim')} required /></label></div>
      <p className="event-hint">Informe os horários no seu fuso local.</p>
      <label>Descrição<textarea value={form.descricao} onChange={campo('descricao')} maxLength={3000} rows={5} /></label>
      <p className="event-hint">A descrição será exibida no calendário público após a aprovação.</p>
      {erro && <p role="alert" className="event-error">{erro}</p>}
      <button className="event-primary" disabled={enviando}><Send size={16} aria-hidden="true" />{enviando ? 'Enviando…' : 'Enviar solicitação'}</button>
    </form>
  </main>;
}

export function SolicitacoesView({ administracao = false, onDecisao }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState(administracao ? 'PENDENTE' : 'TODAS');
  const [ocupado, setOcupado] = useState('');
  const [motivos, setMotivos] = useState({});
  const carregar = async () => {
    setCarregando(true); setErro('');
    try {
      const res = await (administracao ? api.getSolicitacoes() : api.getMinhasSolicitacoes());
      if (!res.ok) throw new Error(res.data?.error || 'Não foi possível carregar.');
      setItens(res.data);
    } catch (e) { setErro(e.message || 'Erro ao conectar ao servidor.'); }
    finally { setCarregando(false); }
  };
  useEffect(() => {
    let ativo = true;
    const buscar = async () => {
      try {
        const res = await (administracao ? api.getSolicitacoes() : api.getMinhasSolicitacoes());
        if (!res.ok) throw new Error(res.data?.error || 'Não foi possível carregar.');
        if (ativo) { setItens(res.data); setErro(''); }
      } catch { if (ativo) setErro('Não foi possível carregar as solicitações.'); }
      finally { if (ativo) setCarregando(false); }
    };
    buscar();
    return () => { ativo = false; };
  }, [administracao]);
  const decidir = async (id, status) => {
    if (ocupado) return;
    if (status === 'RECUSADO' && !motivos[id]?.trim()) { setErro('Informe o motivo da recusa.'); return; }
    setOcupado(id); setErro('');
    try {
      const res = await api.decidirEvento(id, status, motivos[id] || '');
      if (!res.ok) { setErro(res.data?.error || 'Não foi possível analisar.'); return; }
      setItens((atuais) => atuais.map((item) => item.id === id ? { ...item, ...res.data } : item));
      onDecisao?.();
    } catch { setErro('Não foi possível salvar a decisão. Tente novamente.'); }
    finally { setOcupado(''); }
  };
  const visiveis = itens.filter((e) => filtro === 'TODAS' || e.status === filtro);
  return <main className="event-page">
    <h1>{administracao ? <CalendarCheck aria-hidden="true" /> : <ClipboardList aria-hidden="true" />}{administracao ? 'Aprovar solicitações de eventos' : 'Minhas solicitações'}</h1>
    <p>{administracao ? 'Confira espaço, horário e informações antes de aprovar ou recusar.' : 'Acompanhe a análise dos eventos que você solicitou.'}</p>
    <div className="event-filters"><Dropdown label="Status" value={filtro} onChange={setFiltro}
      options={[{ value: 'TODAS', label: 'Todas' }, ...Object.entries(rotulos).map(([value, label]) => ({ value, label }))]} />
      <button onClick={carregar}><RefreshCw size={16} aria-hidden="true" />Atualizar</button></div>
    {erro && <p className="event-error" role="alert">{erro}</p>}
    {carregando ? <p role="status">Carregando solicitações…</p> : visiveis.length === 0 ? <p className="event-empty">Nenhuma solicitação neste status.</p> :
      <div className="event-request-list">{visiveis.map((evento) => <article key={evento.id} className="event-request">
        <div className="event-request-title"><h2>{evento.titulo}</h2><span className={`event-status status-${evento.status}`}>{rotulos[evento.status]}</span></div>
        <p><strong>Local:</strong> {evento.local}</p>
        <p><strong>Horário:</strong> {formatar(evento.inicio)} até {formatar(evento.fim)}</p>
        {administracao && <p><strong>Solicitante:</strong> {evento.solicitante.name} · {evento.solicitante.email}</p>}
        {evento.descricao && <p className="event-description">{evento.descricao}</p>}
        {evento.motivo && <p><strong>Motivo da decisão:</strong> {evento.motivo}</p>}
        {evento.revisor && <p className="event-hint">Analisado por {evento.revisor.name}</p>}
        {administracao && evento.status === 'PENDENTE' && <div className="event-decision">
          <label>Observação / motivo da recusa<textarea rows={2} maxLength={1000} value={motivos[evento.id] || ''} onChange={(e) => setMotivos({ ...motivos, [evento.id]: e.target.value })} /></label>
          <div><button className="event-primary" disabled={Boolean(ocupado)} onClick={() => decidir(evento.id, 'APROVADO')}><Check size={16} aria-hidden="true" />{ocupado === evento.id ? 'Salvando…' : 'Aprovar evento'}</button>
            <button className="event-reject" disabled={Boolean(ocupado)} onClick={() => decidir(evento.id, 'RECUSADO')}><X size={16} aria-hidden="true" />Recusar</button></div>
        </div>}
      </article>)}</div>}
  </main>;
}
