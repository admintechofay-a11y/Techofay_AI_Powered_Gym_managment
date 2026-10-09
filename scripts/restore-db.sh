#!/usr/bin/env bash
# ==============================================================================
# GymOS Production Database Restore Script
# Restores compressed archive into target MongoDB cluster
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path-to-archive.gz> [mongodb-uri]"
  echo "Example: $0 ./backups/gymos_backup_20261007_120000.archive.gz mongodb://localhost:27017/gymos"
  exit 1
fi

ARCHIVE_FILE="$1"
MONGODB_URI="${2:-${MONGODB_URI:-mongodb://localhost:27017/gymos}}"

if [ ! -f "${ARCHIVE_FILE}" ]; then
  echo "[ERROR] Archive file '${ARCHIVE_FILE}' not found!"
  exit 1
fi

echo "=============================================================================="
echo "WARNING: RESTORING WILL OVERWRITE EXISTING DATA IN TARGET DATABASE"
echo "Target URI: ${MONGODB_URI}"
echo "Archive File: ${ARCHIVE_FILE}"
echo "=============================================================================="

read -p "Are you sure you want to proceed with restore? (type 'yes' to confirm): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "[ABORTED] Restore canceled by operator."
  exit 0
fi

echo "[INFO] [$(date +'%Y-%m-%d %H:%M:%S')] Commencing mongorestore from ${ARCHIVE_FILE}..."

mongorestore --uri="${MONGODB_URI}" --archive="${ARCHIVE_FILE}" --gzip --drop --oplogReplay

echo "[SUCCESS] [$(date +'%Y-%m-%d %H:%M:%S')] Database successfully restored and re-indexed."
