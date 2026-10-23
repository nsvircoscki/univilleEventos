import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import './theme.css';

function temaInicial() {
  try {
    const salvo = localStorage.getItem('univille:tema');
    if (['light', 'dark'].includes(salvo)) return salvo;
  } catch { /* modo privado */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export default function ThemeToggle({ floating = false }) {
  const [tema, setTema] = useState(temaInicial);
  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.documentElement.style.colorScheme = tema;
  }, [tema]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const acompanhar = () => {
      try { if (localStorage.getItem('univille:tema')) return; } catch { /* sem storage */ }
      setTema(media.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', acompanhar);
    return () => media.removeEventListener('change', acompanhar);
  }, []);
  const alternar = () => {
    const proximo = tema === 'dark' ? 'light' : 'dark';
    setTema(proximo);
    try { localStorage.setItem('univille:tema', proximo); } catch { /* mantém nesta página */ }
  };
  const rotulo = tema === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';
  return <button className={`theme-toggle ${floating ? 'theme-floating' : ''}`} type="button" aria-label={rotulo} title={rotulo} onClick={alternar}>
    {tema === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
  </button>;
}
