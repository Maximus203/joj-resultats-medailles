import { formatDayFull } from '@/lib/dates';
import { PodiumLines } from './podium-lines';

const EMPTY = '···';

/** L'aperçu en direct : le podium tel que le public le lira, avant l'enregistrement. */
export function PodiumPreview({
  eventName,
  discipline,
  day,
  gold,
  silver,
  bronze,
}: {
  eventName: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
}) {
  // Un nom fait d'espaces seuls vaut un nom vide ; un très long mot passe à la ligne (CSS).
  const title = eventName.trim().replace(/\s+/g, ' ');
  const parsedDay = /^\d{4}-\d{2}-\d{2}$/.test(day) ? formatDayFull(day) : 'jour';
  return (
    <article className="timbre">
      <div className="timbre-tete">
        <div>
          <h3>{title || 'Épreuve à saisir'}</h3>
          <p className="meta">
            {discipline.trim() || 'Discipline'} · {parsedDay}
          </p>
        </div>
      </div>
      <PodiumLines gold={gold || EMPTY} silver={silver || EMPTY} bronze={bronze || EMPTY} />
    </article>
  );
}
