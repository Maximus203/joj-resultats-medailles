import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { BrandBand } from '@/components/cachet/brand-band';
import { IconSprite } from '@/components/cachet/icons';
import { EmptyState, OfflineBar } from '@/components/cachet/states';
import { AppTabs } from '@/components/cachet/tabs';
import { FreshnessBanner } from '@/features/scraping/components/freshness-banner';
import { useOnlineStatus } from '@/lib/use-online-status';

/** Lien d'évitement : place le focus sur le contenu sans toucher à l'adresse de la page. */
function SkipLink() {
  return (
    <a
      className="lien-evitement"
      href="#contenu"
      onClick={(event) => {
        event.preventDefault();
        document.getElementById('contenu')?.focus();
      }}
    >
      Aller au contenu
    </a>
  );
}

function RootLayout() {
  const online = useOnlineStatus();
  return (
    <>
      <IconSprite />
      <SkipLink />
      {online ? null : (
        <OfflineBar>
          Hors ligne. Les résultats affichés sont ceux reçus avant la coupure ; rien ne s’enregistre
          tant que vous êtes hors ligne.
        </OfflineBar>
      )}
      <div className="app">
        <FreshnessBanner />
        <Outlet />
        <AppTabs />
      </div>
    </>
  );
}

function NotFound() {
  return (
    <>
      <BrandBand variant="ardoise" surtitre="Erreur 404" title="Page introuvable" />
      <main className="page" id="contenu" tabIndex={-1}>
        <EmptyState title="Cette page n’existe pas">
          <p>L’adresse est peut-être mal recopiée, ou la page a été déplacée.</p>
          <Link className="bouton bouton-secondaire" to="/">
            Retour à l’accueil
          </Link>
        </EmptyState>
      </main>
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound });
