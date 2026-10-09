#!/usr/bin/env bash
# ==============================================================================
# GymOS Production Database Automated Backup Script
# Creates compressed, timestamped mongodump archives with oplog for PITR
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/gymos_backup_${TIMESTAMP}.archive.gz"
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/gymos}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] [$(date +'%Y-%m-%d %H:%M:%S')] Starting GymOS database backup..."
echo "[INFO] Target Archive: ${BACKUP_FILE}"

# Execute mongodump with gzip compression and oplog capture (if replica set)
if mongodump --uri="${MONGODB_URI}" --archive="${BACKUP_FILE}" --gzip --oplog; then
  FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "[SUCCESS] [$(date +'%Y-%m-%d %H:%M:%S')] Backup successfully created! Archive size: ${FILE_SIZE}"
else
  echo "[WARN] Retrying mongodump without --oplog (standalone instance detected)..."
  mongodump --uri="${MONGODB_URI}" --archive="${BACKUP_FILE}" --gzip
  echo "[SUCCESS] [$(date +'%Y-%m-%d %H:%M:%S')] Standalone backup completed successfully!"
fi

# Rotate backups older than retention policy
echo "[INFO] Cleaning up archives older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "gymos_backup_*.archive.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} +

echo "[DONE] Backup procedure completed."
