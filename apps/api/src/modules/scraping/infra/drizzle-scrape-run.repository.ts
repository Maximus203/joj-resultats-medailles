import { type SQL, and, desc, eq, ne, notInArray } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { ScrapeRunRepository } from '../application/scrape-run.repository';
import { type ScrapeKind, type ScrapeRun, countsOf } from '../domain/scrape-run';
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
      kind: run.kind,
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
    return this.firstStartedAt(notInArray(scrapeRuns.status, ['failed', 'skipped']));
  }

  async lastAttemptAt(): Promise<Date | null> {
    return this.firstStartedAt(undefined);
  }

  async lastStartedAt(kind: ScrapeKind): Promise<Date | null> {
    return this.firstStartedAt(and(eq(scrapeRuns.kind, kind), ne(scrapeRuns.status, 'skipped')));
  }

  async latestFull(): Promise<ScrapeRun | null> {
    const [row] = await this.db
      .select()
      .from(scrapeRuns)
      .where(and(eq(scrapeRuns.kind, 'full'), ne(scrapeRuns.status, 'skipped')))
      .orderBy(desc(scrapeRuns.startedAt))
      .limit(1);
    return row ? toRun(row) : null;
  }

  private async firstStartedAt(where: SQL | undefined): Promise<Date | null> {
    const [row] = await this.db
      .select({ startedAt: scrapeRuns.startedAt })
      .from(scrapeRuns)
      .where(where)
      .orderBy(desc(scrapeRuns.startedAt))
      .limit(1);
    return row?.startedAt ?? null;
  }
}

function toRun(row: ScrapeRunRow): ScrapeRun {
  return {
    id: row.id,
    trigger: row.trigger as ScrapeRun['trigger'],
    kind: row.kind as ScrapeKind,
    status: row.status as ScrapeRun['status'],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    // Les comptes rendus d'avant l'import léger n'ont pas `finalsKnown`.
    report: {
      ...row.report,
      exhaustiveness: {
        ...row.report.exhaustiveness,
        finalsKnown: row.report.exhaustiveness.finalsKnown ?? 0,
      },
    },
  };
}
