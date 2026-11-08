# PRD — Résultats et médailles

**Statut** : Validé

## Problème

Pendant les JOJ Dakar 2026 (31 octobre au 13 novembre, 25 sports, environ 153 épreuves à médailles, sur Dakar, Diamniadio et Saly), les podiums tombent épreuve par épreuve, sur plusieurs sites. Les journalistes recoupent les résultats à la main d'une source à l'autre, et une erreur de podium publiée se corrige mal. Le public, lui, veut savoir qui a gagné aujourd'hui et où en est son pays.

## Utilisateurs

- Journaliste : enregistre et vérifie les podiums, et publie vite sans se tromper à 18 h.
- Supporter : consulte les résultats du jour et le nombre de médailles de son pays (par exemple depuis Thiès).

## Proposition

Le journaliste enregistre le podium d'une épreuve ; l'application refuse les podiums incohérents et tient elle-même le tableau des médailles, sans comptage à la main. Les corrections laissent une trace. Plus tard, un assistant IA rédige le résumé de la journée à partir des seuls résultats enregistrés : il gagne du temps au journaliste, qui relit, mais ne choisit jamais un médaillé.

## Mesure du succès

Pendant la démo : un podium est enregistré ; un second podium pour la même épreuve est refusé ; un podium avec deux fois le même pays est refusé ; le tableau des médailles se met à jour tout seul, trié par or, puis argent, puis bronze.

## Tranches

### TR1 — Enregistrer le podium d'une épreuve

Le journaliste enregistre l'or, l'argent et le bronze d'une épreuve (nom, discipline, jour), chaque médaillé étant un pays. Règles : une épreuve n'a qu'un seul podium ; les trois pays d'un podium sont différents.

### TR2 — Tableau des médailles

Pour chaque pays, ses médailles d'or, d'argent et de bronze, triées par or, puis argent, puis bronze. Deux pays à égalité parfaite sont classés au même rang. Prérequis : TR1.

### TR3 — Résultats d'une journée

Tous les podiums d'un jour, regroupés par discipline. Prérequis : TR1.

### TR4 — Corriger un podium

Le journaliste corrige un podium déjà publié ; l'ancienne version reste consultable avec la date de correction. Prérequis : TR1.

### TR5 — Résumé de la journée par un assistant IA

Un résumé rédigé par un assistant IA pour une journée, avec la liste des épreuves sur lesquelles il s'appuie. Une journée sans résultat n'a pas de résumé. Prérequis : TR3.

### TR6 — Import automatique des résultats officiels

Chaque jour à heure fixe, l'application lit les podiums publiés par le site officiel des résultats et les enregistre seule, sans doublon ; un podium corrigé ou saisi par le journaliste n'est jamais écrasé, et chaque exécution laisse un compte rendu lisible (ce qui a été trouvé, importé, ignoré, et pourquoi). Prérequis : TR1, TR4.

## Hors périmètre

- Scores, chronos, phases de qualification, comptes et droits d'accès, billetterie, programme.

## Hypothèses et risques

- Hypothèses : dates, 25 sports et environ 153 épreuves viennent de la presse (151 ou 153, non confirmé) ; pas de classement officiel des médailles aux JOJ, notre tableau est informatif ; le journaliste saisit à la main d'après la source officielle ou laisse l'import automatique (TR6) le faire, TR4 est le filet ; le tableau ne compte qu'un podium par épreuve : une égalité à l'or n'y entre pas. Risques : les équipes mixtes de plusieurs pays, non classées aux JOJ, manqueraient au tableau ; rien ne limite la saisie aux journalistes (accepté pour la démo, à lever avant tout usage réel).
