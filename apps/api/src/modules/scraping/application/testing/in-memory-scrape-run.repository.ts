import type { ScrapeRun } from '../../domain/scrape-run';
import { ScrapeRunRepository } from '../scrape-run.repository';

export class InMemoryScrapeRunRepository extends ScrapeRunRepository {
  readonly runs: ScrapeRun[] = [];

  async add(run: ScrapeRun): Promise<void> {
    this.runs.unshift(run);
  }

  async latest(limit: number): Promise<ScrapeRun[]> {
    return this.runs.slice(0, limit);
  }

  async lastSucceededAt(): Promise<Date | null> {
    return this.runs.find((run) => run.status !== 'failed')?.startedAt ?? null;
  }
}
