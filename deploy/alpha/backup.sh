#!/usr/bin/env bash
# Sauvegarde quotidienne de la base JOJ (joj-api-backup.timer) : pg_dump au format custom,
# 14 jours conservés dans /opt/joj-api/backups. Restauration :
#   docker exec -i joj-postgres pg_restore -U joj -d joj --clean --if-exists < fichier.dump
set -euo pipefail
DEST="${DEST:-/opt/joj-api/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$DEST" && chmod 700 "$DEST"
file="$DEST/joj-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker exec joj-postgres pg_dump -U joj -d joj -Fc > "$file.tmp"
# Une sauvegarde illisible ne compte pas : on la relit avant de la garder.
docker exec -i joj-postgres pg_restore --list < "$file.tmp" > /dev/null
mv "$file.tmp" "$file"
find "$DEST" -name 'joj-*.dump' -mtime +"$KEEP_DAYS" -delete
echo "Sauvegarde OK : $file ($(du -h "$file" | cut -f1))"
