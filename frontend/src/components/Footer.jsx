import BrandLogo from './BrandLogo';
import { AtSign, Phone, MessageCircle, ExternalLink } from 'lucide-react';
import emec from '../assets/footer/e-mec.jpg';
import formando from '../assets/footer/formando.svg';
import redes from '../assets/footer/redes.svg';
import './Footer.css';

const base = 'https://seja.univille.br';
function Link({ href, children, ...props }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
}
function Grupo({ titulo, links }) {
  return <section className="footer-links"><h2>{titulo}</h2><ul>{links.map(([nome, href]) => <li key={nome}><Link href={href}>{nome}</Link></li>)}</ul></section>;
}
export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-content">
      <section className="footer-brand"><BrandLogo negativa /><p>Conhecimento, experiências e oportunidades para aprender e transformar o futuro em todas as fases da vida.</p>
        <Link href="https://aluno.univille.br/" className="footer-student"><AtSign size={17} aria-hidden="true" />Área do Aluno</Link>
      </section>
      <Grupo titulo="Áreas de Interesse" links={[
        ['Arquitetura e Engenharias', base + '/cursos/?un_interesse=engenharias'], ['Artes Comunicação Design', base + '/cursos/?un_interesse=design'],
        ['Ciências Jurídicas', base + '/cursos/?un_interesse=ciencias-juridicas'], ['Gestão e Hospitalidade', base + '/cursos/?un_interesse=gestao'],
        ['Licenciaturas', base + '/cursos/?un_interesse=licenciaturas'], ['Saúde e Meio Ambiente', base + '/cursos/?un_interesse=saude'], ['TI', base + '/cursos/?un_interesse=ti'],
      ]} />
      <div className="footer-groups">
        <Grupo titulo="Ingresse" links={[[ 'Como ingressar', base + '/como-ingressar/' ]]} />
        <Grupo titulo="Formato" links={[[ 'EaD', base + '/modalidade-ead/' ], ['Semipresencial', base + '/modalidade-hibrida/'], ['Presencial', base + '/modalidade-presencial/']]} />
        <Grupo titulo="Benefícios/Incentivos Univille" links={[[ 'Bolsas de Estudo', base + '/bolsas-e-financiamento/' ], ['Crédito Universitário', base + '/bolsas-e-financiamento/#credito'], ['Programas de Incentivos', base + '/bolsas-e-financiamento/#programas']]} />
      </div>
      <section className="footer-links footer-contact"><h2>Fale com a gente</h2>
        <ul><li><Link href={base + '/contato/'}>Fale Conosco</Link></li>
          <li><a href="tel:+554734619000"><Phone size={13} aria-hidden="true" />47 3461 9000</a></li>
          <li><Link href="https://wa.me/5547988367106"><MessageCircle size={13} aria-hidden="true" />(47) 98836-7106</Link></li>
          <li className="footer-accessibility"><Link href={base + '/acessibilidade/'}>Acessibilidade</Link></li></ul>
      </section>
      <div className="footer-emec"><Link href="https://emec.mec.gov.br/emec/consulta-cadastro/detalhamento/d96957f455f6405d14c6542552b0f6eb/ODE=" aria-label="Consultar cadastro da Univille no e-MEC"><img src={emec} alt="Consulta e-MEC" width="108" height="167" loading="lazy" /></Link>
        <img className="footer-graduate" src={formando} alt="" width="199" height="228" loading="lazy" />
      </div>
    </div>
    <div className="footer-social-band"><div className="footer-social">
      {[['facebook', 'Facebook', 'https://www.facebook.com/Univille'], ['instagram', 'Instagram', 'https://www.instagram.com/univille/'],
        ['twitter', 'Twitter', 'https://twitter.com/Univille'], ['linkedin', 'LinkedIn', 'https://www.linkedin.com/company/univille/'], ['youtube', 'YouTube', 'https://www.youtube.com/@univille']].map(([id, nome, url]) =>
        <Link key={id} href={url} aria-label={nome}><svg width="18" height="18" aria-hidden="true"><use href={`${redes}#icon-${id}`} /></svg></Link>)}
    </div></div>
    <div className="footer-copyright">© {new Date().getFullYear()} Univille · Agenda de eventos<span aria-hidden="true"> | </span><Link href="https://www.univille.edu.br/lgpd">Política de privacidade<ExternalLink size={11} aria-hidden="true" /></Link></div>
  </footer>;
}
