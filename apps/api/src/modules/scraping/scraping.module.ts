import { Module } from '@nestjs/common';
import { AppConfig } from '../../core/config/app-config';
import { Clock } from './application/clock';
import { ImportedPodiumRepository } from './application/imported-podium.repository';
import { ResultsSource } from './application/results-source';
import { ScrapeRunRepository } from './application/scrape-run.repository';
import { SCRAPING_SETTINGS, type ScrapingSettings } from './application/scraping-settings';
import { CheckStaleness } from './application/use-cases/check-staleness';
import { GetScrapeStatus } from './application/use-cases/get-scrape-status';
import { RunDueScrape } from './application/use-cases/run-due-scrape';
import { RunScrape } from './application/use-cases/run-scrape';
import { StartScrape } from './application/use-cases/start-scrape';
import { ScrapingController } from './http/scraping.controller';
import { DrizzleImportedPodiumRepository } from './infra/drizzle-imported-podium.repository';
import { DrizzleScrapeRunRepository } from './infra/drizzle-scrape-run.repository';
import { HttpResultsSource } from './infra/http-results-source';
import { ScrapeScheduler } from './infra/scrape-scheduler';
import { SystemClock } from './infra/system-clock';

@Module({
  controllers: [ScrapingController],
  providers: [
    // Les ports (classes abstraites) sont reliés ici à leurs implémentations.
    { provide: ResultsSource, useClass: HttpResultsSource },
    { provide: ImportedPodiumRepository, useClass: DrizzleImportedPodiumRepository },
    { provide: ScrapeRunRepository, useClass: DrizzleScrapeRunRepository },
    { provide: Clock, useClass: SystemClock },
    {
      provide: SCRAPING_SETTINGS,
      inject: [AppConfig],
      useFactory: (config: AppConfig): ScrapingSettings => ({
        enabled: config.get('SCRAPING_ENABLED'),
        firstDay: config.get('SCRAPING_FIRST_DAY'),
        lastDay: config.get('SCRAPING_LAST_DAY'),
        timeZone: config.get('SCRAPING_TIMEZONE'),
        fullTimes: config.get('SCRAPING_FULL_TIMES'),
        windowStart: config.get('SCRAPING_WINDOW_START'),
        windowEnd: config.get('SCRAPING_WINDOW_END'),
        intervalMinutes: config.get('SCRAPING_INTERVAL_MINUTES'),
        tickSeconds: config.get('SCRAPING_TICK_SECONDS'),
        staleAfterMinutes: config.get('SCRAPING_STALE_AFTER_MINUTES'),
      }),
    },
    RunScrape,
    RunDueScrape,
    StartScrape,
    GetScrapeStatus,
    CheckStaleness,
    ScrapeScheduler,
  ],
})
export class ScrapingModule {}
