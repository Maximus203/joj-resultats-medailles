import { z } from 'zod';

export const PODIUM_TEXT_MAX_LENGTH = 100;

/** Un pays se désigne par un code de trois lettres majuscules (SEN, JPN, FRA). */
export const countryCodeSchema = z.string().regex(/^[A-Z]{3}$/);

/** Corps de `POST /api/podiums`. Le domaine nettoie le nom et refuse les pays en double. */
export const recordPodiumSchema = z.object({
  eventName: z.string().trim().min(1).max(PODIUM_TEXT_MAX_LENGTH),
  discipline: z.string().trim().min(1).max(PODIUM_TEXT_MAX_LENGTH),
  day: z.iso.date(),
  gold: countryCodeSchema,
  silver: countryCodeSchema,
  bronze: countryCodeSchema,
});
export type RecordPodiumInput = z.infer<typeof recordPodiumSchema>;

/** Un podium tel que l'API le renvoie. */
export const podiumSchema = z.object({
  id: z.uuid(),
  eventName: z.string(),
  discipline: z.string(),
  day: z.iso.date(),
  gold: countryCodeSchema,
  silver: countryCodeSchema,
  bronze: countryCodeSchema,
  /** Le second bronze des épreuves à deux bronzes (judo, lutte) ; `null` ou absent sinon. */
  secondBronze: countryCodeSchema.nullable().optional(),
  createdAt: z.iso.datetime(),
});
export type PodiumResponse = z.infer<typeof podiumSchema>;
