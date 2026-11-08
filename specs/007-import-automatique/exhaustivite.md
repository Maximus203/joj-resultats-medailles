# 007 — Exhaustivité : pourquoi des médailles du Sénégal manquaient

Constat du 2026-11-08 (lecture du site officiel vers 13 h 50 UTC), établi sur pièces : les 13 calendriers (1er au 13 novembre) et les 102 pages « Medallists » des unités terminées, lus une seule fois avec la pause polie de 250 ms (aucune erreur HTTP), puis analysés hors ligne avec le code de `modules/scraping`. Base comparée : l'API publique `api-joj.artist-dev.com` (`GET /api/podiums`, `/api/medals`) et `apps/api/data/podiums.json`. Le code de lecture, rejoué sur ces pages par un serveur local, rend les mêmes chiffres (72 requêtes pour 64 épreuves : une page de médaillés par épreuve).

## Chiffres par jour

« Finales or » : unités terminées marquées médaille d'or sur le calendrier officiel. Un jour sans podium en base n'a pas été lu.

| Jour       | Finales or sur le site | Podiums lus par le parseur | `podiums.json` | Base en ligne | Écart base / site                |
| ---------- | ---------------------- | -------------------------- | -------------- | ------------- | -------------------------------- |
| 2026-11-01 | 8                      | 8                          | 8              | 8             | 0                                |
| 2026-11-02 | 9                      | 9                          | 9              | 9             | 0                                |
| 2026-11-03 | 16                     | 16                         | 16             | 16            | 0                                |
| 2026-11-04 | 9                      | 9                          | 9              | 9             | 0                                |
| 2026-11-05 | 10                     | 9                          | 9              | 9             | 1 (égalité à l'or)               |
| 2026-11-06 | 6                      | 6                          | 6              | 6             | 0                                |
| 2026-11-07 | 4                      | 4                          | 0              | 0             | 4 (jamais importées)             |
| 2026-11-08 | 2                      | 2                          | 0              | 0             | 2 (jamais importées)             |
| 09 au 13   | 0 (87 à venir)         | 0                          | 0              | 0             | 0                                |
| **Total**  | **64**                 | **63**                     | **57**         | **57**        | **7** podiums + 9 bronzes perdus |

Le site annonce 151 finales or pour les Jeux (le PRD en supposait 153) : 64 terminées, 87 à venir. Trois unités annulées et quatre retardées au calendrier, aucune n'est une finale à médaille.

## Causes établies

1. **Plus aucun import depuis le 6 novembre.** `podiums.json` et la base en ligne s'arrêtent au 6 : le scraping se lançait à la main, et seul le fichier était relu au seed. Les 4 finales de lutte sur plage du 7 novembre (dont **deux ors du Sénégal**, Men 80kg et Women 55kg) et les 2 courses sur route du 8 manquaient donc, tout simplement. C'est la cause principale : le Sénégal n'avait aucune médaille dans la base. Corrigée par l'import automatique (module `scraping`, 23:00 Dakar, rattrapage au démarrage).
2. **Le second bronze était jeté.** La table ne gardait qu'un bronze : en judo (8 épreuves) et au triathlon sprint, le second était perdu (9 épreuves, 9 médailles). Le bronze du Sénégal en **Judo Men -66 kg** (ARG et SEN) en faisait partie. Corrigée : colonne `second_bronze`, comptée au tableau des médailles (test `007-AS2`).
3. **Une égalité à l'or n'entrait pas, sans que personne le voie.** Natation, 50 m dos hommes (5 novembre) : or GRE et POR, pas d'argent, bronze BEL. L'ancien script levait une erreur, affichée seulement dans la console. Le podium (un seul or, un seul argent) ne sait pas la représenter : l'épreuve est maintenant **ignorée avec la raison `TIED_PLACES`**, visible dans le compte rendu (`GET /api/scraping`). Elle reste hors du tableau tant que le modèle n'a pas deux ors.

Effet cumulé sur le tableau : avec les 63 podiums lisibles et les 9 seconds bronzes, le Sénégal compte **2 or, 0 argent, 1 bronze, 9e sur 68 pays** ; le tableau tiré du JSON n'avait que 62 pays et aucune ligne Sénégal.

## Ce qui n'est pas une cause (vérifié)

- **Finales non marquées « or »** (wushu combiné, équitation) : 5 unités plain `FNL-` existent, mais chacune a une unité sœur marquée or du même événement : aucune épreuve perdue aujourd'hui. Le parseur les lit quand même désormais (précaution, test `007-AS2`) ; les placements, séries et manches sont écartés (7 unités).
- **Équipes mixtes, plusieurs pays** : aucune des 64 épreuves ne porte de ligne médaille avec un pays multiple ; toutes les lignes ont un code de trois lettres.
- **Pages à structure différente** : les 102 pages de médaillés lues contiennent des lignes médaille ; aucune n'a été illisible.
- **Cérémonies décalées** : toute unité terminée (`Finished`) avait déjà sa page de médaillés remplie ; aucune page vide sur les 102 lues.
- **Côté web** : le tableau, les résultats du jour et « Mon pays » lisent l'API (`/api/medals`, `/api/podiums`) ; le Sénégal est le pays suivi par défaut et toujours proposé. Il affichait « pas encore de médaille » parce que la base n'en avait pas. Limite d'affichage restante : le second bronze n'est pas montré sur la carte d'un podium (compté seulement au tableau) ; suite proposée.

## Épreuves manquantes en base au moment du constat

- 2026-11-07 : Beach Wrestling – Men 60kg, Women 55kg (SEN or), Men 80kg (SEN or), Women 75kg.
- 2026-11-08 : Cycling Road – Women's Road Race, Men's Road Race.
- 2026-11-05 : Swimming – Men's 50m Backstroke (égalité, ignorée).
- Second bronze absent (9) : Judo Men -55 kg (ZAM), Women -44 kg (ITA), Men -66 kg (SEN), Women -52 kg (SVK), Men -81 kg (BUL), Women -63 kg (KGZ), Women -78 kg (CHN), Men -100 kg (JPN) ; Triathlon sprint (KAZ).

## Garde-fou désormais en place

Chaque exécution enregistre, dans `GET /api/scraping`, les finales vues sur le site, celles qui ont donné un podium et la liste des ignorées avec leur raison, plus les épreuves en base absentes de la source : un trou ne peut plus rester silencieux.
