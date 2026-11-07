import { Link } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { Icon } from './icons';

export type BandVariant = 'rouge' | 'orange' | 'ardoise';

/** Mot-symbole composé pour le projet : aucun emblème officiel n'est repris. */
function Wordmark() {
  return (
    <span className="marque-mot">
      <Icon name="logo" />
      <b>JOJ Dakar 2026</b>
    </span>
  );
}

/** Bandeau de marque : motif, carte blanche (mot-symbole, logo du Hub, navigation), puis le titre. */
export function BrandBand({
  variant,
  surtitre,
  title,
  children,
}: {
  variant: BandVariant;
  /** Avec `title`, le titre standard d'une page. Sans `title`, `children` porte le contenu (accueil). */
  surtitre?: string;
  title?: string;
  children?: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title ?? 'Accueil'} · JOJ Dakar 2026`;
  }, [title]);
  return (
    <header className={`bandeau-marque bandeau-marque--${variant}`}>
      <div className="carte-marque">
        <Link className="marque" to="/" aria-label="JOJ Dakar 2026, accueil">
          <Wordmark />
        </Link>
        <div className="sous-marque">
          <small>Résultats et médailles · non officiel</small>
          <img
            className="logo-hub"
            src="/senegal-ai-scaling-hub.png"
            alt="Sénégal AI Scaling Hub"
            width={480}
            height={142}
          />
        </div>
        <nav className="nav-haut" aria-label="Navigation principale">
          <Link to="/" activeOptions={{ exact: true }}>
            Accueil
          </Link>
          <Link to="/resultats">Résultats</Link>
          <Link to="/medailles">Médailles</Link>
        </nav>
        <Link className="lien-pro" to="/journaliste" activeProps={{ className: 'lien-pro actif' }}>
          Espace journaliste
        </Link>
      </div>
      {title ? (
        <div className="titre-bandeau page-titre">
          {surtitre ? <span className="surtitre">{surtitre}</span> : null}
          <h1>{title}</h1>
        </div>
      ) : (
        children
      )}
    </header>
  );
}
