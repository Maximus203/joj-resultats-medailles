/** Les Jeux se déroulent du 31 octobre au 13 novembre 2026 : quatorze jours (PRD). */
export const GAMES_FIRST_DAY = '2026-10-31';
export const GAMES_LAST_DAY = '2026-11-13';
const DAY_MS = 86_400_000;

/** Les quatorze jours des Jeux, `AAAA-MM-JJ`. */
export const GAMES_DAYS: readonly string[] = Array.from({ length: 14 }, (_, index) =>
  new Date(Date.parse(`${GAMES_FIRST_DAY}T00:00:00Z`) + index * DAY_MS).toISOString().slice(0, 10),
);

/** Dakar est à UTC+0 toute l'année : les heures affichées ne dépendent pas du fuseau de l'appareil. */
const DAKAR = 'Africa/Dakar';

/** Le jour des Jeux à afficher par défaut : aujourd'hui, ramené dans les dates des Jeux. */
export function defaultDay(now: Date = new Date()): string {
  const today = now.toISOString().slice(0, 10);
  if (today < GAMES_FIRST_DAY) return GAMES_FIRST_DAY;
  if (today > GAMES_LAST_DAY) return GAMES_LAST_DAY;
  return today;
}

export function isGamesDay(day: string): boolean {
  return GAMES_DAYS.includes(day);
}

const atNoon = (day: string) => new Date(`${day}T12:00:00Z`);

function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « jeudi 5 novembre » */
export function formatDay(day: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(atNoon(day));
}

/** « Jeudi 5 novembre », pour un titre. */
export function formatDayTitle(day: string): string {
  return upperFirst(formatDay(day));
}

/** « jeudi 5 novembre 2026 » */
export function formatDayFull(day: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(atNoon(day));
}

/** « 5 novembre » */
export function formatDayMonth(day: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(atNoon(day));
}

/** Les trois lettres et le numéro d'une case de la bande des jours : « jeu », 5. */
export function dayStripLabel(day: string): { weekday: string; number: number; label: string } {
  const date = atNoon(day);
  const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '');
  return { weekday, number: date.getUTCDate(), label: formatDay(day) };
}

/** « 5 nov. », pour le tampon « Corrigé ». */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    timeZone: DAKAR,
  }).format(new Date(iso));
}

/** « 5 novembre 2026 » */
export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DAKAR,
  }).format(new Date(iso));
}

/** « 18 h 12 » */
export function formatTime(iso: string | number): string {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: DAKAR,
  }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('hour')} h ${part('minute')}`;
}

/** « 5 nov., 18 h 12 » */
export function formatDateTime(iso: string | number): string {
  const date = typeof iso === 'number' ? new Date(iso).toISOString() : iso;
  return `${formatShortDate(date)}, ${formatTime(date)}`;
}
