/** Jeton d'injection des réglages de l'import : `@Inject(SCRAPING_SETTINGS) settings`. */
export const SCRAPING_SETTINGS = Symbol('SCRAPING_SETTINGS');

/** Les réglages dont les cas d'usage ont besoin, tirés de la configuration. */
export interface ScrapingSettings {
  enabled: boolean;
  firstDay: string;
  lastDay: string;
  /** Heure locale HH:MM de l'exécution quotidienne. */
  dailyTime: string;
  timeZone: string;
  /** Exécution supplémentaire toutes les N minutes, ou `null`. */
  intervalMinutes: number | null;
  tickSeconds: number;
}
