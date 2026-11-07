# Profils testés

Le PRD exclut les comptes et les droits d'accès : un profil n'est donc **pas** une connexion, c'est un usage, avec son point d'entrée, son appareil typique et ses attentes. Le testeur ouvre un contexte de navigateur séparé par profil.

Un identifiant ci-dessous est la seule valeur valide du champ `Profil` d'un scénario (`pnpm playbook:check` le vérifie).

## journaliste

- **Qui** : enregistre et vérifie les podiums, publie vite sans se tromper (pression de 18 h).
- **Appareil** : ordinateur de salle de presse, mais aussi téléphone en bord de terrain : 375 px d'abord.
- **Parcours** : saisie d'un podium (TR1), corrections (TR4), relecture du résumé IA (TR5).
- **Attend** : un refus clair et en français quand le podium est incohérent ; ne jamais perdre sa saisie sur une erreur ; pas de double enregistrement au double clic.

## supporter

- **Qui** : consulte les résultats du jour et le total de médailles de son pays, souvent depuis Thiès.
- **Appareil** : téléphone, réseau mobile lent ou instable : 375 px puis 320 px, réseau dégradé.
- **Parcours** : tableau des médailles (TR2), résultats d'une journée (TR3), résumé de la journée (TR5).
- **Attend** : lire sans rien saisir ; une page lisible même sans résultat ; aucun écran de saisie.
- **Risque connu du PRD** : rien ne limite la saisie aux journalistes (accepté pour la démo). Le testeur le **constate** (le supporter atteint-il l'écran de saisie par URL directe ?) et l'écrit dans Observé : un constat, pas un échec, tant que le PRD ne le lève pas.

## Ajouter un profil

Un profil naît d'une ligne du PRD (section « Utilisateurs »). Ajoute-le ici avec les mêmes quatre rubriques, puis référence-le dans les scénarios.
