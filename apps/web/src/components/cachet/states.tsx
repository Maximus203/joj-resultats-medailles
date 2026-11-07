import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

type Tone = 'erreur' | 'ok' | 'alerte' | 'info';
const TONE_ICON: Record<Tone, IconName> = {
  erreur: 'erreur',
  ok: 'ok',
  alerte: 'alerte',
  info: 'info',
};

/** Bandeau d'état : une erreur porte toujours une icône, une bordure et un message, jamais la couleur seule. */
export function StateBanner({
  tone,
  title,
  id,
  role,
  children,
}: {
  tone: Tone;
  title: string;
  id?: string;
  role?: 'alert' | 'status';
  children?: ReactNode;
}) {
  const live = role ?? (tone === 'erreur' ? 'alert' : tone === 'ok' ? 'status' : undefined);
  return (
    <div className={`bandeau bandeau-${tone}`} role={live} id={id}>
      <Icon name={TONE_ICON[tone]} />
      <div>
        <strong>{title}</strong>
        {children}
      </div>
    </div>
  );
}

/** Erreur de chargement : cause en français courant, jamais un code brut, et « Réessayer ». */
export function LoadError({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry: () => void;
}) {
  return (
    <StateBanner tone="erreur" title={title}>
      {detail}
      <p style={{ marginTop: 8 }}>
        <button type="button" className="bouton bouton-secondaire" onClick={onRetry}>
          Réessayer
        </button>
      </p>
    </StateBanner>
  );
}

export function EmptyState({
  title,
  children,
  headingLevel = 2,
}: {
  title: string;
  children?: ReactNode;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className="vide">
      <Icon name="ardoise" />
      <Heading>{title}</Heading>
      {children}
    </section>
  );
}

/** Squelettes à la forme du contenu, annoncés comme un chargement. */
export function Skeletons({
  label,
  heights,
  gap = 'var(--s-2)',
}: {
  label: string;
  heights: string[];
  gap?: string;
}) {
  return (
    <div role="status" aria-label={label} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {heights.map((height, index) => (
        <div key={index} className="squelette" style={{ minHeight: height }} />
      ))}
    </div>
  );
}

export function OfflineBar({ children }: { children: ReactNode }) {
  return (
    <div className="hors-ligne" role="status">
      <Icon name="horsligne" />
      <span>{children}</span>
    </div>
  );
}
