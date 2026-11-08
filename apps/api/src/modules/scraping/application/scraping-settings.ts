import type { ScheduleSettings } from '../domain/scrape-schedule';

/** Jeton d'injection des réglages de l'import : `@Inject(SCRAPING_SETTINGS) settings`. */
export const SCRAPING_SETTINGS = Symbol('SCRAPING_SETTINGS');

/** Les réglages dont les cas d'usage ont besoin, tirés de la configuration : l'horaire et l'interrupteur. */
export interface ScrapingSettings extends ScheduleSettings {
  enabled: boolean;
}
