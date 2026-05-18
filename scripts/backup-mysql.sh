#!/usr/bin/env bash
# AgiliPet — MySQL backup script
# Usage: ./scripts/backup-mysql.sh
# Env vars (or set in server/.env):
#   DATABASE_URL  — mysql://user:pass@host:port/dbname
#   BACKUP_DIR    — directory to store dumps (default: ./backups)
#   KEEP_DAYS     — how many days to retain backups (default: 30)

set -euo pipefail

# --- Load .env if available ---
ENV_FILE="$(dirname "$0")/../server/.env"
if [[ -f "$ENV_FILE" ]]; then
  # Export only DATABASE_URL if not already set
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_URL="${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"

# Parse mysql://user:pass@host:port/dbname
# Strip leading "mysql://"
DB_NO_PROTO="${DB_URL#mysql://}"
DB_USER="${DB_NO_PROTO%%:*}"
DB_REST="${DB_NO_PROTO#*:}"
DB_PASS="${DB_REST%%@*}"
DB_REST2="${DB_REST#*@}"
DB_HOST="${DB_REST2%%:*}"
DB_REST3="${DB_REST2#*:}"
DB_PORT="${DB_REST3%%/*}"
DB_NAME="${DB_REST3#*/}"
# Strip query string if present
DB_NAME="${DB_NAME%%\?*}"

mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
OUT_FILE="$BACKUP_DIR/petcare_${DATE}.sql.gz"

echo "[backup] Dumping database '$DB_NAME' from $DB_HOST:$DB_PORT..."
MYSQL_PWD="$DB_PASS" mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$OUT_FILE"

echo "[backup] Saved to: $OUT_FILE"

# --- Purge old backups ---
if command -v find &>/dev/null; then
  DELETED=$(find "$BACKUP_DIR" -name "petcare_*.sql.gz" -mtime "+${KEEP_DAYS}" -print -delete | wc -l)
  if [[ "$DELETED" -gt 0 ]]; then
    echo "[backup] Purged $DELETED backup(s) older than ${KEEP_DAYS} days"
  fi
fi

echo "[backup] Done."
