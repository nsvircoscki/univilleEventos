import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './Dropdown.css';

export default function Dropdown({ label, value, onChange, options, icon, span = 1 }) {
  const id = useId();
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const opcoes = options.map((o) => typeof o === 'string' ? { value: o, label: o } : o);
  const escolhida = opcoes.find((o) => o.value === value);
  useEffect(() => {
    if (!open) return;
    const fechar = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', fechar);
    return () => document.removeEventListener('pointerdown', fechar);
  }, [open]);
  const abrir = () => { setActive(Math.max(0, opcoes.findIndex((o) => o.value === value))); setOpen(true); };
  const escolher = (indice) => { if (opcoes[indice]) onChange(opcoes[indice].value); setOpen(false); };
  const teclado = (e) => {
    if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(e.key)) return;
    e.preventDefault();
    if (!open) { abrir(); return; }
    if (e.key === 'ArrowDown') setActive((a) => Math.min(opcoes.length - 1, a + 1));
    if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1));
    if (e.key === 'Home') setActive(0);
    if (e.key === 'End') setActive(opcoes.length - 1);
    if (e.key === 'Enter' || e.key === ' ') escolher(active);
  };
  return <div className="styled-dropdown" ref={root} style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}
    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <label htmlFor={id}>{icon}{label}</label>
    <button id={id} className="styled-dropdown-trigger" type="button" role="combobox" aria-label={label}
      aria-expanded={open} aria-haspopup="listbox" aria-controls={id + '-list'} aria-activedescendant={open && opcoes.length ? id + '-option-' + active : undefined}
      onKeyDown={teclado} onClick={() => open ? setOpen(false) : abrir()}>
      <span>{escolhida?.label || 'Selecione…'}</span><ChevronDown size={16} aria-hidden="true" className={open ? 'rotated' : ''} />
    </button>
    {open && <ul id={id + '-list'} className="styled-dropdown-list" role="listbox" aria-label={label}>
      {opcoes.map((opcao, indice) => <li key={opcao.value} id={id + '-option-' + indice} role="option" aria-selected={opcao.value === value}
        className={`styled-option ${active === indice ? 'active' : ''}`} onPointerDown={(e) => e.preventDefault()}
        onMouseEnter={() => setActive(indice)} onClick={() => escolher(indice)}>
        <span>{opcao.label}</span>{opcao.value === value && <Check size={16} aria-hidden="true" />}
      </li>)}
    </ul>}
  </div>;
}
