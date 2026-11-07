import { Link, useRouterState } from '@tanstack/react-router';
import { Icon } from './icons';

/** Barre d'onglets basse (mobile) : le troisième onglet n'apparaît que dans l'espace journaliste. */
export function AppTabs() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const inNewsroom = pathname.startsWith('/journaliste');
  return (
    <nav className="onglets" aria-label="Navigation principale (onglets)">
      <div className="onglets-liste">
        <Link className="onglet" to="/" activeOptions={{ exact: true }}>
          <Icon name="logo" />
          Accueil
        </Link>
        <Link className="onglet" to="/resultats">
          <Icon name="jour" />
          Résultats
        </Link>
        <Link className="onglet" to="/medailles">
          <Icon name="medailles" />
          Médailles
        </Link>
        {inNewsroom ? (
          <Link className="onglet" to="/journaliste">
            <Icon name="saisie" />
            Journaliste
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
