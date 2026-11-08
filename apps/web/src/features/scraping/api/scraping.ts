import { scrapeStatusSchema } from '@joj/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { scrapingKeys } from '@/lib/query-keys';

const REFRESH_MS = 60_000;

/** L'état de l'import des résultats officiels ; relu chaque minute pour que le bandeau reste juste. */
export function useScrapeStatus() {
  return useQuery({
    queryKey: scrapingKeys.status,
    queryFn: ({ signal }) => api.request('/scraping', { schema: scrapeStatusSchema, signal }),
    refetchInterval: REFRESH_MS,
  });
}
