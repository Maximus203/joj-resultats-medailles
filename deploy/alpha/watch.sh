#!/usr/bin/env bash
# Déploiement continu de l'API JOJ sur alpha. Lancé toutes les 5 minutes par joj-api-watch.timer.
#
# 1. Si origin/$BRANCH a avancé depuis le dernier déploiement : build de l'image, migrations,
#    redémarrage de l'API, contrôle de santé public. Un commit en échec n'est pas retenté (il faut
#    un nouveau commit), pour ne pas boucler ni spammer.
# 2. À chaque passage : santé de l'API ; une alerte Telegram au passage en panne, une au retour.
#
# Le front n'est pas géré ici : Vercel le redéploie seul à chaque push sur la même branche.
set -uo pipefail

BRANCH="${BRANCH:-main}"
DIR="${DIR:-/opt/joj-api}"
REPO="$DIR/repo"
STATE="$DIR/state"
NOTIFY="${NOTIFY:-/usr/local/bin/notify.sh}"
mkdir -p "$STATE"
exec 9>"$STATE/lock"
flock -n 9 || exit 0

log() { echo "[joj-watch] $*"; }
notify() { [ -x "$NOTIFY" ] && "$NOTIFY" "$1" "${2:-info}" >/dev/null 2>&1 || true; }

ensure_env() {
  cd "$DIR" || return 1
  if ! grep -q '^POSTGRES_PASSWORD=' .env 2>/dev/null; then
    (umask 077 && printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)" >> .env)
  fi
  grep -q '^API_HOST=' .env || echo 'API_HOST=api-joj.artist-dev.com' >> .env
  if ! grep -q '^WRITE_HTPASSWD=' .env; then
    local pass hash
    pass="$(openssl rand -base64 18 | tr -d '/+=')"
    hash="$(openssl passwd -apr1 "$pass")"
    printf "WRITE_USER=jury\nWRITE_PASSWORD='%s'\nWRITE_HTPASSWD='jury:%s'\n" "$pass" "$hash" >> .env
  fi
  chmod 600 .env
}

health() {
  docker inspect -f '{{.State.Health.Status}}' joj-api 2>/dev/null || echo absent
}

deploy() {
  local sha="$1" short="${1:0:7}"
  log "déploiement de $short"
  rm -rf "$DIR/src" && mkdir -p "$DIR/src"
  git -C "$REPO" archive "$sha" | tar -x -C "$DIR/src" || return 1
  cp "$DIR/src/deploy/alpha/docker-compose.yml" "$DIR/docker-compose.yml"
  install -m 755 "$DIR/src/deploy/alpha/watch.sh" "$DIR/watch.sh.next"
  ensure_env || return 1
  cd "$DIR" || return 1
  IMAGE_TAG="$short" docker compose --env-file .env up -d --build --remove-orphans 2>&1 | tail -20
  [ "${PIPESTATUS[0]}" -eq 0 ] || return 1
  for _ in $(seq 1 40); do [ "$(health)" = healthy ] && break; sleep 3; done
  [ "$(health)" = healthy ] || return 1
  local host
  host="$(grep '^API_HOST=' .env | cut -d= -f2)"
  curl -fsS --max-time 15 "https://$host/api/health" >/dev/null || return 1
  docker tag "joj-api:$short" joj-api:latest
  # Garde les 5 images les plus récentes pour pouvoir revenir en arrière.
  docker image ls joj-api --format '{{.CreatedAt}}\t{{.Tag}}' | sort -r | awk -F'\t' '$2!="latest"{print $2}' \
    | tail -n +6 | xargs -r -I{} docker image rm "joj-api:{}" >/dev/null 2>&1
  # Le watcher se met à jour lui-même pour le passage suivant.
  mv "$DIR/watch.sh.next" "$DIR/watch.sh"
}

# deploy.sh (déploiement manuel) s'en sert pour préparer le .env avant son propre `up`.
if [ "${1:-}" = --ensure-env ]; then
  ensure_env
  exit $?
fi

if [ ! -d "$REPO/.git" ]; then
  log "dépôt absent : $REPO"
  exit 1
fi
git -C "$REPO" fetch -q origin "$BRANCH" || { log "git fetch en échec"; exit 1; }
target="$(git -C "$REPO" rev-parse "origin/$BRANCH")"
deployed="$(cat "$STATE/deployed" 2>/dev/null || true)"
failed="$(cat "$STATE/failed" 2>/dev/null || true)"

if [ "$target" != "$deployed" ] && [ "$target" != "$failed" ]; then
  subject="$(git -C "$REPO" log -1 --format=%s "$target")"
  if deploy "$target"; then
    echo "$target" > "$STATE/deployed"
    rm -f "$STATE/failed"
    log "OK ${target:0:7}"
    notify "API JOJ déployée sur alpha : ${target:0:7} « $subject ». https://api-joj.artist-dev.com/api/health répond." success
  else
    echo "$target" > "$STATE/failed"
    logs="$(docker logs --tail 15 joj-api 2>&1; docker logs --tail 10 joj-migrate 2>&1)"
    log "ÉCHEC ${target:0:7}"
    notify "Le déploiement de l'API JOJ a échoué pour ${target:0:7} « $subject ». Cause probable dans les journaux ci-dessous ; la version précédente continue de tourner si son conteneur est intact. Il faut un nouveau commit corrigé sur $BRANCH.
$logs" critical
  fi
fi

state="$(health)"
previous="$(cat "$STATE/health" 2>/dev/null || echo healthy)"
if [ "$state" != healthy ] && [ "$previous" = healthy ]; then
  notify "L'API JOJ sur alpha ne répond plus correctement (état : $state). Le site https://joj-resultats-medailles.vercel.app ne peut plus lire ni enregistrer de résultats. Voir : docker logs joj-api." critical
elif [ "$state" = healthy ] && [ "$previous" != healthy ]; then
  notify "L'API JOJ sur alpha répond de nouveau." success
fi
echo "$state" > "$STATE/health"
