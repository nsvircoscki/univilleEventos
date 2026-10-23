import marcaBranca from '../assets/brand/univille-horizontal-branca.png';
import marcaOriginal from '../assets/brand/univille-horizontal.png';

export default function BrandLogo({ negativa = false, className = '' }) {
  return <img className={`brand-logo ${className}`} src={negativa ? marcaBranca : marcaOriginal}
    alt="Univille" width="1178" height="335" draggable="false" />;
}

export function BrandBar({ children }) {
  return <div className="brand-bar"><BrandLogo negativa />{children}</div>;
}
