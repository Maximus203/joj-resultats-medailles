/** Le jour civil (AAAA-MM-JJ) qu'il est, à cet instant, dans un fuseau horaire IANA. */
export function localDay(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
