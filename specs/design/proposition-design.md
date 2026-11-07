# Proposition de design : direction « Cachet », aux couleurs des JOJ Dakar 2026

**Statut** : Proposition, à valider par Cherif avant toute implémentation.
**Référence produit** : `specs/prd-resultats-medailles.md` (Validé) et `specs/001-podium/spec.md` (Validée). Le PRD fait foi : rien ici ne le contredit. Ce qui demanderait de le changer est listé dans `impacts.md`, section C, comme écart à arbitrer.
**Identité** : alignée sur le site officiel des Jeux, https://www.olympics.com/en/dakar-2026 (couleurs relevées ; emblème et motifs repris dans les maquettes locales seulement, voir `maquettes/assets/SOURCES.md`).
**Maquettes** : `specs/design/maquettes/00-accueil.html` (page d'accueil ; le sommaire de relecture est `maquettes/guide-de-revue.html`, voir §14). Captures à 375 px : `specs/design/captures/`. Version en un seul fichier : `specs/design/artefact-design.html`.
**Toutes les données des maquettes sont fictives.** Seuls les exemples de la spec 001 (Lutte filles 52 kg, SEN, JPN, FRA) sont repris tels quels.

---

## 1. Décision en une ligne

Choix : **Cachet**, habillée de l'identité Dakar 2026 relevée sur le site officiel (rouge, orange, jaune, motifs, noir et blanc), parce qu'elle donne au produit le sentiment que le PRD réclame, « un podium publié est un acte vérifié, et sa correction laisse une trace », tout en étant reconnue comme un compagnon des JOJ ; alternative non retenue : **Dépêche**, plus sèche, mieux adaptée à une salle de rédaction qu'à un supporter sur mobile.

Deux limites posées d'emblée : l'application s'annonce « non officielle » dans son en-tête ; et l'emblème, les motifs et la mascotte du site officiel sont protégés (risque de droits : voir §10 et `SOURCES.md`).

## 2. Ce que j'ai lu avant de concevoir

- Le PRD en entier, la constitution, la spec 001, le README, `task/ATELIER-C.md`.
- Le front de la branche `main` (lecture seule) : `styles.css` (variables shadcn en gris neutre), `__root.tsx` (colonne `max-w-3xl`, navigation par liens), pages `disciplines` (chargement et erreur en simples paragraphes), `mocks/control.ts` (latence et pannes simulées), `components.json` (style new-york, icônes lucide).
- Le registre des directions artistiques du coffre : aucune note pour un projet sportif ou de résultats. Interdits de reprise, car déjà utilisés ailleurs : Fraunces, Hanken Grotesk, Instrument Serif, Atkinson Hyperlegible, Newsreader, Cabinet Grotesk, Switzer, Bricolage Grotesque, Onest, Young Serif, Mona Sans, Sora, Plus Jakarta Sans, Geist, Poppins, Schibsted Grotesk, Spline Sans Mono, Martian Mono.
- Rappel d'expérience : 50 entrées dans le coffre, toutes au statut `Brute` ; aucune n'est `Analysée` ou `Intégrée`, donc aucune n'est retenue comme règle. Trois d'entre elles ont servi de vigilance au stress test (état vide distinct du filtre sans résultat, mesure de débordement, cibles tactiles). Le serveur MCP du coffre était injoignable ; le registre a été lu par `vault_cli.py`.

## 3. Benchmark (pages réellement ouvertes)

| #   | Référence                                                                               | URL ouverte                                                             | Ce que j'en retiens                                                                                                                                      | Statut                                                                                    |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Dribbble, étiquette Olympics (série « Olympic keepsakes », MUTI)                        | https://dribbble.com/tags/olympics                                      | La planche de timbres : cadre perforé, aplats nets, chaque sujet est un objet officiel qu'on collectionne.                                               | Inspiration : la perforation devient le contour de la carte podium. Aucun motif repris.   |
| 2   | Awwwards, catégorie sport, puis FieldRank                                               | https://www.awwwards.com/websites/sport/ puis https://www.fieldrank.run | Carte « dernier résultat » avec vainqueurs en tête et phrase de provenance (« chaque rang renvoie aux arrivées »), chiffres tabulaires, peu d'ornements. | Adaptation : la provenance devient la liste des épreuves du résumé IA et l'historique.    |
| 3   | Olympics.com, médailles de Paris 2024                                                   | https://www.olympics.com/en/olympic-games/paris-2024/medals             | Colonnes G, S, B, total, tri par or ; vidéos et bannière de cookies avant le tableau ; titres en condensée majuscule.                                    | Adaptation : même ordre Or, Argent, Bronze, mais le tableau est le premier contenu.       |
| 4   | **Site officiel Dakar 2026**, page Schedule & Results, onglet Medal Tally, vue à 375 px | https://www.olympics.com/en/dakar-2026/schedule-results#/en/MedalTally  | Voir les constats ci-dessous.                                                                                                                            | Adaptation de la structure et des couleurs, jamais de copie de code ni de visuel protégé. |

Limites honnêtes : la page Dribbble a été lue en liste de vignettes, pas shot par shot ; ESPN a répondu 404 ; l'application de résultats intégrée au site officiel (domaine `webresult.apps.dakar2026.org`) refuse l'accès direct (403) et n'a été vue que dans la page officielle.

**Constats relevés sur le site officiel (7 novembre 2026), à lire avant les écarts** :

1. Le site publie un **« Medal Tally »** : Rang, pays (code et drapeau), G, S, B, Total, Rang par total ; les cases à zéro sont laissées vides ; les ex æquo gardent le même rang puis le suivant saute (1, 2, 3, 4, 5, 5, 7). Il annonce « After 58 of 151 events ». Deux conséquences : le PRD suppose « pas de classement officiel des médailles aux JOJ » (C-1) ; et il laisse ouvert « 151 ou 153 épreuves », que le site officiel tranche à 151 (C-2).
2. Les onglets du site sont **Medal Tally, Medallists by Date, Multi Medallists**, avec un filtre « All Sports » : la même structure que le PRD (tableau, résultats par jour, par discipline).
3. Identité : bandeau d'en-tête avec le motif décoratif (rouge sur l'accueil, orange et jaune sur les pages de résultats), carte blanche portant l'emblème, boutons noirs en pilule, titres en condensée majuscule. Polices propriétaires (olympicHeadlineCondensed, olympicSans) : non utilisables, remplacées par une condensée libre proche (§7).
4. Couleurs relevées (détail §7) : motifs #981030, tags « Live » #C31B2E et #F0282D, dégradé #FFFAD5, #FFE72E, #FFB114, #FE5400, ardoise #27455C, neutres #121212, #F4F6F6, #DEE0E0 ; médailles échantillonnées sur la capture : or #E2B347, argent #C4C4C4, bronze #C3876F.

