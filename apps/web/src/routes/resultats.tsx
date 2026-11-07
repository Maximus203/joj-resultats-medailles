import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { BrandBand } from '@/components/cachet/brand-band';
import { EmptyState, LoadError, Skeletons } from '@/components/cachet/states';
import { useMedals } from '@/features/medals/api/medals';
import { MyCountryCard } from '@/features/medals/components/my-country';
import { usePodiums } from '@/features/podiums/api/podiums';
import { DayStrip } from '@/features/podiums/components/day-strip';
import {
  DisciplineFilter,
  DisciplineSections,
  groupByDiscipline,
} from '@/features/podiums/components/day-results';
import { defaultDay, formatDayMonth, formatDayTitle, GAMES_DAYS, isGamesDay } from '@/lib/dates';
import { describeLoadError } from '@/lib/error-messages';
import { useMyCountry } from '@/lib/use-my-country';

interface ResultsSearch {
  day?: string | undefined;
  discipline?: string | undefined;
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

function ResultsPage() {
  const search = Route.useSearch();
  const day = search.day ?? defaultDay();
  const podiums = usePodiums(day);
  const allPodiums = usePodiums();
  const medals = useMedals();
  const [myCountry] = useMyCountry();

  const items = podiums.data ?? [];
  const groups = groupByDiscipline(items);
  const daysWithPodiums = new Set((allPodiums.data ?? []).map((podium) => podium.day));
  const otherDay = (allPodiums.data ?? []).find((podium) => podium.day !== day)?.day;
  const mine = myCountry ? medals.data?.find((row) => row.country === myCountry) : undefined;

  return (
    <>
      <BrandBand variant="rouge" surtitre="Résultats du jour" title={formatDayTitle(day)} />
      <main className="page" id="contenu" tabIndex={-1}>
        {podiums.data && items.length > 0 ? (
          <p className="meta">
            {plural(items.length, 'épreuve')} · {plural(groups.length, 'discipline')}
          </p>
        ) : null}
        <DayStrip days={GAMES_DAYS} selected={day} daysWithPodiums={daysWithPodiums} />
        <div className="cols">
          <div className="col-main">
            {podiums.isPending ? (
              <Skeletons
                label="Chargement des résultats"
                heights={['2rem', '8rem', '8rem']}
                gap="var(--s-3)"
              />
            ) : podiums.isError && !podiums.data ? (
              <LoadError
                title="Les résultats n’ont pas pu être chargés."
                detail={describeLoadError(podiums.error)}
                onRetry={() => void podiums.refetch()}
              />
            ) : items.length === 0 ? (
              <EmptyState title="Aucun podium enregistré ce jour">
                {/* Mascotte officielle, droits CIO/COJOJ : usage autorisé par Cherif, à retirer si le titulaire s'y oppose. */}
                <img
                  className="mascotte mascotte--petite"
                  src="/assets/mascotte-ayo.png"
                  alt="Ayo, mascotte des JOJ Dakar 2026"
                  width={49}
                  height={112}
                />
                <p>Les résultats apparaissent ici dès qu’un podium est enregistré.</p>
                {otherDay ? (
                  <Link
                    className="bouton bouton-secondaire"
                    to="/resultats"
                    search={{ day: otherDay }}
                  >
                    Aller au {formatDayMonth(otherDay)}
                  </Link>
                ) : null}
              </EmptyState>
            ) : (
              <>
                <DisciplineFilter groups={groups} total={items.length} day={day} />
                <DisciplineSections groups={groups} selected={search.discipline} day={day} />
              </>
            )}
          </div>
          <div className="col-aside">
            {myCountry && items.length > 0 ? <MyCountryCard code={myCountry} row={mine} /> : null}
          </div>
        </div>
      </main>
    </>
  );
}

function validateSearch(search: Record<string, unknown>): ResultsSearch {
  const { day, discipline } = search;
  return {
    day: typeof day === 'string' && isGamesDay(day) ? day : undefined,
    discipline: typeof discipline === 'string' && discipline ? discipline : undefined,
  };
}

export const Route = createFileRoute('/resultats')({
  validateSearch,
  // Sans jour dans l'adresse : le jour courant, pour que la bande des jours sache où l'on est.
  beforeLoad: ({ search }) => {
    if (!search.day) {
      throw redirect({
        to: '/resultats',
        search: { day: defaultDay(), discipline: search.discipline },
        replace: true,
      });
    }
  },
  component: ResultsPage,
});
