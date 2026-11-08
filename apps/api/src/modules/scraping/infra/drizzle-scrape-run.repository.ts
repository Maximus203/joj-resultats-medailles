import { desc, ne } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { ScrapeRunRepository } from '../application/scrape-run.repository';
import { type ScrapeRun, countsOf } from '../domain/scrape-run';
import { type ScrapeRunRow, scrapeRuns } from './scraping.schema';

@Injectable()
export class DrizzleScrapeRunRepository extends ScrapeRunRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async add(run: ScrapeRun): Promise<void> {
    await this.db.insert(scrapeRuns).values({
      id: run.id,
      trigger: run.trigger,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      ...countsOf(run.report),
      report: run.report,
    });
  }

  async latest(limit: number): Promise<ScrapeRun[]> {
    const rows = await this.db
      .select()
      .from(scrapeRuns)
      .orderBy(desc(scrapeRuns.startedAt))
      .limit(limit);
    return rows.map(toRun);
  }

  async lastSucceededAt(): Promise<Date | null> {
    const [row] = await this.db
      .select({ startedAt: scrapeRuns.startedAt })
      .from(scrapeRuns)
      .where(ne(scrapeRuns.status, 'failed'))
      .orderBy(desc(scrapeRuns.startedAt))
      .limit(1);
    return row?.startedAt ?? null;
  }
}

function toRun(row: ScrapeRunRow): ScrapeRun {
  return {
    id: row.id,
    trigger: row.trigger as ScrapeRun['trigger'],
    status: row.status as ScrapeRun['status'],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    report: row.report,
  };
}
