import { useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import './calendario.css';
import { GradeHorarios, DetalheEvento, eventosNoDia, horaEvento } from './CalendarioEventos';

export const chaveData = (dia) => `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
export function diasDoMes(mes) {
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const primeiraCelula = new Date(mes.getFullYear(), mes.getMonth(), 1 - inicio.getDay());
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
  return Array.from({ length: Math.ceil((inicio.getDay() + ultimoDia.getDate()) / 7) * 7 }, (_, i) =>
    new Date(primeiraCelula.getFullYear(), primeiraCelula.getMonth(), primeiraCelula.getDate() + i));
}
const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const dataLocal = (chave) => new Date(`${chave}T12:00:00`);
const primeiroDoMes = (dia) => new Date(dia.getFullYear(), dia.getMonth(), 1);
const indiceMes = (dia) => dia.getFullYear() * 12 + dia.getMonth();

export default function CalendarioView({ eventos = [], erro, onRecarregar, onSolicitar, autenticado = false, publicoLimitado = false, podeEditar = false, onEditar }) {
  const [mes, setMes] = useState(() => primeiroDoMes(new Date()));
  const [selecionado, setSelecionado] = useState(() => chaveData(new Date()));
  const [visualizacao, setVisualizacao] = useState('mes');
  const [detalhe, setDetalhe] = useState(null);
  const hoje = chaveData(new Date());
  const mesAtual = primeiroDoMes(new Date());
  const limiteMesPublico = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 2, 1);
  const mesAtualIndice = indiceMes(mesAtual);
  const limiteMesPublicoIndice = indiceMes(limiteMesPublico);
  const dataSelecionada = dataLocal(selecionado);
  const selecionar = (dia) => {
    const mesSelecionado = primeiroDoMes(dia);
    if (publicoLimitado && (indiceMes(mesSelecionado) < mesAtualIndice || indiceMes(mesSelecionado) > limiteMesPublicoIndice)) return;
    setSelecionado(chaveData(dia)); setMes(mesSelecionado);
  };
  const mudarPeriodo = (passo) => {
    const proximoIndice = indiceMes(mes) + passo;
    if (publicoLimitado && (proximoIndice < mesAtualIndice || proximoIndice > limiteMesPublicoIndice)) return;
    if (visualizacao === 'ano') {
      selecionar(new Date(mes.getFullYear() + passo, mes.getMonth(), 1));
    } else if (visualizacao === 'mes') {
      const proximo = new Date(mes.getFullYear(), mes.getMonth() + passo, 1);
      setMes(proximo);
      setSelecionado(chaveData(new Date(proximo.getFullYear(), proximo.getMonth(), Math.min(dataSelecionada.getDate(), new Date(proximo.getFullYear(), proximo.getMonth() + 1, 0).getDate()))));
    } else {
      const dia = dataLocal(selecionado);
      dia.setDate(dia.getDate() + passo * (visualizacao === 'semana' ? 7 : 1));
      selecionar(dia);
    }
  };
  const inicioSemana = dataLocal(selecionado);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const diasVisiveis = visualizacao === 'mes' ? diasDoMes(mes) : visualizacao === 'dia' ? [dataSelecionada]
    : Array.from({ length: 7 }, (_, i) => new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate() + i));
  const titulo = visualizacao === 'ano' ? String(mes.getFullYear()) : visualizacao === 'dia'
    ? dataSelecionada.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : visualizacao === 'semana'
      ? `${diasVisiveis[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} – ${diasVisiveis[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return <main className="agenda">
    <div className="agenda-heading">
      <div><h1>Calendário de eventos</h1><p>Organize seus encontros em um só lugar.</p></div>
      {autenticado && <button className="calendar-request-button" onClick={() => onSolicitar(selecionado)}><CalendarPlus size={20} strokeWidth={1.4} aria-hidden="true" />Solicitar evento</button>}
    </div>
    <div className="agenda-workspace">
      <aside className="agenda-sidebar" aria-label="Navegação por data">
        <section className="mini-calendar">
          <div className="mini-calendar-heading"><h2>{mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            <div><button disabled={publicoLimitado && indiceMes(mes) <= mesAtualIndice} onClick={() => mudarPeriodo(-1)} aria-label="Mês anterior no calendário pequeno"><ChevronLeft size={16} /></button>
              <button disabled={publicoLimitado && indiceMes(mes) >= limiteMesPublicoIndice} onClick={() => mudarPeriodo(1)} aria-label="Próximo mês no calendário pequeno"><ChevronRight size={16} /></button></div>
          </div>
          <div className="mini-grid">
            {diasSemana.map((dia) => <span className="mini-weekday" key={dia}>{dia.slice(0, 1)}</span>)}
            {diasDoMes(mes).map((dia) => <button key={chaveData(dia)} type="button"
              className={`${dia.getMonth() !== mes.getMonth() ? 'outside' : ''} ${chaveData(dia) === hoje ? 'today' : ''}`}
              aria-label={dia.toLocaleDateString('pt-BR')} aria-pressed={chaveData(dia) === selecionado}
              disabled={publicoLimitado && (indiceMes(dia) < mesAtualIndice || indiceMes(dia) > limiteMesPublicoIndice)}
              onClick={() => selecionar(dia)}>{dia.getDate()}</button>)}
          </div>
        </section>
        <section className="agenda-selected"><span className="agenda-eyebrow">DATA SELECIONADA</span>
          <strong>{dataSelecionada.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</strong>
          <span>{dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric' })}</span>
        </section>
        <section className="sidebar-events"><h2>Eventos do dia</h2>{eventosNoDia(eventos, dataSelecionada).length === 0 ? <p>Nenhum evento aprovado nesta data.</p> : eventosNoDia(eventos, dataSelecionada).map((evento) => <button key={evento.id} onClick={() => setDetalhe(evento)}><strong>{evento.titulo}</strong><span>{horaEvento(evento.inicio)} · {evento.local}</span></button>)}</section>
      </aside>
      <section className="calendar-panel" aria-label="Calendário de eventos">
        <div className="calendar-toolbar">
          <div className="calendar-period"><button className="today-button" onClick={() => selecionar(new Date())}>Hoje</button>
            <div className="calendar-arrows"><button disabled={publicoLimitado && indiceMes(mes) <= mesAtualIndice} onClick={() => mudarPeriodo(-1)} aria-label="Período anterior"><ChevronLeft size={18} /></button>
              <button disabled={publicoLimitado && indiceMes(mes) >= limiteMesPublicoIndice} onClick={() => mudarPeriodo(1)} aria-label="Próximo período"><ChevronRight size={18} /></button></div>
            <h2 aria-live="polite">{titulo}</h2>
          </div>
          <div className="calendar-view-switch" role="group" aria-label="Visualização do calendário">
            {[['mes', 'Mês'], ...(!publicoLimitado ? [['semana', 'Semana'], ['dia', 'Dia'], ['ano', 'Ano']] : [])].map(([valor, rotulo]) =>
              <button key={valor} aria-pressed={visualizacao === valor} onClick={() => setVisualizacao(valor)}>{rotulo}</button>)}
          </div>
        </div>
        {erro && <div className="calendar-load-error" role="alert">{erro} <button onClick={onRecarregar}>Tentar novamente</button></div>}
        <div className={`calendar-scroll view-${visualizacao}`}>
          {visualizacao === 'ano' ? <div className="year-grid">{Array.from({ length: 12 }, (_, indice) => {
            const mesAno = new Date(mes.getFullYear(), indice, 1);
            return <section key={indice} className="year-month"><button className="year-month-title" onClick={() => { selecionar(mesAno); setVisualizacao('mes'); }}>{mesAno.toLocaleDateString('pt-BR', { month: 'long' })}</button>
              <div className="mini-grid">{diasSemana.map((dia) => <span key={dia} className="mini-weekday">{dia.slice(0, 1)}</span>)}
                {diasDoMes(mesAno).map((dia) => <button key={chaveData(dia)} className={`${dia.getMonth() !== indice ? 'outside' : ''} ${chaveData(dia) === hoje ? 'today' : ''} ${eventosNoDia(eventos, dia).length ? 'has-events' : ''}`} aria-label={dia.toLocaleDateString('pt-BR')} aria-pressed={chaveData(dia) === selecionado} onClick={() => { selecionar(dia); setVisualizacao('dia'); }}>{dia.getDate()}</button>)}
              </div></section>;
          })}</div> : visualizacao === 'mes' ? <div className="calendar-grid">
            {diasSemana.map((dia) => <div className="weekday" key={dia}>{dia}</div>)}
            {diasVisiveis.map((dia) => {
              const chave = chaveData(dia);
              return <div key={chave} onClick={() => selecionar(dia)}
                className={`calendar-day ${dia.getMonth() !== mes.getMonth() ? 'outside' : ''} ${chave === hoje ? 'today' : ''} ${chave === selecionado ? 'selected' : ''}`}>
                <button className="month-day-number" aria-label={dia.toLocaleDateString('pt-BR')} aria-pressed={chave === selecionado} onClick={() => selecionar(dia)}>{dia.getDate()}</button>
                <div className="month-events">{eventosNoDia(eventos, dia).slice(0, 3).map((evento) => <button className="month-event" key={evento.id}
                  aria-haspopup="dialog" aria-label={`${horaEvento(evento.inicio)} ${evento.titulo}`} onClick={(e) => {
                    e.stopPropagation(); setDetalhe({ ...evento, ancora: e.currentTarget.getBoundingClientRect() });
                  }}>{horaEvento(evento.inicio)} {evento.titulo}</button>)}{eventosNoDia(eventos, dia).length > 3 && <button className="month-more" onClick={() => { selecionar(dia); setVisualizacao('dia'); }}>+{eventosNoDia(eventos, dia).length - 3} eventos</button>}</div>
              </div>;
            })}
          </div> : <GradeHorarios dias={diasVisiveis} eventos={eventos} selecionar={selecionar} selecionado={selecionado} hoje={hoje} chaveData={chaveData} onDetalhe={setDetalhe} />}
        </div>
        <div className="calendar-footer"><span><i /> Hoje</span><span>Selecione uma data para consultar a agenda</span></div>
      </section>
    </div>
    {detalhe && <DetalheEvento evento={detalhe} onClose={() => setDetalhe(null)} podeEditar={podeEditar} onEditar={onEditar} />}
  </main>;
}
