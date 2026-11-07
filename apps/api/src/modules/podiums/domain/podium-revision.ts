/** Une version remplacée d'un podium : ses trois pays, et le moment où elle a cessé d'être publiée. */
export interface PodiumRevision {
  gold: string;
  silver: string;
  bronze: string;
  correctedAt: Date;
}
