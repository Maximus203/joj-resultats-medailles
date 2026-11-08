/**
 * La clé de comparaison d'une épreuve : sans casse, sans accent, avec un seul tiret, une seule apostrophe
 * (droite, courbe, accent grave ou aigu) et des espaces simples. « Judo - Men -66 kg » (saisi au clavier) et « Judo – Men -66 kg » (importé) sont la même
 * épreuve. Aucune correspondance floue : deux noms qui diffèrent autrement restent deux épreuves.
 */
export function normalizeEventKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’ʼ`´]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
