# 008 — Rythme de l'import des résultats officiels

**Statut** : Validée
**PRD** : specs/prd-resultats-medailles.md, TR6

## Contexte

Un import par soir laisse les podiums du jour invisibles jusqu'à 23 h. Cherif veut des résultats frais pendant la journée, sans relire tout le site à chaque fois, et savoir quand l'import est en retard. Cette spec complète la 007 (qui garde sa règle de conflit).

## User stories

- En tant que supporter, je veux voir les podiums quelques minutes après leur publication, et l'heure de la dernière mise à jour, afin de savoir si je peux me fier à l'écran.

## Scénarios d'acceptation

### AS1 — Un import léger toutes les 15 minutes, de 08:00 à 23:00

- **Étant donné** l'import activé, un fuseau de Dakar et un jour des Jeux
- **Quand** l'heure passe de 07:59 à 08:00, puis chaque quart d'heure, jusqu'à 23:00 puis 23:01
- **Alors** un import léger part à 08:00 puis tous les quarts d'heure jusqu'à 22:45 compris, pas à 07:59 ; à 23:00 l'import complet prend le créneau (il couvre un léger) ; rien à 23:01 ni hors des Jeux

### AS2 — Le léger ne lit que le nécessaire

- **Étant donné** des finales terminées aujourd'hui et hier, dont une déjà importée, et des jours plus anciens
- **Quand** un import léger tourne
- **Alors** seuls les calendriers d'aujourd'hui et d'hier sont lus, et la page des médaillés n'est ouverte que pour les finales terminées pas encore importées

### AS3 — Un import complet à 07:00 et à 23:00

- **Étant donné** l'import activé, et un podium que les organisateurs ont corrigé pendant la nuit
- **Quand** l'heure passe à 07:00, puis à 23:00
- **Alors** un import complet lit tous les jours des Jeux et le confronte à la base, corrections et écarts comme dans la spec 007, une seule fois par créneau

### AS4 — Le rattrapage au démarrage reste complet

- **Étant donné** un serveur arrêté pendant les Jeux, dont le dernier import complet réussi précède le dernier créneau complet dû (07:00 ou 23:00), ou date de plus de 24 heures
- **Quand** il démarre
- **Alors** il lance un import complet (22:59 rien, 23:00:30 un complet, rien si celui de 23:00 est déjà fait) ; aucun battement tardif ne lance d'import à une autre heure

### AS5 — Jamais deux imports en même temps

- **Étant donné** un import complet en cours
- **Quand** l'heure d'un import léger arrive
- **Alors** l'import léger est sauté et le suivi le montre comme sauté, avec sa raison, sans erreur

### AS6 — Le compte rendu dit le genre, la durée et la fraîcheur

- **Étant donné** des imports légers et complets terminés
- **Quand** on consulte l'état de l'import
- **Alors** chaque exécution porte son genre (léger ou complet), ses compteurs et sa durée, et l'état donne l'heure du dernier import réussi

### AS7 — Une donnée périmée est annoncée une seule fois

- **Étant donné** la fenêtre 08:00-23:00 des Jeux, et aucun import réussi depuis plus de 2 heures
- **Quand** on consulte l'état, et que l'horloge bat plusieurs fois
- **Alors** l'état indique « périmé » et un seul avertissement est journalisé pour l'épisode, un nouveau seulement après un retour à jour

### AS8 — Le bandeau « Données à jour à HH:MM »

- **Étant donné** un dernier import réussi lancé à 14:07 heure de Dakar, puis un import en retard
- **Quand** le supporter ouvre le tableau ou les résultats
- **Alors** il lit « Données à jour à 14:07 » (l'heure de lancement du dernier import réussi), puis un avertissement lisible disant que les données n'ont pas été mises à jour depuis cette heure ; si aucun import n'a jamais réussi, « Aucune mise à jour réussie pour l'instant », et « Impossible de vérifier la fraîcheur des données » quand l'état est injoignable

## Hors périmètre

- Message Telegram en cas de retard (le suivi viendra de l'extérieur, via l'état « périmé »).

## Questions ouvertes

- Un import léger ne compare pas aux podiums connus (ni mise à jour ni écart) : c'est le rôle des imports complets.
