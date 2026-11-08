import { Inject, Injectable } from '@nestjs/common';
import { AppConfig } from '../../../core/config/app-config';
import { ResultsSource } from '../application/results-source';
import type { OfficialSource } from '../domain/official-results';
import { createOfficialSiteSource } from './official-site-http';

/** Le site officiel des résultats, lu en HTTP avec les réglages de la configuration. */
@Injectable()
export class HttpResultsSource extends ResultsSource {
  private readonly site: OfficialSource;

  constructor(@Inject(AppConfig) config: AppConfig) {
    super();
    this.site = createOfficialSiteSource({
      baseUrl: config.get('SCRAPING_SOURCE_URL'),
      userAgent: config.get('SCRAPING_USER_AGENT'),
      requestDelayMs: config.get('SCRAPING_REQUEST_DELAY_MS'),
      requestTimeoutMs: config.get('SCRAPING_REQUEST_TIMEOUT_MS'),
    });
  }

  schedule(day: string): Promise<string> {
    return this.site.schedule(day);
  }

  medalList(code: string): Promise<string> {
    return this.site.medalList(code);
  }
}
