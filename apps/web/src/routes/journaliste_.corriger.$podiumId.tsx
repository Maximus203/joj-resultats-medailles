import { createFileRoute, Link } from '@tanstack/react-router';
import { BrandBand } from '@/components/cachet/brand-band';
import { EmptyState, LoadError, Skeletons } from '@/components/cachet/states';
import { usePodiums } from '@/features/podiums/api/podiums';
import { CorrectPodiumForm } from '@/features/podiums/components/correct-podium-form';
import { describeLoadError } from '@/lib/error-messages';

function CorrectPodiumPage() {
  const { podiumId } = Route.useParams();
  const podiums = usePodiums();
  const podium = podiums.data?.find((item) => item.id === podiumId);

  return (
    <>
      <BrandBand variant="ardoise" surtitre="Espace journaliste" title="Corriger un podium" />
      <main className="page" id="contenu" tabIndex={-1}>
        {podiums.isPending ? (
          <Skeletons
            label="Chargement du podium"
            heights={['2rem', '8rem', '8rem']}
            gap="var(--s-3)"
          />
        ) : podiums.isError && !podiums.data ? (
          <LoadError
            title="Le podium n’a pas pu être chargé."
            detail={describeLoadError(podiums.error)}
            onRetry={() => void podiums.refetch()}
          />
        ) : podium ? (
          <CorrectPodiumForm podium={podium} />
        ) : (
          <EmptyState title="Ce podium n’existe pas">
            <p>Il a peut-être été retiré, ou l’adresse est incomplète.</p>
            <Link className="bouton bouton-secondaire" to="/resultats">
              Voir les résultats
            </Link>
          </EmptyState>
        )}
      </main>
    </>
  );
}

export const Route = createFileRoute('/journaliste_/corriger/$podiumId')({
  component: CorrectPodiumPage,
});
