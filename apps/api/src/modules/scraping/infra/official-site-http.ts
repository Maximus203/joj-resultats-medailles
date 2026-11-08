import type { OfficialSource } from '../domain/official-results';

/**
 * Les deux pages du site officiel, lues en HTTP : délai maximal par requête, pause polie après
 * chaque réponse. Sans import relatif de valeur (un seul `import type`), pour que le script
 * `pnpm db:scrape` l'importe tel quel, comme l'API : la lecture du site est écrite une fois.
 */
export interface OfficialSiteOptions {
  /** Racine des pages, sans barre finale (ex. `https://…/nh/en/Comp`). */
  baseUrl: string;
  userAgent: string;
  requestDelayMs: number;
  requestTimeoutMs: number;
  /** Remplaçables par les tests : jamais de réseau ni d'attente réelle. */
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

/** AAAA-MM-JJ → JJMMAAAA, le format du paramètre `day` du site. */
function siteDay(day: string): string {
  const [year, month, date] = day.split('-');
  return `${date}${month}${year}`;
}

export function createOfficialSiteSource(options: OfficialSiteOptions): OfficialSource {
  const fetchFn = options.fetchFn ?? fetch;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  async function get(url: string): Promise<string> {
    let response: Response;
    try {
      response = await fetchFn(url, {
        headers: { 'User-Agent': options.userAgent },
        signal: AbortSignal.timeout(options.requestTimeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`délai de ${options.requestTimeoutMs} ms dépassé sur ${url}`);
      }
      throw error;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} sur ${url}`);
    const body = await response.text();
    await sleep(options.requestDelayMs);
    return body;
  }

  return {
    schedule: (day) =>
      get(`${options.baseUrl}/ScheduleDatePartial?sportCode=---&day=${siteDay(day)}`),
    medalList: (code) =>
      get(`${options.baseUrl}/ListPartial?pagetype=MedalList&rsc=${encodeURIComponent(code)}`),
  };
}
