/** Pages du site officiel pour les tests : même structure HTML que les vraies, contenu inventé. */

export function scheduleItem(
  kind: string,
  code: string,
  discipline: string,
  competition: string,
  status = 'Finished',
): string {
  return `<div class="scheduleItem ${kind}"> <div class="link-wrapper"> <a aria-label="x" href="/nh/en/Info/ResultList/${code}"><div class="header-content"><div class="status"><span class="textStatus">${status}</span></div></div><div class="unit-content"><div class="unit-name"><div class="discipline-name"> <div class="sportimage"> <img alt="i" src="/i.svg" /> </div>${discipline} </div><div class="competition-name"> ${competition} </div></div></div></a></div></div>`;
}

export function medalRow(medal: string, noc: string): string {
  return `<tr class="False"><td class="colMedal"><div class="medal-icon"><img alt="${medal} medal icon" src="/m.png" /><abbr title="${medal} Medal"> X </abbr></div></td><td class="noc-column"><a title="n" href="/c/${noc}" class="noc-element"><img src="/f.svg" alt="" /><span>${noc}</span></a></td><td class="c-a-l">Someone</td></tr>`;
}

export const medalPage = (...rows: [string, string][]): string =>
  `<table><tbody>${rows.map(([medal, noc]) => medalRow(medal, noc)).join('')}</tbody></table>`;
