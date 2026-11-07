# 000 — Disciplines

**Statut** : Implémentée

## Contexte

Le module d'exemple du dépôt, écrit avant les ateliers : il n'a pas de PRD. Le comité d'organisation tient la liste des disciplines sportives des Jeux, chacune rangée dans une catégorie, pour y rattacher ensuite créneaux, épreuves et résultats.

## User stories

- En tant que membre du comité d'organisation, je veux ajouter une discipline avec sa catégorie, afin de constituer le programme sportif.
- En tant que membre du comité, je veux consulter, corriger et retirer une discipline, afin que la liste reste juste.

## Scénarios d'acceptation

### AS1 — Ajouter une discipline

- **Étant donné** qu'aucune discipline ne s'appelle « Lutte » · **Quand** le membre ajoute « Lutte » (espaces autour compris) en sports de combat · **Alors** elle est enregistrée sous le nom « Lutte » et apparaît dans la liste.

### AS2 — Nom vide ou trop long

- **Étant donné** un nom vide, fait d'espaces ou de plus de 100 caractères · **Quand** le membre l'ajoute · **Alors** c'est refusé, le formulaire dit pourquoi, et rien n'est enregistré.

### AS3 — Catégorie hors de la liste

- **Étant donné** une catégorie autre que les cinq de la liste · **Quand** le membre ajoute la discipline · **Alors** c'est refusé, et rien n'est enregistré.

### AS4 — Nom déjà pris

- **Étant donné** qu'une discipline « Lutte » existe · **Quand** le membre en ajoute une autre du même nom · **Alors** c'est refusé avec un message de conflit, et il n'y a toujours qu'une « Lutte ».

### AS5 — Consulter la liste

- **Étant donné** des disciplines enregistrées · **Quand** le membre ouvre la liste · **Alors** il les voit triées par nom avec leur catégorie ; une liste vide le dit, et une liste impossible à charger affiche une erreur.

### AS6 — Consulter une discipline

- **Étant donné** une discipline · **Quand** le membre ouvre sa fiche · **Alors** il voit son nom, sa catégorie et sa date de création.

### AS7 — Renommer ou changer de catégorie

- **Étant donné** une discipline · **Quand** le membre change son nom, sa catégorie ou les deux · **Alors** seuls les champs changés sont modifiés ; s'il annule, rien ne change.

### AS8 — Modification invalide

- **Étant donné** un nom vide, une catégorie hors de la liste, ou aucun champ à changer · **Quand** le membre enregistre · **Alors** c'est refusé, et la discipline reste inchangée.

### AS9 — Renommer avec un nom déjà pris

- **Étant donné** « Lutte » et « Judo » · **Quand** le membre renomme « Judo » en « Lutte » · **Alors** c'est refusé avec un message de conflit ; renommer « Lutte » en « Lutte » reste accepté.

### AS10 — Supprimer une discipline

- **Étant donné** une discipline · **Quand** le membre confirme sa suppression, nommée dans la demande de confirmation · **Alors** elle disparaît de la liste ; s'il annule, elle reste.

### AS11 — Discipline introuvable

- **Étant donné** une discipline qui n'existe pas, ou supprimée entre-temps par quelqu'un d'autre · **Quand** le membre l'ouvre, la modifie ou la supprime · **Alors** l'application dit qu'elle est introuvable.

## Hors périmètre

- Les comptes et les droits : tout le monde peut tout faire.
- L'historique des modifications, et l'ajout d'une sixième catégorie depuis l'écran.

## Questions ouvertes

- Aucune : le module est livré, ses tests font foi.
