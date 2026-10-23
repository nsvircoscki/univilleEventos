import { useEffect, useState } from 'react';
import { api } from '../services/api';

const tipos = [
  ['temas', 'Temas'],
  ['ambientes', 'Ambientes'],
  ['recursos', 'Recursos'],
  ['cursos', 'Cursos / coordenações'],
];
export default function CadastrosView() {
  const [tipo, setTipo] = useState('temas');
  const [itens, setItens] = useState([]);
  const [nome, setNome] = useState('');
  const [centroCusto, setCentroCusto] = useState('');
  const [recursos, setRecursos] = useState([]);
  const [recursosSelecionados, setRecursosSelecionados] = useState([]);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');
  const carregar = async () => { const res = await api.getCadastros(tipo); if (res.ok) setItens(res.data); else setErro(res.data?.error || 'Não foi possível carregar.'); };
  useEffect(() => { carregar(); if (tipo === 'ambientes') api.getCadastros('recursos').then((res) => { if (res.ok) setRecursos(res.data); }); }, [tipo]);
  const criar = async (e) => {
    e.preventDefault(); const dados = tipo === 'cursos' ? { nome, centroCusto } : { nome, recursos: recursosSelecionados };
    const res = await api.criarCadastro(tipo, dados);
    if (!res.ok) { setErro(res.data?.error || 'Não foi possível salvar.'); return; }
    setNome(''); setCentroCusto(''); setRecursosSelecionados([]); setEditando(null); setErro(''); carregar();
  };
  const iniciarEdicao = (item) => {
    setEditando(item);
    setNome(item.nome);
    setCentroCusto(item.centroCusto || '');
    setRecursosSelecionados(item.recursos?.map((vinculo) => vinculo.recursoId) || []);
    setErro('');
  };
  const salvarEdicao = async (e) => {
    e.preventDefault();
    const dados = tipo === 'cursos' ? { nome, centroCusto } : { nome, recursos: recursosSelecionados };
    const res = await api.atualizarCadastro(tipo, editando.id, dados);
    if (!res.ok) setErro(res.data?.error || 'Não foi possível editar.'); else { setEditando(null); setNome(''); setCentroCusto(''); setRecursosSelecionados([]); setErro(''); carregar(); }
  };
  const excluir = async (id) => { const res = await api.excluirCadastro(tipo, id); if (!res.ok) setErro(res.data?.error || 'Não foi possível excluir.'); else carregar(); };
  return <main className="event-page"><h1>Cadastros auxiliares</h1><p>Gerencie os dados usados nas solicitações. Cadastros vinculados não podem ser excluídos.</p>
    <div className="event-filters"><label>Tipo<select value={tipo} onChange={(e) => setTipo(e.target.value)}>{tipos.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <form className="event-form cadastro-form" onSubmit={editando ? salvarEdicao : criar}><div className="cadastro-form-heading"><strong>{editando ? `Editando: ${editando.nome}` : `Novo ${tipos.find(([value]) => value === tipo)?.[1].toLowerCase()}`}</strong>{editando && <button type="button" onClick={() => { setEditando(null); setNome(''); setCentroCusto(''); setRecursosSelecionados([]); }}>Cancelar edição</button>}</div><label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} /></label>
      {tipo === 'cursos' && <label>Centro de custo<input value={centroCusto} onChange={(e) => setCentroCusto(e.target.value)} required maxLength={80} /></label>}
      {tipo === 'ambientes' && <fieldset><legend>Recursos disponíveis</legend><div className="resource-options">{recursos.map((item) => <label key={item.id} className="resource-option"><input type="checkbox" checked={recursosSelecionados.includes(item.id)} onChange={(e) => setRecursosSelecionados(e.target.checked ? [...recursosSelecionados, item.id] : recursosSelecionados.filter((id) => id !== item.id))} />{item.nome}</label>)}</div></fieldset>}
      <button className="event-primary">{editando ? 'Salvar alterações' : 'Cadastrar'}</button></form>
    {erro && <p className="event-error" role="alert">{erro}</p>}
    <div className="cadastro-list">{itens.map((item) => <article className="cadastro-card" key={item.id}><div><h2>{item.nome}</h2>{item.centroCusto && <p>Centro de custo: {item.centroCusto}</p>}{tipo === 'ambientes' && <p>Recursos: {item.recursos?.length ? item.recursos.map((vinculo) => vinculo.recurso.nome).join(', ') : 'Nenhum recurso associado'}</p>}</div><div className="cadastro-card-actions"><button type="button" onClick={() => iniciarEdicao(item)}>Editar</button><button type="button" className="event-reject" onClick={() => excluir(item.id)}>Excluir</button></div></article>)}</div>
  </main>;
}
