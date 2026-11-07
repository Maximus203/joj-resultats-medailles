# Atelier C : des pistes si tu sèches

À ouvrir seulement si tu n'as pas d'idée après 10 minutes, ou sur conseil de ton coach. Ce sont des points de départ, pas des consignes : prends-en une, transforme-la, ou combine-en deux. Ton PRD doit toujours dire pour qui et pourquoi.

## Résultats et médailles

- Enregistrer le podium d'une épreuve. Règles possibles : une épreuve n'a qu'un seul podium (`409`) ; les trois médaillés sont trois pays différents et connus (`422`).
- Afficher le tableau des médailles : pour chaque pays, le nombre de médailles d'or, d'argent et de bronze, trié par or, puis argent, puis bronze.
- Afficher les résultats d'une journée, triés par discipline.
- **Avec Claude** : rédiger le résumé d'une journée pour les journalistes, à partir des résultats enregistrés. Règles possibles : une journée sans résultat n'a pas de résumé (`404`), et Claude n'est pas appelé ; le résumé est renvoyé avec la liste des épreuves sur lesquelles il s'appuie.

## Guide touristique de Dakar

- Afficher l'agenda d'une journée : les animations du jour, triées par heure de début, avec leur lieu.
- Afficher ce qui est en cours à une heure donnée : une animation est en cours si l'heure est entre son début (inclus) et sa fin (exclue).
- Proposer une animation. Règles possibles : la fin est après le début (`400`) ; elle a lieu pendant les Jeux, du 31 octobre au 13 novembre 2026 (`422`).
- **Avec Claude** : répondre à une question en langage courant (« que faire ce soir près de Diamniadio ? ») en proposant des animations du jour. Règles possibles : une question vide est refusée (`400`) ; seules des animations qui existent sont proposées, et une proposition de Claude qui n'existe pas en base est écartée.

## Mobilité et covoiturage

- Réserver une place sur un trajet. Règles possibles : plus de place disponible (`409`, par exemple `TRIP_FULL`) ; un même passager ne réserve pas deux fois le même trajet (`409`).
- Chercher les trajets vers un site pour une journée, triés par heure de départ, avec les places restantes.
- Proposer un trajet. Règle possible : le nombre de places est entre 1 et 4 (`400`).
- **Avec Claude** : proposer un trajet à partir d'un message libre de conducteur (« Je pars des Parcelles à 7 h pour Diamniadio, 3 places »). Claude en extrait le quartier, le site, l'heure et les places, puis les règles habituelles s'appliquent : site inconnu (`422`), places entre 1 et 4 (`400`).
