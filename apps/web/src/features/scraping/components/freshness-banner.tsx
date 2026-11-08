import type { ScrapeStatus } from '@joj/shared';
import { useEffect, useState } from 'react';
import { StateBanner } from '@/components/cachet/states';
import { ApiError } from '@/lib/api';
import { formatClockTime, isImportExpected } from '@/lib/dates';
import { useScrapeStatus } from '../api/scraping';

const CLOCK_MS = 60_000;

/** L'heure courante, rafraîchie chaque minute : le bandeau ne doit pas figer une fraîcheur. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

const CANNOT_CHECK = 'Impossible de vérifier la fraîcheur des données';

/** Le bandeau lui-même : l'heure de la dernière mise à jour, ou un avertissement si elle est en retard. */
export function FreshnessMessage({ status, now }: { status: ScrapeStatus; now: Date }) {
  if (!status.enabled) return null;
  if (!status.lastSuccessAt) {
    // Le cas le plus grave : aucun import n'a jamais réussi. Rien à afficher s'il n'est pas encore en retard.
    return status.stale ? (
      <StateBanner tone="alerte" title="Aucune mise à jour réussie pour l’instant" role="status">
        <p>Les résultats peuvent être incomplets. Revenez dans quelques minutes.</p>
      </StateBanner>
    ) : null;
  }
  const hour = formatClockTime(status.lastSuccessAt, status.schedule.timeZone);
  // Le serveur a pu dire « à jour » il y a un moment : on recompte avec l'heure courante.
  const tooOld =
    now.getTime() - Date.parse(status.lastSuccessAt) > status.schedule.staleAfterMinutes * 60_000 &&
    isImportExpected(now, status.schedule);
  if (status.stale || tooOld) {
    return (
      <StateBanner tone="alerte" title="Les résultats sont peut-être en retard" role="status">
        <p>{`Ils n’ont pas été mis à jour depuis ${hour}. Revenez dans quelques minutes.`}</p>
      </StateBanner>
    );
  }
  return <StateBanner tone="ok" title={`Données à jour à ${hour}`} />;
}

/**
 * Sous l'en-tête de chaque page. Il n'affirme jamais une fraîcheur qu'il ne peut plus vérifier :
 * si la lecture de l'état échoue, il le dit. Seule exception, une API qui ne connaît pas la route
 * (404) : pas de bandeau.
 */
export function FreshnessBanner() {
  const { data, error, isError } = useScrapeStatus();
  const now = useNow();
  if (isError && !(error instanceof ApiError && error.status === 404)) {
    return (
      <div className="fraicheur">
        <StateBanner tone="alerte" title={CANNOT_CHECK} role="status">
          <p>Les résultats affichés peuvent ne pas être à jour. Revenez dans quelques minutes.</p>
        </StateBanner>
      </div>
    );
  }
  return data ? (
    <div className="fraicheur">
      <FreshnessMessage status={data} now={now} />
    </div>
  ) : null;
}
