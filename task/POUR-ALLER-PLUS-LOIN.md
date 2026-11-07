# Pour aller plus loin : le programme des épreuves

Une fonctionnalité de plus, pour t'entraîner à la méthode après la journée (ou si tu as fini l'atelier C en avance). Même cycle que les ateliers B et C : `/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge`, sur ta branche, après `/clear`. Ses règles sont plus difficiles à bien formuler que celles des bénévoles : c'est l'intérêt de l'exercice.

## Programme des épreuves (environ 50 minutes)

**Pourquoi.** Le comité d'organisation construit le programme des Jeux, épreuve par épreuve. Une épreuve se déroule dans un lieu (un stade, une salle, une plage). Deux épreuves ne peuvent pas occuper le même lieu en même temps, et aucune épreuve ne peut avoir lieu en dehors des dates des Jeux.

**Ce que l'on doit pouvoir faire.**

- Programmer une épreuve pour une discipline existante : un nom (par exemple « Finale 3x3 filles »), un lieu, écrit en texte libre (par exemple « Dakar Arena »), une heure de début et une heure de fin (après le début).
- Consulter le programme d'une journée : toutes les épreuves de cette journée, tous lieux confondus, triées par heure de début.

**Les deux règles métier**, chacune prouvée par un test :

| Règle                                                                                                                                                                                                                                                                        | Réponse de l'API                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Deux épreuves ne se chevauchent pas dans le même lieu. Une épreuve peut commencer à la minute exacte où la précédente finit. Le lieu se compare sans tenir compte des majuscules ni des espaces au début et à la fin (« Dakar Arena » et « dakar arena » sont le même lieu). | refus `409`, code `VENUE_ALREADY_BOOKED` |
| Une épreuve se déroule entièrement pendant les Jeux : du samedi 31 octobre 2026 à 0 h jusqu'au vendredi 13 novembre 2026 inclus, donc avant le samedi 14 novembre à 0 h, heure de Dakar (qui est aussi l'heure UTC, sans changement d'heure).                                | refus `422`, code `EVENT_OUTSIDE_GAMES`  |

Note la différence entre les deux statuts. `409` (CONFLICT) signale un conflit avec une donnée qui existe déjà, ici une autre épreuve. `422` (BUSINESS_RULE) signale une demande valide sur la forme, mais contraire à une règle du métier, quelles que soient les autres données.

**Un exemple pour relire les scénarios.** À la Dakar Arena, la « Finale 3x3 filles » est programmée le 2 novembre 2026 de 10 h à 12 h.

1. « Finale 3x3 garçons », au même lieu, de 11 h à 13 h : refusé avec `VENUE_ALREADY_BOOKED`, car les deux épreuves se chevauchent de 11 h à 12 h.
2. La même épreuve de 12 h à 14 h : acceptée, car elle commence quand la précédente finit.
3. « Lutte, poule A » au stade Iba Mar Diop, de 11 h à 13 h : acceptée, car c'est un autre lieu.
4. « Cérémonie d'essai » le 30 octobre 2026 : refusée avec `EVENT_OUTSIDE_GAMES`. Même refus pour une épreuve qui commence le 13 novembre à 23 h et finit le 14 novembre à 1 h.
5. Le programme du 2 novembre affiche, dans cet ordre : Finale 3x3 filles (10 h), Lutte, poule A (11 h), Finale 3x3 garçons (12 h).

**Hors périmètre** : l'écran, la modification ou la suppression d'une épreuve, une liste officielle des lieux (le lieu reste un texte libre), les fuseaux horaires autres que celui de Dakar, la billetterie et les résultats.

**Le texte à donner à `/prd`** (après `/clear`). Ici, c'est à toi de l'écrire, à partir du « Pourquoi » ci-dessus : pour qui, quel problème, ta proposition, comment on sait que ça marche, et une tranche 1 qui contient les deux règles. Claude te challengera sur ce qui manque.

**Le texte à donner à `/spec`** (copie-le tel quel, après la validation du PRD) :

```
/spec TR1 Programme des épreuves : programmer une épreuve (nom, lieu en texte libre, début, fin) pour une discipline existante, et consulter le programme d'une journée, toutes épreuves confondues, trié par heure de début. Deux épreuves ne peuvent pas se chevaucher dans le même lieu ; une épreuve peut commencer à l'heure exacte où la précédente finit ; le lieu se compare sans tenir compte des majuscules ni des espaces autour : refus 409 avec le code VENUE_ALREADY_BOOKED. Une épreuve doit se dérouler entièrement pendant les Jeux, du 31 octobre 2026 à 0 h jusqu'au 13 novembre 2026 inclus (avant le 14 novembre à 0 h), heure de Dakar (UTC) : refus 422 avec le code EVENT_OUTSIDE_GAMES. Pas d'écran : seulement l'API.
```

**Points à surveiller en relisant**, car ce sont les erreurs les plus fréquentes sur cette fonctionnalité :

- la spec a un scénario pour le cas limite « commence à l'heure où la précédente finit » : sans lui, rien ne prouve que ce cas est accepté ;
- le plan place les deux règles dans le domaine (`domain/`), pas dans le controller ;
- le test du chevauchement vérifie le code `VENUE_ALREADY_BOOKED`, pas seulement le statut `409` ;
- une épreuve qui commence le 13 novembre et finit le 14 est bien refusée, et pas seulement une épreuve qui commence après les Jeux.

**Réussi si** la spec `002` a un scénario par règle, plus le cas nominal et le cas limite, le plan prévoit `409` pour le chevauchement et `422` pour les dates, et `/converge` répond « Converged ».
