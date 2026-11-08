import type { PublishedPodium } from '@joj/shared';
import { formatDayFull } from '@/lib/dates';
import { CorrectionStamp } from './history-sheet';
import { PodiumLines } from './podium-lines';

/** Carte timbre d'un podium publié ; le tampon « Corrigé » ouvre l'historique. */
export function PodiumCard({
  podium,
  meta = 'discipline',
}: {
  podium: PublishedPodium;
  /** Ce qui s'écrit sous le titre : la discipline (accueil), rien (déjà sous un titre de discipline). */
  meta?: 'discipline' | 'none' | 'full';
}) {
  return (
    <article className="timbre">
      <div className="timbre-tete">
        <div>
          <h3>{podium.eventName}</h3>
          {meta === 'discipline' ? <p className="meta">{podium.discipline}</p> : null}
          {meta === 'full' ? (
            <p className="meta">
              {podium.discipline} · {formatDayFull(podium.day)}
            </p>
          ) : null}
        </div>
        <CorrectionStamp podium={podium} />
      </div>
      <PodiumLines
        gold={podium.gold}
        silver={podium.silver}
        bronze={podium.bronze}
        secondBronze={podium.secondBronze}
      />
    </article>
  );
}
