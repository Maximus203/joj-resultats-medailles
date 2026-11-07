import type { PublishedPodium } from '@joj/shared';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { Icon } from '@/components/cachet/icons';
import { LoadError, Skeletons } from '@/components/cachet/states';
import { describeLoadError } from '@/lib/error-messages';
import { formatLongDate, formatShortDate } from '@/lib/dates';
import { usePodiumRevisions } from '../api/podiums';
import { PodiumLines } from './podium-lines';

function HistoryContent({ podium, correctedAt }: { podium: PublishedPodium; correctedAt: string }) {
  const revisions = usePodiumRevisions(podium.id);
  const versions = revisions.data ? revisions.data.length + 1 : null;
  return (
    <>
      <div className="entete-feuille">
        <div>
          <Dialog.Title asChild>
            <h2>{podium.eventName}</h2>
          </Dialog.Title>
          <Dialog.Description className="meta">
            Historique du podium{versions ? ` · ${versions} versions` : ''}
          </Dialog.Description>
        </div>
        <Dialog.Close className="bouton bouton-secondaire bouton-fermer">Fermer</Dialog.Close>
      </div>
      {revisions.isPending ? (
        <Skeletons label="Chargement de l’historique" heights={['5rem', '5rem']} />
      ) : revisions.isError ? (
        <LoadError
          title="L’historique n’a pas pu être chargé."
          detail={describeLoadError(revisions.error)}
          onRetry={() => void revisions.refetch()}
        />
      ) : (
        <>
          <div className="ligne-ver">
            <p className="meta">Version actuelle · corrigée le {formatLongDate(correctedAt)}</p>
            <article className="timbre" style={{ padding: 'var(--s-3) var(--s-4)' }}>
              <PodiumLines gold={podium.gold} silver={podium.silver} bronze={podium.bronze} />
            </article>
          </div>
          {revisions.data.map((revision) => (
            <div className="ligne-ver" key={revision.correctedAt}>
              <p className="meta">Version remplacée le {formatLongDate(revision.correctedAt)}</p>
              <article
                className="timbre version-ancienne"
                style={{ padding: 'var(--s-3) var(--s-4)' }}
              >
                <PodiumLines
                  gold={revision.gold}
                  silver={revision.silver}
                  bronze={revision.bronze}
                />
              </article>
            </div>
          ))}
        </>
      )}
    </>
  );
}

/**
 * Tampon « Corrigé » daté : un bouton qui ouvre la feuille d'historique. Radix Dialog donne le
 * focus à l'ouverture, retient le Tab, ferme à Échap et rend le focus au tampon.
 */
export function CorrectionStamp({ podium }: { podium: PublishedPodium }) {
  const [open, setOpen] = useState(false);
  const { correctedAt } = podium;
  if (!correctedAt) return null;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="cachet-corrige"
        aria-label={`Corrigé le ${formatLongDate(correctedAt)}, voir l’historique`}
      >
        <Icon name="historique" />
        Corrigé {formatShortDate(correctedAt)}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fond" />
        <Dialog.Content className="feuille feuille-fixe">
          <HistoryContent podium={podium} correctedAt={correctedAt} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Tampon sans action (page de correction, déjà dans son contexte). */
export function StaticStamp({ correctedAt }: { correctedAt: string }) {
  return (
    <span className="cachet-corrige">
      <Icon name="historique" />
      Corrigé {formatShortDate(correctedAt)}
    </span>
  );
}
