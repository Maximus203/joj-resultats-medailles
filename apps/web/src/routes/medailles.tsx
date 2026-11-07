import { createFileRoute, Link } from '@tanstack/react-router';
import { BrandBand } from '@/components/cachet/brand-band';
import { Icon } from '@/components/cachet/icons';
import { EmptyState, LoadError, Skeletons } from '@/components/cachet/states';
import { useMedals } from '@/features/medals/api/medals';
import { MedalTable } from '@/features/medals/components/medal-table';
import { MyCountrySelect } from '@/features/medals/components/my-country';
import { formatDateTime } from '@/lib/dates';
import { describeLoadError } from '@/lib/error-messages';
import { useMyCountry } from '@/lib/use-my-country';

function MedalsPage() {
  const medals = useMedals();
  const [myCountry, setMyCountry] = useMyCountry();
  const rows = medals.data ?? [];

  return (
    <>
      <BrandBand
        variant="orange"
        surtitre="Dakar 2026 · du 31 octobre au 13 novembre"
        title="Tableau des médailles"
      />
      <main className="page" id="contenu" tabIndex={-1}>
        <p className="chapo">
          Classé par or, puis argent, puis bronze. Le tableau se met à jour à chaque podium
          enregistré.
        </p>
        <div className="cols">
          <div className="col-main">
            {medals.isPending ? (
              <Skeletons
                label="Chargement du tableau"
                heights={['2.5rem', '3.5rem', '3.5rem', '3.5rem', '3.5rem', '3.5rem']}
              />
            ) : medals.isError && !medals.data ? (
              <LoadError
                title="Le tableau n’a pas pu être chargé."
                detail={describeLoadError(medals.error)}
                onRetry={() => void medals.refetch()}
              />
            ) : rows.length === 0 ? (
              <EmptyState title="Aucune médaille pour l’instant">
                <p>Le tableau se remplit dès le premier podium enregistré.</p>
                <Link className="bouton bouton-secondaire" to="/resultats">
                  Voir les résultats du jour
                </Link>
              </EmptyState>
            ) : (
              <MedalTable rows={rows} caption="Médailles par pays" myCountry={myCountry} />
            )}
          </div>
          <div className="col-aside">
            {medals.data ? (
              <>
                <div className="outils">
                  <MyCountrySelect
                    value={myCountry}
                    onChange={setMyCountry}
                    presentCodes={rows.map((row) => row.country)}
                  />
                  <p className="maj">
                    <Icon name="historique" />
                    Mis à jour le {formatDateTime(medals.dataUpdatedAt)}
                  </p>
                </div>
                <p className="note">
                  Tableau calculé à partir des podiums enregistrés dans cette application. Il peut
                  différer du tableau publié sur le site officiel des Jeux ; les équipes mixtes de
                  plusieurs pays ne sont pas comptées.
                </p>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

export const Route = createFileRoute('/medailles')({ component: MedalsPage });
