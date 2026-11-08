# 007 — Import automatique des résultats officiels

**Statut** : Validée
**PRD** : specs/prd-resultats-medailles.md, TR6

## Contexte

Le journaliste recopie à la main les podiums du site officiel, et le supporter ne voit pas encore le Sénégal : des finales manquent. L'application lit elle-même le site officiel chaque soir. Le constat chiffré des manques est dans `specs/007-import-automatique/exhaustivite.md`.

## User stories

- En tant que supporter ou journaliste, je veux que les podiums officiels arrivent seuls et que chaque import dise ce qu'il a trouvé, changé ou laissé, afin de voir toutes les médailles de mon pays sans jamais perdre une correction.

## Scénarios d'acceptation

### AS1 — Les finales terminées arrivent, une seule fois

- **Étant donné** un site officiel qui publie trois finales terminées et une finale à venir, et une base vide
- **Quand** l'import tourne, puis une seconde fois sans changement
- **Alors** trois podiums existent, un par épreuve, et la seconde exécution n'ajoute ni ne change rien

### AS2 — Les finales atypiques ne sont pas perdues

- **Étant donné** une finale non marquée « or » sur le calendrier (wushu combiné, équitation) et un judo à deux bronzes dont un du Sénégal
- **Quand** l'import tourne
- **Alors** les deux épreuves ont un podium, et le tableau des médailles compte les deux pays de bronze

### AS3 — Une égalité à l'or est dite, pas devinée

- **Étant donné** une finale terminée avec deux médailles d'or et aucune d'argent
- **Quand** l'import tourne
- **Alors** aucun podium n'est créé pour elle, et le compte rendu la liste comme ignorée, avec la raison « égalité »

### AS4 — Le journaliste garde la main, l'officiel est suivi

- **Étant donné** un podium corrigé par le journaliste, un podium saisi à la main pour une épreuve que le site publie ensuite avec d'autres médaillés, et un podium importé jamais corrigé que le site corrige
- **Quand** l'import tourne
- **Alors** les deux premiers sont intacts sans épreuve en double, chaque écart est listé avec l'ancien et le nouveau podium, et le troisième prend les nouveaux médaillés, son ancienne version restant consultable

### AS5 — Une panne ne casse rien

- **Étant donné** un jour du calendrier illisible, une finale dont la page échoue, et une exécution déjà en cours
- **Quand** l'import tourne, ou qu'on en lance une seconde en même temps
- **Alors** les autres épreuves sont importées et les données existantes restent intactes, les erreurs sont listées ; la seconde exécution est refusée (refus 409, code SCRAPE_ALREADY_RUNNING)

### AS6 — Chaque soir à 23 h de Dakar

- **Étant donné** l'import activé, réglé sur 23:00 à Dakar, pendant les Jeux
- **Quand** l'heure passe à 23:00 puis dans la minute suivante, ou que le serveur démarre après plus de 24 h sans import réussi
- **Alors** une seule exécution part à 23:00, une exécution de rattrapage part au démarrage ; jamais avant l'ouverture des Jeux ni après le lendemain de la clôture, et jamais si l'import est désactivé (c'est le cas par défaut)

### AS7 — Un compte rendu lisible

- **Étant donné** une exécution terminée, lancée à la demande ou par l'horloge
- **Quand** on consulte l'état de l'import
- **Alors** on voit son heure et son résultat (importées, mises à jour, identiques, écarts, absentes de la source, erreurs), les finales vues sur la source contre importées, et la liste des ignorées avec leur raison

### AS8 — Le second bronze et chaque pays se lisent à l'écran

- **Étant donné** un podium de judo à deux bronzes dont un du Sénégal, et des podiums importés avec l'Azerbaïdjan, le Congo (RDC), Hong Kong, l'Iran, l'Ukraine et le Vietnam
- **Quand** le supporter ouvre les résultats du jour, puis choisit « Mon pays »
- **Alors** la carte du podium montre les deux bronzes, et chacun de ces pays porte son nom français partout où un pays est nommé

## Hors périmètre

- Écran « dernière mise à jour », égalités à l'or dans le tableau. Limite connue : les noms d'épreuves restent en anglais, comme sur le site officiel.

## Questions ouvertes

- Un podium saisi à la main n'est jamais écrasé, même sans correction : le doute profite au journaliste ; une égalité à l'or est ignorée tant que le podium ne sait porter qu'un seul or.
