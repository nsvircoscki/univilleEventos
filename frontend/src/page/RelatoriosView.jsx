import { useEffect, useState } from 'react';
import { api } from '../services/api';

const relatorios = [
  ['solicitacoes', 'Solicitações'],
  ['eventos-aprovados', 'Palestras/eventos aprovados'],
  ['usuarios', 'Usuários'],
];

export default function RelatoriosView() {
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({ dataInicial: '', dataFinal: '', cursoId: '', temaId: '' });
  const [opcoes, setOpcoes] = useState({ cursos: [], temas: [] });
  const [consulta, setConsulta] = useState([]);
  useEffect(() => {
    api.getRelatorioFiltros().then(([temas, cursos]) => {
      if (temas.ok && cursos.ok) setOpcoes({ temas: temas.data, cursos: cursos.data });
    });
  }, []);
  const alterar = (campo) => (evento) => setFiltros({ ...filtros, [campo]: evento.target.value });
  const consultar = async (tipo) => {
    const resposta = await api.consultarRelatorio(tipo, filtros);
    if (resposta.ok) setConsulta(resposta.data);
    else setErro(resposta.data?.error || 'Não foi possível consultar.');
  };
  const baixar = async (tipo) => {
    setErro('');
    try {
      const resposta = await api.relatorio(tipo, filtros);
      if (!resposta.ok) throw new Error('Não foi possível emitir o relatório.');
      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tipo}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErro(error.message);
    }
  };
  return <main className="event-page">
    <h1>Relatórios</h1>
    <p>Consulte e exporte informações administrativas em formato CSV.</p>
    {erro && <p className="event-error" role="alert">{erro}</p>}
    <div className="event-form report-filters">
      <strong>Filtros dos eventos</strong>
      <div className="event-form-row">
        <label>Data inicial<input type="date" value={filtros.dataInicial} onChange={alterar('dataInicial')} /></label>
        <label>Data final<input type="date" value={filtros.dataFinal} onChange={alterar('dataFinal')} /></label>
      </div>
      <div className="event-form-row">
        <label>Curso / coordenação<select value={filtros.cursoId} onChange={alterar('cursoId')}><option value="">Todos</option>{opcoes.cursos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <label>Tema<select value={filtros.temaId} onChange={alterar('temaId')}><option value="">Todos</option>{opcoes.temas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      </div>
      <button type="button" onClick={() => { setFiltros({ dataInicial: '', dataFinal: '', cursoId: '', temaId: '' }); setConsulta([]); }}>Limpar filtros</button>
    </div>
    <div className="event-request-list">
      {relatorios.map(([tipo, titulo]) => <article className="event-request" key={tipo}>
        <h2>{titulo}</h2>
        <div className="event-decision"><button type="button" onClick={() => consultar(tipo)}>Consultar</button><button className="event-primary" onClick={() => baixar(tipo)}>Exportar CSV</button></div>
      </article>)}
    </div>
    {consulta.length > 0 && <div className="cadastro-list"><h2>Eventos encontrados</h2>{consulta.map((evento) => <article className="cadastro-card" key={evento.id}><div><h2>{evento.titulo}</h2><p>{new Date(evento.inicio).toLocaleDateString('pt-BR')} · {new Date(evento.inicio).toLocaleTimeString('pt-BR')} até {new Date(evento.fim).toLocaleTimeString('pt-BR')}</p><p>{evento.temaRef?.nome || evento.tema} · {evento.curso?.nome || 'Sem curso'} · {evento.local}</p><p>Solicitante: {evento.solicitante?.name} · Status: {evento.status}</p></div></article>)}</div>}
  </main>;
}
