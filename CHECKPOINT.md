# Salsal continuation checkpoint

The active task is the existing SQLite → PostgreSQL migration. Its authoritative progress and exact next step are in [CODEX_MIGRATION_CHECKPOINT.md](CODEX_MIGRATION_CHECKPOINT.md), as requested October 5, 2026. Read that file and actual Git state before editing; do not restart completed work.

The operator backup/import/cutover/rollback procedure is [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md). Work only in `/home/salsal/Desktop/salsal.team`. Preserve existing data, uncommitted changes, UI, role checks and validation. No commits, push or deployment have been performed.
