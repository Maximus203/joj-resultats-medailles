import { localDay } from './local-time';
import type { ScrapeKind } from './scrape-run';

/**
 * Quand l'import tourne : un import léger tous les `intervalMinutes` dans la fenêtre du jour, un
 * import complet aux heures de `fullTimes`, et un rattrapage complet au démarrage.
 */
export interface ScheduleSettings {
  firstDay: string;
  lastDay: string;
  timeZone: string;
  /** Heures locales HH:MM des imports complets. */
  fullTimes: readonly string[];
  /** Fenêtre locale (HH:MM, fin incluse à la minute) des imports légers. */
  windowStart: string;
  windowEnd: string;
  intervalMinutes: number;
  /** Pas de l'horloge : un créneau complet se prend dans les deux battements qui suivent son heure. */
  tickSeconds: number;
  /** Au-delà de cette durée sans import réussi, dans la fenêtre, les données sont périmées. */
  staleAfterMinutes: number;
}

/** `catch-up` : serveur démarré après plus de 24 h sans import réussi ; `full-slot` : heure complète ; `interval` : import léger. */
export type DueReason = 'catch-up' | 'full-slot' | 'interval';

export interface Due {
  kind: ScrapeKind;
  reason: DueReason;
  /** Le créneau complet visé, quand `reason` est `full-slot`. */
  slot?: Date;
}

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
const CATCH_UP_AFTER_MS = DAY_MS;

export interface DueInput {
  now: Date;
  /** Le début de la dernière exécution lancée ou sautée, tous genres confondus. */
  lastAttemptAt: Date | null;
  /** Le début du dernier import complet réellement lancé. */
  lastFullAt: Date | null;
  /** Le début de la dernière exécution qui n'a ni échoué ni été sautée. */
  lastSucceededAt: Date | null;
  /** Le début du dernier import complet réussi ; à défaut, on prend `lastFullAt`. */
  lastFullSucceededAt?: Date | null;
  /** Vrai au démarrage du serveur : c'est là que l'on rattrape une exécution manquée. */
  startup: boolean;
}

/** Ajoute (ou retire) des jours à un jour AAAA-MM-JJ. */
function addDays(day: string, days: number): string {
  return new Date(Date.parse(day) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Décalage du fuseau à cet instant, en minutes (heure locale moins UTC). */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const localAsUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return (localAsUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60_000;
}

/** L'instant (UTC) où il est `time` (HH:MM) le `day` (AAAA-MM-JJ) dans ce fuseau. */
export function zonedInstant(day: string, time: string, timeZone: string): Date {
  const [year, month, date] = day.split('-').map(Number) as [number, number, number];
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  const guess = Date.UTC(year, month - 1, date, hour, minute);
  return new Date(guess - offsetMinutes(new Date(guess), timeZone) * 60_000);
}

/** Les Jeux, plus le lendemain de leur dernier jour : après, plus rien ne tourne. */
export function inGamesWindow(
  now: Date,
  settings: Pick<ScheduleSettings, 'firstDay' | 'lastDay' | 'timeZone'>,
): boolean {
  const day = localDay(now, settings.timeZone);
  return day >= settings.firstDay && day <= addDays(settings.lastDay, 1);
}

/** La fenêtre du jour où tournent les imports légers : de `windowStart` à `windowEnd` inclus, à la minute. */
export function inWindow(
  now: Date,
  settings: Pick<ScheduleSettings, 'timeZone' | 'windowStart' | 'windowEnd'>,
): boolean {
  const day = localDay(now, settings.timeZone);
  const opening = zonedInstant(day, settings.windowStart, settings.timeZone);
  const closing = zonedInstant(day, settings.windowEnd, settings.timeZone);
  return now >= opening && now.getTime() < closing.getTime() + MINUTE_MS;
}

/** Le dernier créneau complet passé, aujourd'hui ou hier. */
function lastFullSlot(now: Date, settings: ScheduleSettings): Date | null {
  const today = localDay(now, settings.timeZone);
  const slots = [today, addDays(today, -1)].flatMap((day) =>
    settings.fullTimes.map((time) => zonedInstant(day, time, settings.timeZone)),
  );
  const past = slots.filter((slot) => slot <= now).sort((a, b) => b.getTime() - a.getTime());
  return past[0] ?? null;
}

/** Le prochain créneau complet, ou `null` quand les Jeux (et leur lendemain) sont finis. */
export function nextFullSlot(now: Date, settings: ScheduleSettings): Date | null {
  const today = localDay(now, settings.timeZone);
  const first = zonedInstant(settings.firstDay, '00:00', settings.timeZone);
  const startDay = now < first ? settings.firstDay : today;
  const last = addDays(settings.lastDay, 1);
  for (let day = startDay; day <= last; day = addDays(day, 1)) {
    const slots = settings.fullTimes
      .map((time) => zonedInstant(day, time, settings.timeZone))
      .filter((slot) => slot > now)
      .sort((a, b) => a.getTime() - b.getTime());
    if (slots[0]) return slots[0];
  }
  return null;
}

/**
 * Périmé : l'import est dans sa fenêtre des Jeux et aucun import n'a réussi depuis plus de
 * `staleAfterMinutes` (ou jamais). Hors fenêtre, rien n'est attendu : jamais périmé.
 */
export function isStale(
  input: { now: Date; lastSucceededAt: Date | null },
  settings: ScheduleSettings,
): boolean {
  const { now, lastSucceededAt } = input;
  if (!inGamesWindow(now, settings) || !inWindow(now, settings)) return false;
  return (
    lastSucceededAt === null ||
    now.getTime() - lastSucceededAt.getTime() > settings.staleAfterMinutes * MINUTE_MS
  );
}

/**
 * Quel import est dû maintenant, ou `null`. Le complet prime sur le léger. Une exécution échouée
 * compte comme une tentative : on ne la rejoue qu'au créneau ou à l'intervalle suivant. Un
 * battement tardif ne lance rien : seuls un créneau, l'intervalle ou le démarrage déclenchent.
 */
export function dueRun(input: DueInput, settings: ScheduleSettings): Due | null {
  const { now, lastAttemptAt, lastFullAt, lastSucceededAt, startup } = input;
  if (!inGamesWindow(now, settings)) return null;
  const staleSuccess =
    lastSucceededAt === null || now.getTime() - lastSucceededAt.getTime() > CATCH_UP_AFTER_MS;
  const slot = lastFullSlot(now, settings);
  // Au démarrage, un complet dont le créneau (07:00 ou 23:00) est passé sans réussite est rattrapé tout
  // de suite ; la règle « plus de 24 h sans succès » reste le filet.
  const fullDone = input.lastFullSucceededAt === undefined ? lastFullAt : input.lastFullSucceededAt;
  const slotMissed = slot !== null && (fullDone === null || fullDone < slot);
  if (startup && (staleSuccess || slotMissed)) return { kind: 'full', reason: 'catch-up' };
  const onTime = slot !== null && now.getTime() - slot.getTime() <= 2 * settings.tickSeconds * 1000;
  if (slot && onTime && (lastFullAt === null || lastFullAt < slot)) {
    return { kind: 'full', reason: 'full-slot', slot };
  }
  const dueByInterval =
    lastAttemptAt === null ||
    now.getTime() - lastAttemptAt.getTime() >= settings.intervalMinutes * MINUTE_MS;
  if (inWindow(now, settings) && dueByInterval) return { kind: 'incremental', reason: 'interval' };
  return null;
}
