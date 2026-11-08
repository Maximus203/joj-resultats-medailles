/** Port : l'heure. Les tests en donnent une horloge fixe, jamais d'attente réelle. */
export abstract class Clock {
  abstract now(): Date;
}
