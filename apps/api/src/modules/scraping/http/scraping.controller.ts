import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  type ScrapeRunResponse,
  type ScrapeRunSummary,
  type ScrapeStatus,
  scrapeStatusSchema,
  type StartScrapeResponse,
  startScrapeResponseSchema,
} from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { GetScrapeStatus } from '../application/use-cases/get-scrape-status';
import { StartScrape } from '../application/use-cases/start-scrape';
import { type ScrapeRun, countsOf } from '../domain/scrape-run';

class ScrapeStatusDto extends createZodDto(scrapeStatusSchema) {}
class StartScrapeResponseDto extends createZodDto(startScrapeResponseSchema) {}

/** Couche fine : appeler un cas d'usage, sérialiser. Le POST est une écriture, protégée par Traefik en production. */
@ApiTags('scraping')
@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly getScrapeStatus: GetScrapeStatus,
    private readonly startScrape: StartScrape,
  ) {}

  @Get()
  @ZodSerializerDto(ScrapeStatusDto)
  async status(): Promise<ScrapeStatus> {
    const view = await this.getScrapeStatus.execute();
    const { settings } = view;
    return {
      enabled: settings.enabled,
      running: view.running,
      schedule: {
        timeZone: settings.timeZone,
        fullTimes: [...settings.fullTimes],
        windowStart: settings.windowStart,
        windowEnd: settings.windowEnd,
        intervalMinutes: settings.intervalMinutes,
        staleAfterMinutes: settings.staleAfterMinutes,
        firstDay: settings.firstDay,
        lastDay: settings.lastDay,
      },
      nextRunAt: view.nextRunAt?.toISOString() ?? null,
      lastRun: view.lastRun ? toRunResponse(view.lastRun) : null,
      recentRuns: view.recentRuns.map(toSummary),
    };
  }

  @Post('runs')
  @HttpCode(202)
  @ZodSerializerDto(StartScrapeResponseDto)
  start(): StartScrapeResponse {
    this.startScrape.execute();
    return { status: 'started' };
  }
}

function toSummary(run: ScrapeRun): ScrapeRunSummary {
  return {
    id: run.id,
    trigger: run.trigger,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt.toISOString(),
    counts: countsOf(run.report),
  };
}

function toRunResponse(run: ScrapeRun): ScrapeRunResponse {
  return { ...toSummary(run), report: run.report };
}
