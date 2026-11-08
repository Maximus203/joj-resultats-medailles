import type { ScrapeStatus } from '@joj/shared';
import { StateBanner } from '@/components/cachet/states';
import { formatClockTime } from '@/lib/dates';
import { useScrapeStatus } from '../api/scraping';

/** Le bandeau lui-même : l'heure de la dernière mise à jour, ou un avertissement si elle est en retard. */
export function FreshnessMessage({ status }: { status: ScrapeStatus }) {
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
  if (status.stale) {
    return (
      <StateBanner tone="alerte" title="Les résultats sont peut-être en retard" role="status">
        <p>{`Ils n’ont pas été mis à jour depuis ${hour}. Revenez dans quelques minutes.`}</p>
      </StateBanner>
    );
  }
  return <StateBanner tone="ok" title={`Données à jour à ${hour}`} />;
}

/** Sous l'en-tête de chaque page : rien tant que l'état de l'import n'est pas connu (ou si l'API ne le donne pas). */
export function FreshnessBanner() {
  const { data } = useScrapeStatus();
  return data ? (
    <div className="fraicheur">
      <FreshnessMessage status={data} />
    </div>
  ) : null;
}
