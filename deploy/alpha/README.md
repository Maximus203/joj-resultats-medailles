# Déploiement

- Front : Vercel, projet `joj-resultats-medailles` → https://joj-resultats-medailles.vercel.app
- API : conteneurs sur alpha, derrière le Traefik partagé → https://api-joj.artist-dev.com

Le front appelle `/api/...` ; `apps/web/vercel.json` réécrit ces appels vers l'API (pas de CORS).

## Déploiement continu (rien à faire)

Un push sur `main` suffit :

- **Front** : Vercel est relié au dépôt et reconstruit `apps/web` à chaque push sur `main`.
- **API** : `joj-api-watch.timer` sur alpha lance `/opt/joj-api/watch.sh` toutes les 5 minutes. Si
  `origin/main` a avancé : build de l'image, migrations, redémarrage, contrôle de santé public,
  notification Telegram (succès ou échec). Un commit en échec n'est pas retenté : pousser un correctif.
  Le même passage alerte quand l'API tombe et quand elle revient.

Suivre : `journalctl -u joj-api-watch -n 50` sur alpha ; dernier commit déployé dans
`/opt/joj-api/state/deployed`.

## Déploiement manuel

```bash
bash deploy/alpha/deploy.sh            # API : HEAD
bash deploy/alpha/deploy.sh <ref>      # API : un autre commit ou tag
bash deploy/alpha/deploy.sh --worktree # API : l'arbre de travail (tests uniquement)
bash deploy/vercel/deploy.sh           # front : build local publié en production
```

## Sur alpha (`/opt/joj-api`)

- Conteneurs : `joj-postgres` (volume `joj-api_postgres-data`, aucun port publié), `joj-migrate`
  (migrations seules ; le seed de démonstration n'est jamais joué en production), `joj-api`.
- `.env` (600, root) : mot de passe Postgres, `API_HOST`, identifiants d'écriture.
- Accès : lecture (`GET`) publique ; écritures et Swagger (`/api/docs`) derrière une authentification
  basique Traefik, utilisateur `WRITE_USER`, mot de passe `WRITE_PASSWORD` du `.env`, en attendant
  l'authentification applicative.
- Import automatique des résultats officiels (heure de Dakar, UTC+0), du 1er au 14 novembre : un
  import léger toutes les 15 minutes de 08:00 à 23:00 (calendriers d'hier et d'aujourd'hui, pages
  des médaillés des seules finales nouvelles), un import complet à 07:00 et 23:00 (tous les jours,
  confrontation à la base), et un import complet au démarrage si le dernier succès a plus de 24 h.
  Réglages facultatifs dans le `.env`, aucune valeur sensible : `SCRAPING_ENABLED` (défaut `true` ici),
  `SCRAPING_TIMEZONE` (`Africa/Dakar`), `SCRAPING_FULL_TIMES` (`07:00,23:00`),
  `SCRAPING_WINDOW_START` (`08:00`), `SCRAPING_WINDOW_END` (`23:00`), `SCRAPING_INTERVAL_MINUTES`
  (`15`), `SCRAPING_STALE_AFTER_MINUTES` (`120`). Suivi :
  `curl https://api-joj.artist-dev.com/api/scraping` : `lastSuccessAt`, `stale` (vrai si, dans la
  fenêtre, aucun import n'a réussi depuis 2 h ; avertissement `CheckStaleness` dans les logs, une
  fois par épisode, et bandeau « Données à jour à HH:MM » sur le site), `lastFullRun` (écarts,
  finales ignorées avec leur raison) et les dernières exécutions (genre, durée, sautées).
  Lancement d'un import complet à la demande, derrière l'authentification basique :
  `curl -u "$WRITE_USER:$WRITE_PASSWORD" -X POST https://api-joj.artist-dev.com/api/scraping/runs`
  (202, puis relire l'état ; 409 si une exécution tourne). Logs : `docker logs joj-api | grep -E "RunScrape|CheckStaleness"`.
- Sauvegarde : `joj-api-backup.timer`, chaque nuit à 03h45 UTC, `pg_dump` relu puis gardé 14 jours
  dans `backups/`. Échec → alerte Telegram. Restauration :
  `docker exec -i joj-postgres pg_restore -U joj -d joj --clean --if-exists < backups/<fichier>.dump`
- Retour arrière : `IMAGE_TAG=<sha7> docker compose --env-file .env up -d api` (5 images gardées).
- Unités systemd : `deploy/alpha/systemd/`, copiées dans `/etc/systemd/system/`.
- Domaine : enregistrement A `api-joj.artist-dev.com` → [ip-serveur-retirée] (cPanel o2switch).
