import { ResultsSource } from '../results-source';

/** Site officiel simulé : des pages par jour et par code, des pannes à la demande, jamais de réseau. */
export class FakeResultsSource extends ResultsSource {
  readonly schedules = new Map<string, string>();
  readonly medalLists = new Map<string, string>();
  readonly failing = new Set<string>();
  /** Si défini, chaque lecture attend cette promesse : sert à garder une exécution « en cours ». */
  gate: Promise<void> | null = null;
  readonly requests: string[] = [];

  async schedule(day: string): Promise<string> {
    return this.read(`schedule:${day}`, this.schedules.get(day));
  }

  async medalList(code: string): Promise<string> {
    return this.read(`medals:${code}`, this.medalLists.get(code));
  }

  private async read(request: string, page: string | undefined): Promise<string> {
    this.requests.push(request);
    await this.gate;
    if (this.failing.has(request) || page === undefined) throw new Error(`HTTP 500 sur ${request}`);
    return page;
  }
}
