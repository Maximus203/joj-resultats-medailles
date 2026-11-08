/**
 * Décide si `pnpm db:scrape` peut remplacer `data/podiums.json` : un fichier qui rétrécit (site
 * en panne, jours illisibles) ne doit pas écraser en silence un fichier plus complet.
 */
export function planWrite(
  previous: number,
  next: number,
  force: boolean,
): { write: boolean; message: string } {
  if (next < previous && !force) {
    return {
      write: false,
      message: `Refusé : le nouveau fichier ne contient que ${next} podium(s) contre ${previous} aujourd’hui. Relance avec --force pour le remplacer quand même.`,
    };
  }
  return {
    write: true,
    message: `${previous} podium(s) remplacé(s) par ${next} podium(s) écrit(s).`,
  };
}
