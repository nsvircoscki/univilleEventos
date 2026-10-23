import { useEffect } from 'react';
import BrandLogo from './BrandLogo';

export default function IntroScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return <div className="intro-screen" role="status" aria-label="Abrindo a agenda Univille">
    <div className="intro-content">
      <BrandLogo negativa className="intro-logo" />
    </div>
  </div>;
}
