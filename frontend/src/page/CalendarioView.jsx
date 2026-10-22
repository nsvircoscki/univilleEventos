import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './calendario.css';

export const chaveData = (dia) => `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
export function diasDoMes(mes) {
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const primeiraCelula = new Date(mes.getFullYear(), mes.getMonth(), 1 - inicio.getDay());
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
  return Array.from({ length: Math.ceil((inicio.getDay() + ultimoDia.getDate()) / 7) * 7 }, (_, i) =>
    new Date(primeiraCelula.getFullYear(), primeiraCelula.getMonth(), primeiraCelula.getDate() + i));
}
export default function CalendarioView() {
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selecionado, setSelecionado] = useState(() => chaveData(new Date()));
  const hoje = chaveData(new Date());
  const mudarMes = (passo) => setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() + passo, 1));
  return <main className="agenda">
    <h1>Calendário</h1>
    <p>Selecione uma data para consultar a agenda.</p>
    <div className="calendar-toolbar">
      <button onClick={() => mudarMes(-1)} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
      <h2 aria-live="polite">{mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
      <button onClick={() => mudarMes(1)} aria-label="Próximo mês"><ChevronRight size={18} /></button>
      <button onClick={() => { const agora = new Date(); setMes(new Date(agora.getFullYear(), agora.getMonth(), 1)); setSelecionado(chaveData(agora)); }}>Hoje</button>
      <label>Mês <input type="month" value={chaveData(mes).slice(0, 7)} onChange={(e) => {
        if (!e.target.value) return;
        const [ano, numeroMes] = e.target.value.split('-').map(Number);
        setMes(new Date(ano, numeroMes - 1, 1));
      }} /></label>
    </div>
    <div className="calendar-scroll"><div className="calendar-grid">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => <div className="weekday" key={dia}>{dia}</div>)}
      {diasDoMes(mes).map((dia) => {
        const chave = chaveData(dia);
        return <motion.button key={chave} type="button" whileHover={{ backgroundColor: '#f0f6ff' }}
          aria-label={dia.toLocaleDateString('pt-BR')} aria-pressed={chave === selecionado}
          onClick={() => setSelecionado(chave)}
          className={`calendar-day ${dia.getMonth() !== mes.getMonth() ? 'outside' : ''} ${chave === hoje ? 'today' : ''} ${chave === selecionado ? 'selected' : ''}`}>
          <span>{dia.getDate()}</span>
        </motion.button>;
      })}
    </div></div>
    <section className="calendar-detail" aria-live="polite">
      <h2>{new Date(`${selecionado}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
      <p>O cadastro e a consulta de reservas serão disponibilizados nesta agenda.</p>
    </section>
  </main>;
}
