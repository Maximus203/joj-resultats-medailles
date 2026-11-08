/** Clés TanStack Query de l'application, partagées parce qu'une écriture invalide plusieurs lectures. */
export const podiumKeys = {
  all: ['podiums'] as const,
  list: (day: string | undefined) => ['podiums', 'list', day ?? 'all'] as const,
  revisions: (id: string) => ['podiums', 'revisions', id] as const,
};
export const medalKeys = { all: ['medals'] as const };
export const scrapingKeys = { status: ['scraping', 'status'] as const };
