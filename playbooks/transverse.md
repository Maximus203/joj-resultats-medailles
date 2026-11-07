# Session « utilisateur imprévisible »

> Statut : ⬜ · Build : — · Testé : —

À jouer sur **chaque écran** livré, par le testeur, en plus du playbook de la tranche. Ce n'est pas un playbook de couverture de spec (pas d'identifiant `ASn`) : c'est une liste de gestes à tenter, dont on note **ce qui a réellement été exécuté**. L'intensité suit le risque : un écran de saisie (journaliste) reçoit tout ; un écran de lecture (supporter) reçoit les lignes marquées 📖.

Verdict par ligne : ✅ tenu · 🟡 défaut d'ergonomie · ❌ cassé (erreur, perte de données, double effet) · ⏭️ sans objet. Capture et note dans **Observé** pour tout sauf ✅ évident.

## Gestes

| #   | Geste                                                                                                     | Profil                 | Observé | Verdict |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------- | ------- | ------- |
| T1  | Double-clic et clics frénétiques sur le bouton d'envoi : un seul enregistrement                           | journaliste            |         | ⬜      |
| T2  | Rafraîchir en pleine saisie, puis pendant l'envoi : pas de doublon, message compréhensible                | journaliste            |         | ⬜      |
| T3  | Retour arrière du navigateur en plein parcours, puis avancer : état cohérent 📖                           | journaliste, supporter |         | ⬜      |
| T4  | Deux onglets sur le même parcours : second enregistrement refusé proprement                               | journaliste            |         | ⬜      |
| T5  | Accès direct par URL à chaque route, y compris une route inconnue : page lisible, pas d'écran blanc 📖    | journaliste, supporter |         | ⬜      |
| T6  | Champs vides, espaces seuls, texte de 10 000 caractères, emojis, arabe (droite à gauche)                  | journaliste            |         | ⬜      |
| T7  | Copier-coller avec espaces avant/après et casse mélangée (` lutte FILLES 52 kg`)                          | journaliste            |         | ⬜      |
| T8  | Codes pays : minuscules, 2 ou 4 lettres, chiffres, accents (`sén`)                                        | journaliste            |         | ⬜      |
| T9  | Jour invalide : `31/02/2026`, `2026-13-01`, vide, très lointain                                           | journaliste            |         | ⬜      |
| T10 | Réseau lent (3G) puis coupé en plein envoi : retour d'erreur clair, saisie conservée, relance possible 📖 | journaliste, supporter |         | ⬜      |
| T11 | API arrêtée (`503` / connexion refusée) : message en français, pas de spinner infini 📖                   | journaliste, supporter |         | ⬜      |
| T12 | Viewport 375 px puis 320 px : rien ne déborde, aucun défilement horizontal, cibles tactiles ≥ 44 px 📖    | journaliste, supporter |         | ⬜      |
| T13 | Zoom navigateur à 200 % et rotation paysage : texte lisible, actions atteignables 📖                      | journaliste, supporter |         | ⬜      |
| T14 | Clavier seul (Tab, Maj+Tab, Entrée, Échap) : ordre logique, focus visible, formulaire envoyable 📖        | journaliste, supporter |         | ⬜      |
| T15 | Console : aucune erreur ni avertissement pendant tous les gestes ci-dessus 📖                             | tous                   |         | ⬜      |
| T16 | Supporter ouvre par URL l'écran de saisie du journaliste : constater et décrire (risque connu du PRD)     | supporter              |         | ⬜      |
