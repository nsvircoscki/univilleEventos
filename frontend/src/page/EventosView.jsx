import { useEffect, useState } from 'react';
import { CalendarPlus, CalendarCheck, ClipboardList, Send, Check, X, RefreshCw, Save } from 'lucide-react';
import { api } from '../services/api';
import Dropdown from '../components/Dropdown';
import './eventos.css';

const rotulos = { RASCUNHO: 'Rascunho', PENDENTE: 'Pendente', APROVADO: 'Aprovado', RECUSADO: 'Recusado', CANCELADO: 'Cancelado' };
const formatar = (data) => new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export function SolicitarEventoView({ dataInicial, eventoInicial, administrador = false, onEnviado }) {
  const vazio = { titulo: '', tema: '', palestrante: '', solicitanteTexto: '', publicoAlvo: '', justificativa: '', objetivo: '', local: '', ambienteId: '', cursoId: '', inicio: dataInicial ? dataInicial + 'T09:00' : '', fim: dataInicial ? dataInicial + 'T10:00' : '', descricao: '', cerimonial: false, haveraInscricoes: false, necessidadeDeclaracoes: false, recursosNecessarios: '', observacoes: '', recursos: [] };
  const [form, setForm] = useState(() => eventoInicial ? { ...vazio, ...eventoInicial, inicio: eventoInicial.inicio?.slice(0, 16), fim: eventoInicial.fim?.slice(0, 16), recursos: eventoInicial.recursos?.map((item) => item.recursoId) || [] } : vazio);
  const [cadastros, setCadastros] = useState({ temas: [], ambientes: [], cursos: [], recursos: [] });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    Promise.all(['temas', 'ambientes', 'cursos', 'recursos'].map((tipo) => api.getCadastros(tipo))).then((respostas) => {
      if (respostas.every((res) => res.ok)) setCadastros({ temas: respostas[0].data, ambientes: respostas[1].data, cursos: respostas[2].data, recursos: respostas[3].data });
    });
  }, []);
  useEffect(() => {
    if (!eventoInicial) return;
    setForm({ ...vazio, ...eventoInicial, inicio: eventoInicial.inicio?.slice(0, 16), fim: eventoInicial.fim?.slice(0, 16), recursos: eventoInicial.recursos?.map((item) => item.recursoId) || [] });
  }, [eventoInicial]);
  const campo = (nome) => (e) => setForm({ ...form, [nome]: e.target.value });
  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    if (new Date(form.fim) <= new Date(form.inicio)) { setErro('O término deve ser depois do início.'); return; }
    setEnviando(true); setErro('');
    try {
      const dados = { ...form, inicio: new Date(form.inicio).toISOString(), fim: new Date(form.fim).toISOString() };
      const disponibilidade = await api.verificarDisponibilidade(form.ambienteId, dados.inicio, dados.fim, eventoInicial?.id);
      if (!disponibilidade.ok) { setErro(disponibilidade.data?.error || 'Não foi possível verificar a disponibilidade do ambiente.'); return; }
      if (!disponibilidade.data.disponivel) {
        const conflito = disponibilidade.data.conflito;
        setErro(`O ambiente já possui o evento "${conflito.titulo}" nesse intervalo. Escolha outro horário ou ambiente.`);
        return;
      }
      const res = ['RASCUNHO', 'RECUSADO'].includes(eventoInicial?.status)
        ? await api.enviarRascunho(eventoInicial.id, dados)
        : eventoInicial ? await api.atualizarSolicitacao(eventoInicial.id, dados) : await api.solicitarEvento(dados);
      if (!res.ok) { setErro(res.data?.error || 'Não foi possível enviar.'); return; }
      onEnviado('enviado');
    } catch { setErro('Não foi possível conectar ao servidor. Seus dados foram mantidos.'); }
    finally { setEnviando(false); }
  };
  const rascunhar = async () => {
    setErro('');
    const dados = { ...form, inicio: form.inicio ? new Date(form.inicio).toISOString() : undefined, fim: form.fim ? new Date(form.fim).toISOString() : undefined };
    const res = eventoInicial
      ? await api.atualizarSolicitacao(eventoInicial.id, dados)
      : await api.salvarRascunho(dados);
    if (!res.ok) { setErro(res.data?.error || 'Não foi possível salvar o rascunho.'); return; }
    onEnviado('rascunho');
  };
  return <main className="event-page">
    <h1><CalendarPlus aria-hidden="true" />{administrador ? 'Editar palestra' : eventoInicial ? 'Editar solicitação' : 'Solicitar evento'}</h1><p>{administrador ? 'Atualize os dados do evento aprovado.' : 'Salve um rascunho ou envie os dados para análise.'}</p>
    <form className="event-form" onSubmit={enviar} aria-busy={enviando}>
      <label>Nome do evento<input value={form.titulo} onChange={campo('titulo')} maxLength={120} required /></label>
      <label>Tema<select value={form.temaId || ''} onChange={(e) => setForm({ ...form, temaId: e.target.value, tema: cadastros.temas.find((item) => item.id === e.target.value)?.nome || '' })} required><option value="">Selecione</option>{cadastros.temas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      <label>Palestrante<input value={form.palestrante} onChange={campo('palestrante')} maxLength={200} required /></label>
      <label>Solicitante (nome exibido)<input value={form.solicitanteTexto} onChange={campo('solicitanteTexto')} maxLength={200} required /></label>
      <label>Público-alvo<input value={form.publicoAlvo} onChange={campo('publicoAlvo')} maxLength={500} required /></label>
      <div className="event-form-row"><label>Ambiente
        <select value={form.ambienteId} onChange={(e) => { const ambiente = cadastros.ambientes.find((item) => item.id === e.target.value); const disponiveis = ambiente?.recursos?.map((item) => item.recursoId) || []; setForm({ ...form, ambienteId: e.target.value, local: ambiente?.nome || '', recursos: form.recursos.filter((id) => disponiveis.includes(id)) }); }} required><option value="">Selecione</option>{cadastros.ambientes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
      </label><label>Curso / coordenação
        <select value={form.cursoId} onChange={campo('cursoId')} required><option value="">Selecione</option>{cadastros.cursos.map((item) => <option key={item.id} value={item.id}>{item.nome} ({item.centroCusto})</option>)}</select>
      </label></div>
      <div className="event-form-row"><label>Início<input type="datetime-local" value={form.inicio} onChange={campo('inicio')} required /></label>
        <label>Término<input type="datetime-local" value={form.fim} onChange={campo('fim')} required /></label></div>
      <p className="event-hint">Informe os horários no seu fuso local.</p>
      <label>Justificativa<textarea value={form.justificativa} onChange={campo('justificativa')} maxLength={3000} required rows={3} /></label>
      <label>Objetivo<textarea value={form.objetivo} onChange={campo('objetivo')} maxLength={3000} required rows={3} /></label>
      <label>Descrição<textarea value={form.descricao} onChange={campo('descricao')} maxLength={3000} rows={3} /></label>
      <fieldset><legend>Configurações</legend>
        <label><input type="checkbox" checked={form.cerimonial} onChange={(e) => setForm({ ...form, cerimonial: e.target.checked })} /> Haverá cerimonial</label>
        <label><input type="checkbox" checked={form.haveraInscricoes} onChange={(e) => setForm({ ...form, haveraInscricoes: e.target.checked })} /> Haverá inscrições</label>
        <label><input type="checkbox" checked={form.necessidadeDeclaracoes} onChange={(e) => setForm({ ...form, necessidadeDeclaracoes: e.target.checked })} /> Necessita declarações</label>
      </fieldset>
      <fieldset><legend>Recursos disponíveis no ambiente</legend>
        {!form.ambienteId && <p className="event-hint">Selecione um ambiente para ver os recursos disponíveis.</p>}
        <div className="resource-list">{cadastros.recursos.filter((item) => form.ambienteId && cadastros.ambientes.find((ambiente) => ambiente.id === form.ambienteId)?.recursos?.some((vinculo) => vinculo.recursoId === item.id)).map((item) => <span key={item.id} className="resource-list-item">{item.nome}</span>)}</div>
      </fieldset>
      <label>Recursos adicionais necessários<textarea value={form.recursosNecessarios} onChange={campo('recursosNecessarios')} maxLength={2000} rows={2} /></label>
      <label>Observações<textarea value={form.observacoes} onChange={campo('observacoes')} maxLength={3000} rows={2} /></label>
      {erro && <p role="alert" className="event-error">{erro}</p>}
      {(!eventoInicial || ['RASCUNHO', 'RECUSADO'].includes(eventoInicial.status)) && <button type="button" onClick={rascunhar} disabled={enviando}><Save size={16} aria-hidden="true" />Salvar rascunho</button>}
      <button className="event-primary" disabled={enviando}><Send size={16} aria-hidden="true" />{enviando ? 'Salvando…' : administrador ? 'Salvar palestra' : 'Enviar solicitação'}</button>
    </form>
  </main>;
}

export function SolicitacoesView({ administracao = false, onDecisao, onEditar, eventoFoco = null }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const statusFoco = eventoFoco?.status || (administracao ? 'APROVADO' : 'TODAS');
  const [filtro, setFiltro] = useState(statusFoco);
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
  useEffect(() => {
    if (eventoFoco) setFiltro(eventoFoco.status || (administracao ? 'APROVADO' : 'TODAS'));
  }, [eventoFoco]);
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
  const alterar = async (evento) => {
    const res = evento.status === 'RASCUNHO' ? await api.excluirRascunho(evento.id) : await api.cancelarSolicitacao(evento.id);
    if (!res.ok) setErro(res.data?.error || 'Não foi possível alterar a solicitação.');
    else setItens((atuais) => atuais.filter((item) => item.id !== evento.id));
  };
  const cancelarComoAdministrador = async (evento) => {
    if (!window.confirm(`Deseja realmente cancelar o evento "${evento.titulo}"?`)) return;
    if (ocupado) return;
    setOcupado(evento.id); setErro('');
    try {
      const res = await api.cancelarEventoAdmin(evento.id);
      if (!res.ok) { setErro(res.data?.error || 'Não foi possível cancelar o evento.'); return; }
      setItens((atuais) => atuais.map((item) => item.id === evento.id ? { ...item, ...res.data } : item));
      onDecisao?.();
    } catch { setErro('Não foi possível cancelar o evento. Tente novamente.'); }
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
      <div className="event-request-list">{visiveis.map((evento) => <article key={evento.id} className={`event-request ${eventoFoco?.id === evento.id ? 'event-request-highlight' : ''}`} ref={(elemento) => { if (eventoFoco?.id === evento.id && elemento) elemento.scrollIntoView({ block: 'center', behavior: 'smooth' }); }}>
        <div className="event-request-title"><h2>{evento.titulo}</h2><span className={`event-status status-${evento.status}`}>{rotulos[evento.status]}</span></div>
        <p><strong>Local:</strong> {evento.local}</p>
        <p><strong>Horário:</strong> {formatar(evento.inicio)} até {formatar(evento.fim)}</p>
        {administracao && <p><strong>Solicitante:</strong> {evento.solicitante.name} · {evento.solicitante.email}</p>}
        {evento.descricao && <p className="event-description">{evento.descricao}</p>}
        {evento.motivo && <p><strong>Motivo da decisão:</strong> {evento.motivo}</p>}
        {evento.revisor && <p className="event-hint">Analisado por {evento.revisor.name}</p>}
        {!administracao && ['RASCUNHO', 'PENDENTE', 'RECUSADO'].includes(evento.status) && <div className="event-decision"><div><button onClick={() => onEditar?.(evento)}>Editar</button>{evento.status !== 'RECUSADO' && <button onClick={() => alterar(evento)}>{evento.status === 'RASCUNHO' ? 'Excluir rascunho' : 'Cancelar solicitação'}</button>}</div></div>}
        {administracao && evento.status === 'APROVADO' && <div className="event-decision"><div>
          <button onClick={() => onEditar?.(evento)}>Editar palestra</button>
          <button className="event-reject" disabled={Boolean(ocupado)} onClick={() => cancelarComoAdministrador(evento)}>
            {ocupado === evento.id ? 'Cancelando…' : 'Cancelar evento'}
          </button>
        </div></div>}
        {administracao && evento.status === 'PENDENTE' && <div className="event-decision">
          <label>Observação / motivo da recusa<textarea rows={2} maxLength={1000} value={motivos[evento.id] || ''} onChange={(e) => setMotivos({ ...motivos, [evento.id]: e.target.value })} /></label>
          <div><button className="event-primary" disabled={Boolean(ocupado)} onClick={() => decidir(evento.id, 'APROVADO')}><Check size={16} aria-hidden="true" />{ocupado === evento.id ? 'Salvando…' : 'Aprovar evento'}</button>
            <button className="event-reject" disabled={Boolean(ocupado)} onClick={() => decidir(evento.id, 'RECUSADO')}><X size={16} aria-hidden="true" />Recusar</button></div>
        </div>}
      </article>)}</div>}
  </main>;
}
