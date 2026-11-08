import { describe, expect, it } from 'vitest';
import { createOfficialSiteSource } from './official-site-http';

const OPTIONS = {
  baseUrl: 'https://site.test/nh/en/Comp',
  userAgent: 'joj-test/1.0',
  requestDelayMs: 250,
  requestTimeoutMs: 30_000,
};

function setup(respond: (url: string) => Response) {
  const calls: { url: string; headers: Headers; hasTimeout: boolean }[] = [];
  const pauses: number[] = [];
  const fetchFn = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    calls.push({ url, headers: new Headers(init?.headers), hasTimeout: init?.signal != null });
    return respond(url);
  };
  const source = createOfficialSiteSource({
    ...OPTIONS,
    fetchFn,
    sleep: async (ms) => {
      pauses.push(ms);
    },
  });
  return { source, calls, pauses };
}

describe('createOfficialSiteSource', () => {
  it('007-AS5: asks for the schedule of a day in the site format, politely, with a timeout', async () => {
    const { source, calls, pauses } = setup(() => new Response('<html>calendrier</html>'));

    const html = await source.schedule('2026-11-05');

    expect(html).toBe('<html>calendrier</html>');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      'https://site.test/nh/en/Comp/ScheduleDatePartial?sportCode=---&day=05112026',
    );
    expect(calls[0]?.headers.get('User-Agent')).toBe('joj-test/1.0');
    expect(calls[0]?.hasTimeout).toBe(true);
    expect(pauses).toEqual([250]);
  });

  it('007-AS5: asks for the medallists of a unit with its code encoded', async () => {
    const { source, calls } = setup(() => new Response('page'));

    await source.medalList('JUDM66KG---FNL-000100--');

    expect(calls[0]?.url).toBe(
      'https://site.test/nh/en/Comp/ListPartial?pagetype=MedalList&rsc=JUDM66KG---FNL-000100--',
    );
  });

  it('007-AS5: turns a bad status into an error that names the page, without pausing', async () => {
    const { source, pauses } = setup(() => new Response('oups', { status: 503 }));

    await expect(source.schedule('2026-11-05')).rejects.toThrow(/HTTP 503/);
    expect(pauses).toEqual([]);
  });
});
