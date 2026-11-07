import { Link } from '@tanstack/react-router';
import { type CSSProperties, useEffect, useRef } from 'react';
import { dayStripLabel } from '@/lib/dates';

/** Bande des jours : point plein = au moins un podium ce jour-là. */
export function DayStrip({
  days,
  selected,
  daysWithPodiums,
  style,
}: {
  days: readonly string[];
  selected: string;
  daysWithPodiums: ReadonlySet<string>;
  style?: CSSProperties;
}) {
  const current = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const element = current.current;
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }, [selected]);
  return (
    <nav className="jours" aria-label="Choisir un jour" style={style}>
      {days.map((day) => {
        const { weekday, number, label } = dayStripLabel(day);
        const has = daysWithPodiums.has(day);
        const isSelected = day === selected;
        return (
          <Link
            key={day}
            ref={isSelected ? current : undefined}
            className="jour"
            to="/resultats"
            search={{ day }}
            activeOptions={{ exact: true }}
            aria-label={`${label}${has ? '' : ', aucun podium'}`}
          >
            <span>{weekday}</span>
            <b>{number}</b>
            <i className={has ? 'point' : 'point sans'} />
          </Link>
        );
      })}
    </nav>
  );
}
