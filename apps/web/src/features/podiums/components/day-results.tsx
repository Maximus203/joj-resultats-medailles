import type { PublishedPodium } from '@joj/shared';
import { Link } from '@tanstack/react-router';
import { EmptyState } from '@/components/cachet/states';
import { PodiumCard } from './podium-card';

export interface DisciplineGroup {
  discipline: string;
  podiums: PublishedPodium[];
}

/** Regroupe les podiums par discipline, dans l'ordre où elles apparaissent (plus récent d'abord). */
export function groupByDiscipline(podiums: readonly PublishedPodium[]): DisciplineGroup[] {
  const groups = new Map<string, PublishedPodium[]>();
  for (const podium of podiums) {
    const list = groups.get(podium.discipline);
    if (list) list.push(podium);
    else groups.set(podium.discipline, [podium]);
  }
  return [...groups].map(([discipline, list]) => ({ discipline, podiums: list }));
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

export function disciplineId(discipline: string): string {
  return `d-${discipline.replace(/[^\p{L}\p{N}]+/gu, '-')}`;
}

/** Puces de discipline : « Toutes » puis une puce par discipline du jour. */
export function DisciplineFilter({
  groups,
  total,
  day,
}: {
  groups: DisciplineGroup[];
  total: number;
  day: string;
}) {
  return (
    <nav className="disciplines-filtre" aria-label="Filtrer par discipline">
      <Link className="puce" to="/resultats" search={{ day }} activeOptions={{ exact: true }}>
        Toutes · {total}
      </Link>
      {groups.map((group) => (
        <Link
          key={group.discipline}
          className="puce"
          to="/resultats"
          search={{ day, discipline: group.discipline }}
          activeOptions={{ exact: true }}
        >
          {group.discipline} · {group.podiums.length}
        </Link>
      ))}
    </nav>
  );
}

/** Une section par discipline, les cartes podium en dessous. */
export function DisciplineSections({
  groups,
  selected,
  day,
}: {
  groups: DisciplineGroup[];
  selected: string | undefined;
  day: string;
}) {
  const shown = selected ? groups.filter((group) => group.discipline === selected) : groups;
  if (shown.length === 0) {
    return (
      <EmptyState title={`Aucun podium en ${selected ?? ''} ce jour`}>
        <p>Ce filtre ne correspond à aucune épreuve de la journée.</p>
        <Link className="bouton bouton-secondaire" to="/resultats" search={{ day }}>
          Voir toutes les disciplines
        </Link>
      </EmptyState>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      {shown.map((group) => {
        const id = disciplineId(group.discipline);
        return (
          <section className="discipline" aria-labelledby={id} key={group.discipline}>
            <div className="discipline-titre">
              <h2 id={id}>{group.discipline}</h2>
              <span className="meta">{plural(group.podiums.length, 'épreuve')}</span>
            </div>
            <ul className="liste-timbres">
              {group.podiums.map((podium) => (
                <li key={podium.id}>
                  <PodiumCard podium={podium} meta="none" />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
