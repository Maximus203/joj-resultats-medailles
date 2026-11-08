import { localDay } from './local-time';

/** Quand l'import tourne : une heure locale par jour, pendant les Jeux, et en rattrapage. */
export interface ScheduleSettings {
  firstDay: string;
  lastDay: string;
  /** Heure locale HH:MM de l'exécution quotidienne. */
  dailyTime: string;
  timeZone: string;
  /** Exécution supplémentaire toutes les N minutes, ou `null`. */
  intervalMinutes: number | null;
  /** Pas de l'horloge : le créneau quotidien se prend dans les deux battements qui suivent son heure. */
  tickSeconds: number;
}

/** `catch-up` : serveur démarré après plus de 24 h sans import réussi ; `daily` : heure fixe ; `interval` : complément. */
export type DueReason = 'catch-up' | 'daily' | 'interval';

const DAY_MS = 86_400_000;
const CATCH_UP_AFTER_MS = DAY_MS;

export interface DueInput {
  now: Date;
  /** Le début de la dernière exécution, réussie ou non. */
  lastAttemptAt: Date | null;
  /** Le début de la dernière exécution qui n'a pas échoué. */
  lastSucceededAt: Date | null;
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
export function inGamesWindow(now: Date, settings: ScheduleSettings): boolean {
  const day = localDay(now, settings.timeZone);
  return day >= settings.firstDay && day <= addDays(settings.lastDay, 1);
}

/** Le dernier créneau quotidien passé (aujourd'hui à l'heure fixe, ou hier si elle n'est pas venue). */
function lastDailySlot(now: Date, settings: ScheduleSettings): Date {
  const today = zonedInstant(
    localDay(now, settings.timeZone),
    settings.dailyTime,
    settings.timeZone,
  );
  if (today <= now) return today;
  return zonedInstant(
    addDays(localDay(now, settings.timeZone), -1),
    settings.dailyTime,
    settings.timeZone,
  );
}

/** Le prochain créneau quotidien, ou `null` quand les Jeux (et leur lendemain) sont finis. */
export function nextDailySlot(now: Date, settings: ScheduleSettings): Date | null {
  const day = localDay(now, settings.timeZone);
  const tonight = zonedInstant(day, settings.dailyTime, settings.timeZone);
  const next =
    tonight > now ? tonight : zonedInstant(addDays(day, 1), settings.dailyTime, settings.timeZone);
  const opening = zonedInstant(settings.firstDay, settings.dailyTime, settings.timeZone);
  const slot = next < opening ? opening : next;
  const lastSlot = zonedInstant(
    addDays(settings.lastDay, 1),
    settings.dailyTime,
    settings.timeZone,
  );
  return slot > lastSlot ? null : slot;
}

/**
 * Pourquoi une exécution est due maintenant, ou `null`. Une exécution échouée compte comme une
 * tentative : on ne la rejoue qu'au créneau suivant (ou à l'intervalle), pas à chaque minute.
 */
export function dueReason(input: DueInput, settings: ScheduleSettings): DueReason | null {
  const { now, lastAttemptAt, lastSucceededAt, startup } = input;
  if (!inGamesWindow(now, settings)) return null;
  const staleSuccess =
    lastSucceededAt === null || now.getTime() - lastSucceededAt.getTime() > CATCH_UP_AFTER_MS;
  if (startup && staleSuccess) return 'catch-up';
  const slot = lastDailySlot(now, settings);
  const onTime = now.getTime() - slot.getTime() <= 2 * settings.tickSeconds * 1000;
  // Un battement tardif ne lance rien : seul le créneau lui-même, ou le démarrage, déclenche.
  if (onTime && (lastAttemptAt === null || lastAttemptAt < slot)) return 'daily';
  if (lastAttemptAt === null) return null;
  const interval = settings.intervalMinutes;
  if (interval && now.getTime() - lastAttemptAt.getTime() >= interval * 60_000) return 'interval';
  return null;
}
