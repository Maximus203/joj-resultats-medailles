import { Inject, Injectable } from '@nestjs/common';
import { type ScrapeKind, type ScrapeRun, type ScrapeTrigger } from '../../domain/scrape-run';
import { dueRun } from '../../domain/scrape-schedule';
import { Clock } from '../clock';
import { ScrapeRunRepository } from '../scrape-run.repository';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../scraping-settings';
import { ScrapingError } from '../../domain/scraping.errors';
import { RunScrape } from './run-scrape';

/**
 * Appelé par l'horloge à chaque battement : lance l'import dû (complet à heure fixe, léger à
 * intervalle, rattrapage complet au démarrage), sinon ne fait rien. Rend l'exécution lancée ou
 * sautée, ou `null`.
 */
@Injectable()
export class RunDueScrape {
  constructor(
    private readonly runScrape: RunScrape,
    private readonly runs: ScrapeRunRepository,
    private readonly clock: Clock,
    @Inject(SCRAPING_SETTINGS) private readonly settings: ScrapingSettings,
  ) {}

  /** Le créneau complet dû pendant un autre import : retenté aux battements suivants, tracé s'il expire. */
  private pendingSlot: Date | null = null;

  async execute({ startup }: { startup: boolean }): Promise<ScrapeRun | null> {
    if (!this.settings.enabled) return null;
    const [lastAttemptAt, lastFullAt, lastSucceededAt] = await Promise.all([
      this.runs.lastAttemptAt(),
      this.runs.lastStartedAt('full'),
      this.runs.lastSucceededAt(),
    ]);
    const due = dueRun(
      { now: this.clock.now(), lastAttemptAt, lastFullAt, lastSucceededAt, startup },
      this.settings,
    );
    const expired = await this.traceExpiredSlot(due?.slot ?? null, lastFullAt);
    if (!due) return expired;
    const trigger = due.reason === 'catch-up' ? 'startup' : 'scheduled';
    return this.start(trigger, due.kind, due.slot ?? null);
  }

  private async start(
    trigger: ScrapeTrigger,
    kind: ScrapeKind,
    slot: Date | null,
  ): Promise<ScrapeRun | null> {
    // Jamais deux imports à la fois (le garde est celui de RunScrape) : un import léger dû pendant un
    // autre est sauté et tracé ; un créneau complet est retenu pour le battement suivant.
    if (this.runScrape.running) return this.holdOrSkip(trigger, kind, slot);
    this.pendingSlot = null;
    try {
      return await this.runScrape.execute(trigger, kind);
    } catch (error) {
      if (error instanceof ScrapingError && error.code === 'SCRAPE_ALREADY_RUNNING') {
        return this.holdOrSkip(trigger, kind, slot);
      }
      throw error;
    }
  }

  private async holdOrSkip(
    trigger: ScrapeTrigger,
    kind: ScrapeKind,
    slot: Date | null,
  ): Promise<ScrapeRun | null> {
    if (kind === 'full' && slot) {
      this.pendingSlot = slot;
      return null;
    }
    return this.runScrape.recordSkipped(trigger, kind, 'un autre import est en cours');
  }

  /** Un créneau complet retenu qui n'est plus dû sans avoir tourné est perdu : on le trace. */
  private async traceExpiredSlot(
    dueSlot: Date | null,
    lastFullAt: Date | null,
  ): Promise<ScrapeRun | null> {
    const pending = this.pendingSlot;
    if (!pending || dueSlot?.getTime() === pending.getTime()) return null;
    this.pendingSlot = null;
    if (lastFullAt && lastFullAt >= pending) return null;
    const hour = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: this.settings.timeZone,
    }).format(pending);
    return this.runScrape.recordSkipped(
      'scheduled',
      'full',
      `le créneau complet de ${hour} est perdu : un autre import était en cours`,
    );
  }
}
