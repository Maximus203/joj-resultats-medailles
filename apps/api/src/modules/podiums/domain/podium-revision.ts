/** Une version remplacée d'un podium : ses trois pays, et le moment où elle a cessé d'être publiée. */
export interface PodiumRevision {
  gold: string;
  silver: string;
  bronze: string;
  /** Le second bronze de la version remplacée ; absent quand elle n'en avait pas. */
  secondBronze?: string | null;
  correctedAt: Date;
}
