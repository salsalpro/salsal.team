# Salsal continuation checkpoint

Current feature: existing Blog CMS upgrade. Start with [docs/codex/blog-cms/RESUME.md](docs/codex/blog-cms/RESUME.md), then its CHECKPOINT/TASKS and actual Git state. Work only in `/home/salsal/Desktop/salsal.team`; do not rebuild or redesign the app.

Previous PostgreSQL migration is already in the current committed baseline. Local runtime activation completed; DATABASE_URL is privately configured, and local CMS migration 002 was applied after backup with all three legacy bilingual articles unchanged. Historical migration verification/runbook remains in [CODEX_MIGRATION_CHECKPOINT.md](CODEX_MIGRATION_CHECKPOINT.md) and [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md); their older pending-local-activation statements are historical, not current operational instructions.

CMS production migration/deployment and durable Blob verification remain pending. Preserve data and all existing changes. No commit, push, production migration or deployment was performed in the CMS session.
