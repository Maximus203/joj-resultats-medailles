import { z } from 'zod';
import { countryCodeSchema, podiumSchema } from './podiums.ts';

/**
 * Contrat des tranches TR2 (tableau des médailles), TR3 (résultats d'un jour) et TR4 (correction).
 * L'API et le front se branchent sur ces schémas ; ne pas les changer sans les deux côtés.
 */

/** Un podium publié : `correctedAt` vaut `null` tant qu'il n'a jamais été corrigé. */
export const publishedPodiumSchema = podiumSchema.extend({
  correctedAt: z.iso.datetime().nullable(),
});
export type PublishedPodium = z.infer<typeof publishedPodiumSchema>;

/** `GET /api/podiums?day=AAAA-MM-JJ` : les podiums d'un jour (tous les jours sans `day`), plus récents d'abord. */
export const listPodiumsQuerySchema = z.object({ day: z.iso.date().optional() });
export const podiumListSchema = z.object({ items: z.array(publishedPodiumSchema) });
export type PodiumList = z.infer<typeof podiumListSchema>;

/** `GET /api/medals` : une ligne par pays, triée or, puis argent, puis bronze. Rang « à la compétition » : 1, 2, 2, 4. */
export const medalRowSchema = z.object({
  rank: z.number().int().min(1),
  country: countryCodeSchema,
  gold: z.number().int().min(0),
  silver: z.number().int().min(0),
  bronze: z.number().int().min(0),
});
export type MedalRow = z.infer<typeof medalRowSchema>;
export const medalTableSchema = z.object({ items: z.array(medalRowSchema) });
export type MedalTable = z.infer<typeof medalTableSchema>;

/** Corps de `PUT /api/podiums/:id` : seuls les trois pays se corrigent (l'épreuve, la discipline et le jour restent). */
export const correctPodiumSchema = z.object({
  gold: countryCodeSchema,
  silver: countryCodeSchema,
  bronze: countryCodeSchema,
});
export type CorrectPodiumInput = z.infer<typeof correctPodiumSchema>;

/** `GET /api/podiums/:id/revisions` : les versions remplacées, la plus récente d'abord, avec la date de correction. */
export const podiumRevisionSchema = z.object({
  gold: countryCodeSchema,
  silver: countryCodeSchema,
  bronze: countryCodeSchema,
  correctedAt: z.iso.datetime(),
});
export type PodiumRevision = z.infer<typeof podiumRevisionSchema>;
export const podiumRevisionListSchema = z.object({ items: z.array(podiumRevisionSchema) });
export type PodiumRevisionList = z.infer<typeof podiumRevisionListSchema>;

/*
 * Erreurs (RFC 9457, champ `code`) :
 *   PUT /api/podiums/:id            404 PODIUM_NOT_FOUND · 422 PODIUM_COUNTRIES_NOT_DISTINCT · 400 VALIDATION_FAILED
 *   GET /api/podiums/:id/revisions  404 PODIUM_NOT_FOUND
 *   Une correction identique à la version publiée est acceptée sans nouvelle révision.
 */