## 4. Concept, puis deux directions

**Concept** (trouvé avant le style) : le PRD tourne autour de la confiance. « Une erreur de podium publiée se corrige mal », « les corrections laissent une trace ». Un résultat officiel est un acte : on le tamponne, et une correction se voit. D'où l'objet central : le **cachet**. Une carte podium est un timbre perforé, un podium corrigé porte un tampon « Corrigé » daté, et l'ancienne version reste barrée mais lisible.

### Direction A : « Cachet » (recommandée)

- **Mise en page** : flux vertical, une action par écran, barre d'onglets basse. En-tête en bandeau de marque : motif en fond, carte blanche avec le mot-symbole ou l'emblème, titre de page en condensée majuscule. La couleur du bandeau dit le contexte : rouge pour les résultats du jour, orange et jaune pour les médailles, ardoise pour l'espace journaliste (outil, pas vitrine). Cartes podium en timbre.
- **Polices** : titres, chiffres de rang et codes pays en **Sofia Sans Extra Condensed** (800) ; texte en **Be Vietnam Pro**. Deux familles, licence SIL OFL, auto-hébergées.
- **Icônes** : jeu « Cachet » dessiné pour le projet (trait 2 px, bouts carrés). Aucun paquet du commerce.
- **Palette** : celle des JOJ Dakar 2026 (§7), neutres du site officiel, boutons noirs, médailles retenues après validation (§7).
- **Images** : dessins au trait pour les états vides ; ressources officielles uniquement dans les maquettes locales (§10).
- **Garde-fou** : chaque ornement porte une information (perforation = carte de l'application, tampon = correction).

### Direction B : « Dépêche »

- **Mise en page** : liste dense façon fil d'agence, une ligne par podium, heure en marge. Polices IBM Plex Sans Condensed et IBM Plex Mono. Palette blanc, noir, orange signal. Photographies de presse.
- **Pourquoi pas** : forte pour le journaliste, froide pour le supporter, et le PRD ne donne pas d'heure par podium, qui est son moteur principal.

**Recommandation** : A.

## 5. Corrélation stricte avec le PRD

### Ce que le PRD met en avant, dans l'ordre, et son écran

| Rang   | Ce que dit le PRD                                                                                                             | Écran ou composant qui le porte                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 0      | Le public veut savoir **qui a gagné aujourd'hui** et où en est son pays : l'entrée du site les met en premier                 | E0 Accueil : héros, tuiles de disciplines, bande du jour, tableau compact        |
| 1      | Le journaliste enregistre le podium d'une épreuve (nom, discipline, jour ; or, argent, bronze, chaque médaillé étant un pays) | E1 Enregistrer un podium, `PodiumPreview`, trois champs pays identiques          |
| 2      | Le public veut savoir **où en est son pays** ; tableau des médailles trié par or, argent, bronze, ex æquo au même rang        | E2 Tableau des médailles, `MedalTable` ; carte « Mon pays » en tête de l'accueil |
| 3      | Le public veut savoir **qui a gagné aujourd'hui** ; tous les podiums d'un jour **regroupés par discipline**                   | E3 Résultats d'un jour : bande de jours, filtre et sections par discipline       |
| 4      | Corriger un podium, ancienne version consultable avec sa date                                                                 | E4 Corriger, `CorrectionStamp`, `HistorySheet`                                   |
| 5      | Résumé IA avec la liste des épreuves sur lesquelles il s'appuie ; pas de résumé un jour sans résultat                         | `AiSummaryCard`, état jour vide                                                  |
| Règles | Un seul podium par épreuve ; trois pays différents                                                                            | Refus conflit et règle métier (E1, E4)                                           |

### Structure de navigation issue du PRD (et non d'un décor)

- Onglets publics : **Accueil** (le premier regard : « qui a gagné aujourd'hui », les disciplines, le jour, les médailles), puis **Résultats** (le jour en cours, regroupé par discipline), puis **Médailles** (le tableau). L'ordre suit la phrase du problème : « qui a gagné aujourd'hui » avant « où en est son pays ».
- Les disciplines structurent l'écran Résultats : puces de filtre en tête (Toutes, Lutte, Natation, ...) puis une section par discipline.
- Les journées structurent l'écran Résultats : bande des 14 jours du PRD (31 octobre au 13 novembre).
- L'accueil porte la carte « Mon pays » : rang et or, argent, bronze de son pays, un appui ouvre le tableau.
- Espace journaliste : lien discret dans l'en-tête et troisième onglet une fois dedans (saisie et correction).
- Si le parti pris artistique tire ailleurs (par exemple un grand visuel d'accueil), le PRD gagne : aucun visuel n'est placé avant les résultats.

### Correspondances complémentaires

| PRD                                                                               | Traduction dans le design                                                                                                         |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Journaliste : publier vite sans se tromper à 18 h                                 | Aperçu en direct du podium tel que le public le lira ; refus qui nomment le pays en cause ; aucun écran de confirmation en plus.  |
| Supporter, depuis Thiès                                                           | Pages légères, états hors ligne soignés, valeurs gardées sur l'appareil.                                                          |
| L'application refuse les podiums incohérents                                      | Deux refus distincts : conflit, règle métier.                                                                                     |
| Les corrections laissent une trace                                                | Tampon « Corrigé » daté ; historique avec version remplacée barrée.                                                               |
| Le résumé ne choisit jamais un médaillé                                           | Carte étiquetée « rédigé par un assistant IA » ; aucun champ de saisie de médaillé.                                               |
| Mesure du succès (démo)                                                           | Les quatre critères ont chacun un écran et un état (§6).                                                                          |
| Hors périmètre : scores, chronos, qualifications, comptes, billetterie, programme | Absents des maquettes. Le lien de billetterie du site officiel n'est pas repris.                                                  |
| Hypothèse : tableau informatif                                                    | Pied du tableau : « calculé à partir des podiums enregistrés dans cette application, peut différer du tableau du site officiel ». |
| Risque : équipes mixtes non comptées                                              | Même pied de page, à valider (C-4).                                                                                               |
| Risque : saisie ouverte à tous                                                    | Lien discret, aucun écran ne prétend à une protection (C-5).                                                                      |

## 6. Parcours écran par écran (375 px d'abord)

### E1. Enregistrer un podium (TR1) : `maquettes/01-saisie-podium.html`

Utilisateur : journaliste. Spec 001 : AS1, AS2, AS3. Attention : la spec 001 place « l'écran » hors périmètre (C-13).

1. Bandeau ardoise, titre « Enregistrer un podium », rappel des deux règles.
2. Champs : Épreuve (100 caractères max), Discipline (texte avec suggestions), Jour (date ; l'aide rappelle les dates des Jeux sans bloquer, voir C-6).
3. Bloc Podium : trois lignes identiques, pastille + mot + code pays de trois lettres (majuscules forcées, 24 px, centré).
4. Aperçu en direct (carte timbre).
5. Bouton unique noir « Enregistrer le podium ».

| État              | Comportement                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Vide              | Champs vides, bouton actif (la validation se fait à l'envoi, le serveur reste l'autorité).                                                |
| Invalide          | Résumé « 2 champs à corriger », champs marqués par couleur, bordure épaisse et texte.                                                     |
| Règle métier, AS3 | « Un pays ne peut pas figurer deux fois. SEN apparaît en or et en argent. Aucun podium n'a été enregistré. » ; les deux champs surlignés. |
| Conflit, AS2      | « Cette épreuve a déjà un podium. Le podium enregistré n'a pas changé. » ; lien vers le podium existant.                                  |
| Envoi             | Bouton désactivé « Enregistrement en cours… », `aria-busy`.                                                                               |
| Succès, AS1       | Bandeau, puis carte du podium relu (épreuve, discipline, jour, trois médaillés), deux actions.                                            |
| Hors ligne        | Barre noire en tête, bouton désactivé, saisie conservée, aucune file d'attente.                                                           |

### E2. Tableau des médailles (TR2) : `maquettes/02-tableau-medailles.html`

1. Bandeau orange et jaune, titre, phrase de tri, heure de mise à jour.
2. « Mon pays » : sélecteur (valeur gardée sur l'appareil, aucun compte).
3. Tableau : rang, pays (plaque de trois lettres, nom en petit), Or, Argent, Bronze ; en-tête collant ; colonne Or teintée (clé de tri) ; valeurs nulles atténuées mais écrites « 0 ».
4. Ex æquo : même rang, étiquette « ex æquo », le rang suivant saute (5, 5, 7), comme sur le site officiel (C-3).
5. Pas de colonne Total : le PRD ne la demande pas (le site officiel en a une : C-9).

États : normal, mise à jour (la ligne qui change clignote une fois), chargement, vide, erreur, hors ligne, sombre.

### E3. Résultats d'une journée (TR3, avec TR4 et TR5) : `maquettes/03-resultats-jour.html`

1. Bandeau rouge, titre du jour, bande de 14 jours (point plein = au moins un podium).
2. Carte « Mon pays » (rang et trois totaux).
3. Carte résumé IA (TR5) : étiquette « Résumé rédigé par un assistant IA », texte, « N épreuves prises en compte » dépliable.
4. Puces de discipline puis sections par discipline (TR3), cartes podium.
5. Carte corrigée (TR4) : tampon « Corrigé 5 nov. » ; un appui ouvre la feuille d'historique.

États : jour, correction, résumé indisponible (les résultats restent affichés), jour vide (« Aucun podium enregistré ce jour », pas de carte résumé), chargement, erreur, hors ligne.

### E4. Corriger un podium (TR4) : `maquettes/04-correction-podium.html`

1. Avertissement : le podium est déjà public ; l'ancienne version reste consultable avec sa date.
2. Épreuve, discipline et jour figés (à confirmer, C-7) ; seuls les trois pays changent.
3. Champs modifiés en ambre avec « Était : FRA » ; bouton désactivé tant qu'il n'y a aucun changement.
4. Règle des trois pays différents identique à E1.
5. Succès : « Correction publiée », carte avec tampon, lien « Voir l'historique ».

## 7. Design system : jetons

Tout est dans `maquettes/cachet.css` (variables CSS) et se branche sur le thème shadcn existant (§13).

### Palette officielle relevée, contrôlée, et variante proposée

Source : https://www.olympics.com/en/dakar-2026 et la page de résultats (variables CSS et couleurs calculées lues dans le navigateur intégré le 7 novembre 2026 ; médailles par échantillonnage de la capture). Contrastes calculés sur blanc, sur le papier #F4F6F6 et sur le noir #121212.

| Couleur officielle         | Hex relevé                       | Origine                          | Texte sur blanc       | Verdict et variante                                                                                                                      |
| -------------------------- | -------------------------------- | -------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Rouge du motif             | #981030                          | Fichier du motif, texte de pages | 8,6                   | Passe pour le texte et les fonds.                                                                                                        |
| Rouge vif                  | #C31B2E                          | Tags « Live »                    | 6,0                   | Passe ; bandeau rouge et repère d'onglet actif.                                                                                          |
| Rouge direct               | #F0282D                          | Tags « Live » (autre variante)   | 4,2                   | **Ne passe pas** en petit texte : remplacé par #C31B2E.                                                                                  |
| Orange                     | #FE5400                          | Dégradé des pages de résultats   | 3,2                   | Décor, texte noir dessus (5,8). Jamais en texte sur blanc ; variante texte : #B13E07 (5,9).                                              |
| Jaune                      | #FFB114 (aussi #FFE72E, #FFFAD5) | Dégradé                          | 1,8                   | Décor seulement, texte noir dessus (10,3).                                                                                               |
| Vert de l'emblème          | #00A651                          | Emblème                          | 3,2                   | **Ne passe pas** en texte : décor. Variante « ok » : #01724A.                                                                            |
| Bleu de l'emblème          | #007DC5                          | Emblème                          | 4,4                   | **Ne passe pas** de peu : variante #015BB3 (6,7), retenue pour l'anneau de focus.                                                        |
| Ardoise                    | #27455C                          | Fonds de pastilles du site       | 10,0                  | Passe ; espace journaliste et information.                                                                                               |
| Noir                       | #121212                          | Texte et boutons                 | 18,9                  | Passe ; boutons principaux (pilule noire, comme le site).                                                                                |
| Gris 500                   | #535454                          | Gris du site                     | 7,0 sur papier        | Texte secondaire.                                                                                                                        |
| Gris 400                   | #767777                          | Gris du site                     | 4,1 sur papier        | Bordures de champs (3:1 requis) ; pas pour du texte ; variante texte discret #6B6C6C.                                                    |
| Papier                     | #F4F6F6                          | Fond de page du site             | base                  | Fond de page.                                                                                                                            |
| Ligne paire                | #E2F0F1                          | Lignes du tableau du site        | noir 16,0             | Fond doux, survol, lignes.                                                                                                               |
| Or, argent, bronze du site | #E2B347, #C4C4C4, #C3876F        | Capture du tableau du site       | noir 9,6 / 10,7 / 6,3 | Le script de validation signale or et argent **trop proches en vision normale** (écart 13,8, plancher 15) : variante retenue ci-dessous. |

### Médailles : variante retenue

| Jeton      | Hex     | Écart avec l'officiel   | Contrôles       |
| ---------- | ------- | ----------------------- | --------------- |
| `--or`     | #C99700 | plus saturé que #E2B347 | noir dessus 6,6 |
| `--argent` | #B4BBC1 | gris légèrement bleuté  | noir dessus 8,5 |
| `--bronze` | #C47A3F | plus saturé que #C3876F | noir dessus 5,1 |

Validation (script de la compétence `dataviz`) : séparation sous daltonisme réussie (deutan 17,2, tritan 14,1) et en vision normale réussie (17,6) ; alertes assumées sur le gris de l'argent, la bande de luminosité et le contraste contre le fond (or 2,6, argent 1,9 en clair) ; **compensation obligatoire et appliquée partout : la couleur n'est jamais seule**. Chaque médaille a un chiffre 1, 2, 3, un mot (Or, Argent, Bronze, ou Or, Ar., Br. en colonnes), un contour encre de 1,5 px et une trame (or : aplat ; argent : double anneau ; bronze : hachures). Un tableau en niveaux de gris reste lisible.

### Jetons de couleur (clair)

| Jeton                                                                                                       | Hex                                                  | Rôle                                        |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `--papier`                                                                                                  | #F4F6F6                                              | Fond de page                                |
| `--carte`                                                                                                   | #FFFFFF                                              | Cartes, champs                              |
| `--encre`                                                                                                   | #121212                                              | Texte, boutons                              |
| `--encre-2`                                                                                                 | #535454                                              | Texte secondaire                            |
| `--encre-3`                                                                                                 | #6B6C6C                                              | Aides discrètes, valeurs nulles             |
| `--filet`                                                                                                   | #DEE0E0                                              | Séparateurs doux                            |
| `--filet-fort`                                                                                              | #767777                                              | Bordures de champs                          |
| `--action` / `--action-sur`                                                                                 | #121212 / #FFFFFF                                    | Bouton principal (pilule noire)             |
| `--action-doux`                                                                                             | #E2F0F1                                              | Survol, signal de ligne                     |
| `--anneau`                                                                                                  | #015BB3                                              | Focus visible (6,2 sur papier)              |
| `--ok`                                                                                                      | #01724A                                              | Succès                                      |
| `--erreur`                                                                                                  | #B3261E                                              | Refus (toujours icône, bordure et message)  |
| `--alerte`                                                                                                  | #7A4F00                                              | Correction, avertissement                   |
| `--info`                                                                                                    | #27455C                                              | Information, résumé IA                      |
| `--marque-rouge-vif`                                                                                        | #C31B2E                                              | Bandeau résultats, onglet actif             |
| `--marque-rouge`, `--marque-orange`, `--marque-jaune`, `--marque-vert`, `--marque-bleu`, `--marque-ardoise` | #981030, #FE5400, #FFB114, #00A651, #007DC5, #27455C | Identité : décor, jamais seule pour du sens |

Le rouge de marque et le rouge d'erreur sont voisins : une erreur n'est jamais signalée par le rouge de marque ; elle porte toujours une icône octogonale, une bordure et un message (§9).

### Jetons de couleur (sombre, « Nuit de stade »), sélectionnés et non inversés

`--papier #121212`, `--carte #232325`, `--encre #F4F6F6`, `--encre-2 #BCBDBD`, `--action #F4F6F6` (texte de bouton #121212), `--anneau #8AC1E9`, `--ok #7FE4B1`, `--erreur #FF8A80`, `--alerte #FFB114`, `--info #8AC1E9`, `--or #E0B22E`, `--argent #B4BBC1`, `--bronze #D98A4A`. Capture : `02-medailles-normal-sombre.png`. Les bandeaux de marque restent identiques en sombre.

### Typographie

| Usage                                         | Famille                    | Poids     | Taille mobile                                   |
| --------------------------------------------- | -------------------------- | --------- | ----------------------------------------------- |
| Titres, noms de discipline, rangs, codes pays | Sofia Sans Extra Condensed | 800       | h1 32 px, h2 24 px, rang 28 px, code 20 à 24 px |
| Texte, étiquettes, tableaux                   | Be Vietnam Pro             | 400 à 700 | corps 16 px, secondaire 14 px, minimum 13 px    |

Les polices du site officiel sont propriétaires et non utilisées ; Sofia Sans Extra Condensed en reprend l'esprit (condensée majuscule) sous licence SIL OFL. Chiffres tabulaires partout. Champs à 16 px minimum. Interligne 1,5 ; 62 caractères maximum pour le résumé IA. Polices auto-hébergées (woff2, latin et latin étendu), `font-display: swap`, repli `Arial Narrow` puis `system-ui`. **En maquette elles viennent de Google Fonts : à retirer en production.**

### Icônes

Jeu « Cachet » dessiné pour le projet : logo, médailles, jour, saisie, alerte, erreur, ok, info, hors ligne, historique, assistant IA, flèche, ardoise (état vide). Source : `maquettes/maquette.js`. Aucun drapeau (pas de liste de pays dans le périmètre, émojis drapeaux absents sous Windows) : la plaque de trois lettres en tient lieu. Les pictogrammes de sport du site officiel (protégés) ne sont pas repris.

### Espacements, rayons, ombres

Échelle de 4 px : 4, 8, 12, 16, 24, 32. Gouttière 16 px. Cible tactile 44 px minimum, 48 px pour boutons et champs. Rayons : 6 (étiquettes, carte de marque), 10 (champs, cartes), 14 (feuille), pilule pour boutons du bandeau et puces. Ombres discrètes : `--ombre-carte`, `--ombre-feuille`.

### Mouvement

| Jeton        | Valeur                         | Usage                                |
| ------------ | ------------------------------ | ------------------------------------ |
| `--ease`     | cubic-bezier(0.2, 0.7, 0.2, 1) | Sortie rapide ; jamais d'ease-in     |
| `--d-appui`  | 80 ms                          | Retour immédiat à l'appui            |
| `--d-rapide` | 140 ms                         | Fond au survol                       |
| `--d-base`   | 220 ms                         | Ouverture de la feuille d'historique |
| `--d-signal` | 1200 ms                        | Ligne qui vient de changer           |

| Animation                                  | Pourquoi                              | Fréquence                   | Décision                      |
| ------------------------------------------ | ------------------------------------- | --------------------------- | ----------------------------- |
| Appui sur bouton                           | Confirmer le toucher                  | Très fréquente              | 80 ms, transform seulement    |
| Ligne du tableau qui change                | Montrer ce qui a bougé sans recharger | Rare                        | Clignotement de fond une fois |
| Feuille d'historique                       | Orienter                              | Rare                        | 220 ms                        |
| Squelette                                  | Dire « ça charge »                    | Seulement au-delà de 300 ms | Pulsation d'opacité lente     |
| Changement d'onglet, de jour, de puce, tri | Actions répétées                      | Très fréquentes             | **Aucune animation**          |

`prefers-reduced-motion` supprime tout. Le motif du bandeau est statique.

### Règle globale

`button, [role='button'], a, label[for], summary, select { cursor: pointer; }` une fois dans la feuille de base, avec `hover` (gardé par `@media (hover: hover)`), `focus-visible` (anneau bleu #015BB3 3 px), `active`, `disabled`.

### États de l'interface

| État                 | Règle                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Chargement           | Squelettes à la forme du contenu, `role="status"`, zéro saut de mise en page.                                          |
| Vide                 | Illustration au trait, titre, une phrase, une action. « Aucune donnée » distinct de « aucun résultat pour ce filtre ». |
| Erreur de chargement | Bandeau `role="alert"`, cause en français courant, « Réessayer ». Jamais un code brut.                                 |
| Erreur de saisie     | Résumé en haut, message sous le champ, couleur + bordure 2 px + texte.                                                 |
| Hors ligne           | Barre noire en tête, dernière version avec son heure, écriture désactivée.                                             |
| Succès               | Bandeau avec icône, `role="status"`, et la donnée relue.                                                               |

## 8. Composants clés

| Composant                                             | Rôle                                                                                       | Maquette                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `BrandBand`                                           | Bandeau de marque : motif, carte blanche, emblème ou mot-symbole, titre ; trois variantes. | `.bandeau-marque`                                |
| `MedalPill`                                           | Pastille 1, 2, 3 avec trame et contour.                                                    | `.med`                                           |
| `CountryPlate`                                        | Plaque de trois lettres.                                                                   | `.plaque`                                        |
| `PodiumCard` / `PodiumPreview`                        | Carte timbre : épreuve, trois lignes, tampon de correction ; version en direct.            | `.timbre`                                        |
| `MedalTable`                                          | `<table>` sémantique, en-tête collant, rang, colonne Or teintée.                           | `.tableau`                                       |
| `MyCountryCard`                                       | Rang et trois totaux du pays suivi.                                                        | `.mon-pays-carte`                                |
| `DayStrip`                                            | Bande de 14 jours avec indicateur.                                                         | `.jours`                                         |
| `DisciplineFilter`, `DisciplineSection`               | Puces et sections par discipline.                                                          | `.puce`, `.discipline`                           |
| `CorrectionStamp` + `HistorySheet`                    | Tampon et feuille d'historique.                                                            | `.cachet-corrige`, `.feuille`                    |
| `AiSummaryCard`                                       | Résumé, étiquette IA, sources dépliables.                                                  | `.resume`                                        |
| `StateBanner`, `OfflineBar`, `EmptyState`, `Skeleton` | États.                                                                                     | `.bandeau`, `.hors-ligne`, `.vide`, `.squelette` |
| `Field`, `CountryCodeInput`, `Button`                 | Formulaire.                                                                                | `.champ`, `.saisie`, `.bouton`                   |

## 9. Accessibilité et performance (critères vérifiables)

Accessibilité :

1. Contrastes : texte ≥ 4,5:1, composants et bordures de champ ≥ 3:1 (tableaux du §7). Test : script de contraste sur les jetons, puis `axe` dans le `*.a11y.test.tsx` de chaque route, un audit par état.
2. Médailles : jamais la couleur seule (chiffre, mot, trame, contour). Test visuel : niveaux de gris et simulation deutéranopie et tritanopie.
3. Bandeaux de marque : titre blanc sur rouge #C31B2E (6,0), noir sur jaune #FFB114 (10,3), blanc sur ardoise (10,0). À vérifier au-dessus du motif réel (le motif ajoute du bruit) : contrôle visuel obligatoire.
4. Cibles tactiles ≥ 44 px (le tampon « Corrigé » mesure 32 px dans la maquette : à étendre par une zone cliquable ; tester la zone réelle, pas le rectangle visuel).
5. Clavier : ordre logique, focus visible, lien d'évitement, feuille d'historique avec piège de focus et retour du focus.
6. Lecteurs d'écran : `<table>` avec `caption`, `th scope`, rang annoncé « Rang 5, ex æquo » ; médailles annoncées « Or », « Argent », « Bronze » (jamais « 1 ») ; erreurs en `role="alert"`, succès et chargement en `role="status"`, `aria-live="polite"` sur l'aperçu ; l'emblème a un `alt` descriptif.
7. Langue : `lang="fr"`, français d'abord ; « ex æquo » avec ligature.
8. Zoom 200 % et texte agrandi sans défilement horizontal ; mouvement réduit respecté.
9. Messages d'erreur : quoi, pourquoi, que faire, sans code technique.

Performance (budgets proposés, à mesurer, jamais présentés comme officiels) :

1. Réseau variable : réponses courtes ; hors ligne, la dernière donnée reste affichée avec son heure (cache de requêtes, pas de service worker en V1).
2. Polices : deux familles, auto-hébergées, sous-ensemble ; budget d'environ 60 ko.
3. **Le motif officiel pèse 257 ko en SVG** : inacceptable sur mobile. En production, une version raster ou simplifiée d'au plus quelques dizaines de ko, chargée après le contenu ; si l'autorisation de droits n'est pas obtenue, motif géométrique maison.
4. L'emblème pèse 180 ko en SVG : à remplacer par une version optimisée autorisée ou par un mot-symbole texte.
5. Mouvements CSS sur `transform` et `opacity`, aucune bibliothèque d'animation.
6. Images : une au maximum par page, AVIF ou WebP, dimensions fixées, `loading="lazy"`. Pas de fonds photo floutés sur les écrans de données (C-8).
7. Tableau : une requête, ligne d'environ 56 px.
8. Mesures à rapporter à l'intégration : LCP, CLS, poids transféré de l'écran Médailles à 3G rapide simulée.

## 10. Images, logo et crédits

**Dans les maquettes locales** (validation interne seulement) : emblème (3 variantes), 2 motifs, 3 vignettes de directs avec la mascotte (sans personne identifiable), 1 capture du tableau officiel. Fichiers, URL, date et conditions : `maquettes/assets/SOURCES.md`. Aucune vidéo téléchargée (flux, copie interdite par les conditions d'usage) ; liens de référence seulement.

**Dans l'artefact publié** : ni l'emblème, ni les motifs, ni la mascotte, ni les photos. Un mot-symbole composé en Sofia Sans et un motif géométrique dessiné pour le projet les remplacent, aux couleurs relevées. Raison : publier la marque d'une organisation réelle sur un service d'hébergement est exclu, et les conditions d'utilisation d'Olympics.com interdisent la communication au public sans autorisation écrite (C-11).

**Risques de droits à signaler à Cherif avant toute diffusion publique** :

1. Emblème, motifs et mascotte : propriété du CIO et du comité d'organisation ; copier et reproduire est interdit sans autorisation écrite. Les téléchargements faits ici sont autorisés par Cherif pour la validation, pas par le titulaire.
2. Ne pas commiter ces fichiers dans un dépôt public.
3. Une application qui reprend l'identité officielle peut paraître officielle : mention « non officiel » en en-tête.

**Plan pour la production** : ou bien obtenir une autorisation écrite (CIO ou comité Dakar 2026) pour l'emblème et le motif ; ou bien livrer sans eux : couleurs seules, mot-symbole « JOJ Dakar 2026 · résultats » composé en Sofia Sans, motif géométrique dessiné pour le projet. Recommandation : seconde voie par défaut. Photos réelles éventuelles : Unsplash, avec une seule confirmation groupée de Cherif et crédit dans `CREDITS.md`, chemin cible `apps/web/public/images/`. Les avatars 3D ne s'appliquent pas : le PRD ne présente aucune personne.

## 11. Hors périmètre (volontairement)

- Scores, chronos, qualifications, programme, billetterie, comptes et droits : PRD, hors périmètre.
- Colonne Total et « rang par total » du site officiel, médaillés multiples : non demandés par le PRD (C-9).
- Drapeaux, noms de pays : pas de liste dans le périmètre (C-14).
- Direct vidéo, notifications, partage, favoris multiples, photos d'athlètes.
- Authentification : aucun écran de connexion inventé.
- Détail d'un pays (liste de ses podiums) : exige une lecture par pays que le PRD ne décrit pas (C-10).
- Site de l'épreuve (Dakar, Diamniadio, Saly) : absent du modèle du PRD, non affiché (C-20).

## 12. Stress test à passer

- Nom d'épreuve de 100 caractères : retour à la ligne sans chevaucher le tampon.
- Noms longs et accents (« Côte d'Ivoire », « Pentathlon moderne »), pas de coupure de mot au milieu.
- Tableau : 1, 10, 100 pays ; 0 or ; 99 médailles ; trois pays ex æquo ; tous ex æquo.
- Jour à 0, 1, 40 podiums ; discipline à 1 épreuve ; podium corrigé plusieurs fois.
- Code pays en minuscules, avec espace, à deux lettres ; deux épreuves de même nom à la casse près (spec 001 : même épreuve).
- Résumé IA de plus de 1 000 caractères ; 40 épreuves en sources.
- Réseau : latence 5 s, coupure pendant l'envoi, double appui (un seul envoi), retour du réseau.
- Texte à 200 %, écran 320 px, mode sombre, mouvement réduit, bandeau de marque sans motif (économie de données).

## 13. Branchement sur le front existant (sans copier)

- Jetons mappés sur les variables shadcn de `styles.css` : `--background` = papier, `--foreground` = encre, `--card` = carte, `--primary` = action (noir), `--muted-foreground` = encre-2, `--border` = filet, `--ring` = anneau, `--destructive` = erreur. Jetons ajoutés : médailles, marque, alerte, info, ok, mouvement. Les composants shadcn `button`, `card`, `input`, `label`, `native-select`, `alert-dialog` servent encore, restylés par les variables.
- Le gabarit actuel (`max-w-3xl p-6`, liens en haut) devient une coque avec bandeau de marque et barre d'onglets basse (impacts B).
- `components.json` déclare `iconLibrary: "lucide"` : à changer (C-12).
- La fausse API `apps/web/src/mocks/` doit permettre de jouer chaque état (impacts B).

## 14. Ouvrir les maquettes

Servir le dossier : dans `specs/design/maquettes`, `python -m http.server 8765`, puis `http://127.0.0.1:8765/00-accueil.html` (page d'accueil) ou `guide-de-revue.html` (sommaire de relecture, pas la page d'accueil). Barre noire en haut de chaque page pour changer d'état (ancre `#conflit`, `#vide`...) ; elle n'appartient pas à l'application. `?theme=dark` force le sombre. Polices chargées depuis Google Fonts en maquette ; sans réseau, le repli système s'applique.

Captures vérifiées à 375 px de large (échelle 2), clair sauf mention : `01-saisie-vide.png`, `01-saisie-invalide.png`, `01-saisie-regle-AS3.png`, `01-saisie-conflit-AS2.png`, `01-saisie-succes-AS1.png`, `01-saisie-horsligne.png`, `02-medailles-normal.png`, `02-medailles-normal-sombre.png`, `02-medailles-chargement.png`, `02-medailles-vide.png`, `02-medailles-erreur.png`, `03-jour.png`, `03-jour-vide.png`, `03-jour-horsligne.png`, `03-correction-TR4.png`, `04-correction-modifie.png`, `04-correction-regle.png`, `04-correction-succes.png`.

Limites connues : tampon « Corrigé » à 32 px ; pas de message sous le champ Épreuve en cas de conflit ; bascule d'état par ancre propre à la maquette ; polices Google Fonts ; motif et emblème trop lourds (§9) ; le contraste du titre au-dessus du motif réel reste à contrôler à l'intégration.

## 15. Registre des directions

Note créée dans le coffre (`statut_notion = Proposée`), type « App mobile » : polices Sofia Sans Extra Condensed et Be Vietnam Pro, icônes « Cachet » sur mesure, palette Dakar 2026 (noir #121212, papier #F4F6F6, rouge #C31B2E, orange #FE5400, jaune #FFB114, ardoise #27455C), médailles #C99700 #B4BBC1 #C47A3F. Passage à `Adoptée` après implémentation, `Abandonnée` si refusée.

## 16. Grille, points de rupture et adaptation (mobile, tablette, ordinateur)

Le design n'est plus une colonne mobile centrée dans du vide : chaque écran change de composition aux trois tailles. Les captures de contrôle sont dans `captures/r-<écran>-<largeur>.png` (375, 768, 1280 et 1440 px).

| Jeton ou règle     | Valeur                                             | Effet                                                                                                                                             |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile             | moins de 768 px                                    | Une colonne, barre d'onglets basse, gouttière 16 px, bande de jours défilante                                                                     |
| Tablette           | 768 à 1023 px                                      | Navigation en haut, gouttière 32 px, cartes podium en grille de 2, bande de 14 jours sur une ligne, formulaire à deux colonnes (champs et aperçu) |
| Ordinateur         | 1024 px et plus                                    | Deux colonnes : contenu et panneau latéral de 22 rem (Mon pays, résumé IA, réglages, aperçu), tuiles de discipline sur une ligne                  |
| Large              | 1536 px et plus                                    | Largeur de contenu portée de 80 rem à 90 rem, panneau latéral de 26 rem                                                                           |
| `--maxw`           | 80 rem (90 rem à partir de 1536 px)                | Largeur maximale du contenu ; le bandeau de marque reste pleine largeur                                                                           |
| Colonnes de cartes | auto-fill, 17 à 19 rem minimum                     | Le nombre de colonnes se déduit de la place, jamais d'une valeur fixe                                                                             |
| Navigation         | onglets bas (< 768), liens dans le bandeau (≥ 768) | Une seule navigation visible à la fois                                                                                                            |
| Panneau latéral    | sticky, en haut de la zone de contenu              | Il suit la lecture sans laisser de vide en dessous                                                                                                |

Règles contre le vide mal placé : un panneau latéral dont tous les éléments sont masqués disparaît (la colonne se replie) ; les cartes d'une même ligne ont la même hauteur ; les étiquettes de ligne s'alignent en haut du champ, pas en bas ; aucune colonne n'est plus étroite que son contenu minimal ; la barre d'onglets n'ajoute de marge basse que quand elle est visible.

Composition par écran :

| Écran      | Mobile                                           | Tablette                                                     | Ordinateur et large                                                           |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Accueil    | Pile : héros, tuiles 2 colonnes, jour, médailles | Héros en 2 colonnes, tuiles 3 colonnes, cartes en 2 colonnes | Héros en 2 colonnes, tuiles sur une ligne, résultats et médailles côte à côte |
| Résultats  | Pile, Mon pays et résumé avant les sections      | Cartes en grille de 2, bande de 14 jours sur une ligne       | Panneau latéral (Mon pays, résumé), sections en grille de 2 à 3 cartes        |
| Médailles  | Table 5 colonnes, nom sous le code               | Table large, nom à côté du code                              | Table pleine largeur, réglages et mention à droite                            |
| Saisie     | Champs, aperçu, bouton                           | Champs à gauche, aperçu à droite                             | Champs à gauche, aperçu et podiums déjà enregistrés à droite                  |
| Correction | Champs, bouton                                   | Champs à gauche, podium publié à droite                      | Champs à gauche, podium publié à droite                                       |

## 17. Page d'accueil publique (E0) et guide de revue

**Ce qu'est `maquettes/00-accueil.html`** : la page d'entrée publique de l'application, la première que voit un supporter. **Ce que n'est pas `maquettes/guide-de-revue.html`** : un sommaire pour relire le design (palette, liste des écrans, ressources). Il ne doit pas être implémenté comme page d'accueil : les développeurs implémentent E0.

Contenu de E0, dans l'ordre du PRD :

1. Bandeau de marque et navigation (Accueil, Résultats, Médailles, Espace journaliste).
2. Héros : la question « Qui a gagné aujourd'hui ? », deux appels à l'action (Résultats du jour, Tableau des médailles), trois chiffres (jours de Jeux, sports, podiums du jour), et la carte du dernier podium enregistré dessinée en marches (2, 1, 3) avec la médaille en chiffre et en mot.
3. Par discipline : tuiles colorées (une par discipline avec podium du jour, une tuile « aucun podium aujourd'hui », une tuile « toutes les disciplines »).
4. Résultats du jour : bande de jours, quatre cartes podium, lien vers les résultats du jour.
5. Médailles : tableau compact (cinq premiers et Mon pays), lien vers le tableau complet, mention d'information.
6. Bande « Vous enregistrez les podiums ? » vers l'espace journaliste ; pied de page « non officiel ».

États : normal, chargement (squelettes à la forme de chaque bloc), vide (début des Jeux, aucun podium), erreur (bandeaux par bloc avec « Réessayer »), hors ligne (barre et dernière donnée). Les chiffres « 14 jours » et « 25 sports » viennent du PRD ; « 5 podiums du jour » et l'heure du dernier podium sont fictifs et marqués d'un astérisque. Aucun chiffre de nombre d'épreuves n'est affiché (C-2).
