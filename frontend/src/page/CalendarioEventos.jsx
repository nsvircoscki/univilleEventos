import { useLayoutEffect, useEffect, useRef } from 'react';
import { X, MapPin, Clock, FileText } from 'lucide-react';

export const horaEvento = (data) => new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export function eventosNoDia(eventos, dia) {
  const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const fim = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  return eventos.filter((e) => new Date(e.inicio) < fim && new Date(e.fim) > inicio);
}
export function GradeHorarios({ dias, eventos, selecionar, selecionado, hoje, chaveData, onDetalhe }) {
  const scroll = useRef(null);
  useEffect(() => { scroll.current.scrollTop = 7 * 48; }, [dias.length]);
  return <div className="schedule-scroll" ref={scroll}>
    <div className={`schedule ${dias.length === 1 ? 'schedule-day' : ''}`} style={{ '--dias': dias.length }}>
      <div className="schedule-heading"><span>Horário</span>{dias.map((dia) => <button key={chaveData(dia)} onClick={() => selecionar(dia)} aria-pressed={chaveData(dia) === selecionado} className={chaveData(dia) === hoje ? 'today' : ''}>
        <span>{dia.toLocaleDateString('pt-BR', { weekday: 'short' })}</span><strong>{dia.getDate()}</strong></button>)}</div>
      <div className="schedule-board"><div className="schedule-labels">{Array.from({ length: 24 }, (_, h) => <span key={h}>{String(h).padStart(2, '0')}:00</span>)}</div>
        {dias.map((dia) => {
          const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
          const fimDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
          const finais = [];
          const blocos = eventosNoDia(eventos, dia).sort((a, b) => new Date(a.inicio) - new Date(b.inicio)).map((evento) => {
            const inicio = Math.max(+new Date(evento.inicio), +inicioDia);
            const fim = Math.min(+new Date(evento.fim), +fimDia);
            let coluna = finais.findIndex((valor) => valor <= inicio);
            if (coluna === -1) coluna = finais.length;
            finais[coluna] = fim;
            return { evento, inicio, fim, coluna };
          });
          return <div key={chaveData(dia)} className={`schedule-column ${[0, 6].includes(dia.getDay()) ? 'weekend' : ''}`}>
            {blocos.map(({ evento, inicio, fim, coluna }) => <button key={evento.id} className="schedule-event" onClick={() => onDetalhe(evento)}
              style={{ top: `${(inicio - inicioDia) / (fimDia - inicioDia) * 100}%`, height: `${(fim - inicio) / (fimDia - inicioDia) * 100}%`, left: `${coluna / finais.length * 100}%`, width: `${100 / finais.length}%` }}
              title={`${evento.titulo} · ${evento.local} · ${horaEvento(evento.inicio)}–${horaEvento(evento.fim)}`}>
              <strong>{evento.titulo}</strong><span>{horaEvento(evento.inicio)}–{horaEvento(evento.fim)}</span><span>{evento.local}</span>
            </button>)}
          </div>;
        })}
      </div>
    </div>
  </div>;
}
export function DetalheEvento({ evento, onClose }) {
  const dialog = useRef(null);
  useLayoutEffect(() => {
    const elemento = dialog.current;
    elemento.showPopover();
    const caixa = elemento.getBoundingClientRect();
    const ancora = evento.ancora;
    const esquerda = ancora ? ancora.left : (window.innerWidth - caixa.width) / 2;
    const acima = ancora && ancora.bottom + caixa.height + 8 > window.innerHeight;
    const topo = ancora ? (acima ? ancora.top - caixa.height - 8 : ancora.bottom + 8) : (window.innerHeight - caixa.height) / 2;
    elemento.style.left = Math.max(12, Math.min(esquerda, window.innerWidth - caixa.width - 12)) + 'px';
    elemento.style.top = Math.max(12, Math.min(topo, window.innerHeight - caixa.height - 12)) + 'px';
  }, [evento]);
  return <div popover="auto" role="dialog" aria-labelledby="event-popover-title" className="event-popover" ref={dialog}
    onToggle={(e) => { if (e.newState === 'closed') onClose(); }}>
    <button className="event-popover-close" aria-label="Fechar detalhes do evento" onClick={onClose}><X size={18} /></button>
    <h2 id="event-popover-title">{evento.titulo}</h2>
    <p><MapPin size={16} aria-hidden="true" />{evento.local}</p>
    <p><Clock size={16} aria-hidden="true" /><span>{new Date(evento.inicio).toLocaleString('pt-BR')}<br />até {new Date(evento.fim).toLocaleString('pt-BR')}</span></p>
    <div className="event-popover-description"><strong><FileText size={16} aria-hidden="true" />Descrição</strong><p>{evento.descricao?.trim() || 'Nenhuma descrição informada.'}</p></div>
  </div>;
}
