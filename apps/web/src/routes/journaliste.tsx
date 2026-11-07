import { createFileRoute } from '@tanstack/react-router';
import { BrandBand } from '@/components/cachet/brand-band';
import { RecordPodiumForm } from '@/features/podiums/components/record-podium-form';

function RecordPodiumPage() {
  return (
    <>
      <BrandBand variant="ardoise" surtitre="Espace journaliste" title="Enregistrer un podium" />
      <main className="page" id="contenu" tabIndex={-1}>
        <p className="chapo">
          Une épreuve n’a qu’un seul podium. Les trois pays d’un podium sont différents.
        </p>
        <RecordPodiumForm />
      </main>
    </>
  );
}

export const Route = createFileRoute('/journaliste')({ component: RecordPodiumPage });
