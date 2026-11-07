/**
 * Logique pure de `pnpm db:seed` et `pnpm db:reset` (testée) ; l'accès à la base est dans db.mts.
 */

export interface SeedStatement {
  table: string;
  sql: string;
  params: unknown[];
}

/**
 * `data/disciplines.json` alimente la table `disciplines`. Un préfixe numérique fixe l'ordre de
 * chargement, utile quand une table en référence une autre : `01-pays.json`, `02-athletes.json`.
 */
export function tableNameFromFile(fileName: string): string {
  return fileName.replace(/\.json$/, '').replace(/^\d+-/, '');
}

/**
 * Une ligne JSON = une ligne de la table ; les clés sont les noms des colonnes en base
 * (snake_case). Une ligne déjà présente (même clé ou même valeur unique) est ignorée : le seed
 * peut être relancé sans erreur.
 */
export function seedStatements(table: string, rows: unknown): SeedStatement[] {
  if (!Array.isArray(rows)) {
    throw new Error(`data/${table}.json doit contenir un tableau de lignes`);
  }
  return rows.map((row, index) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      throw new Error(`data/${table}.json, ligne ${index} : un objet est attendu`);
    }
    const columns = Object.keys(row);
    if (columns.length === 0) {
      throw new Error(`data/${table}.json, ligne ${index} : aucune colonne`);
    }
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    return {
      table,
      sql: `INSERT INTO ${quote(table)} (${columns.map(quote).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
      params: Object.values(row).map((value) =>
        typeof value === 'object' && value !== null ? JSON.stringify(value) : value,
      ),
    };
  });
}

function quote(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}
